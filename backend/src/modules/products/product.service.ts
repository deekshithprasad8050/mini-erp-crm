import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { MovementType, Prisma } from '@prisma/client';

export const productService = {
  async getProducts(query: any) {
    const { page = '1', limit = '10', search, category, lowStockOnly } = query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    // For low stock filter, we fetch all then filter since Prisma doesn't support
    // column-to-column comparison. For production, use $queryRaw.
    if (lowStockOnly === 'true') {
      const allProducts = await prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      const filtered = allProducts.filter(p => p.minimumStock > 0 && p.currentStock <= p.minimumStock);
      const total = filtered.length;
      const data = filtered.slice(skip, skip + limitNumber);
      return { data, total, page: pageNumber, limit: limitNumber };
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return { data, total, page: pageNumber, limit: limitNumber };
  },

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  },

  async createProduct(data: any) {
    return await prisma.product.create({
      data
    });
  },

  async updateProduct(id: string, data: any) {
    await this.getProductById(id);
    
    // exclude currentStock from direct updates
    const { currentStock, ...updateData } = data;

    return await prisma.product.update({
      where: { id },
      data: updateData
    });
  },

  async addStockMovement(productId: string, data: any, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (data.movementType === MovementType.OUT) {
        if (product.currentStock < data.quantityChanged) {
          throw new AppError(`Insufficient stock. Available: ${product.currentStock}, requested: ${data.quantityChanged}`, 400);
        }
      }

      const stockUpdate = data.movementType === MovementType.IN 
        ? { increment: data.quantityChanged }
        : { decrement: data.quantityChanged };

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: stockUpdate
        }
      });

      await tx.stockMovement.create({
        data: {
          productId,
          quantityChanged: data.quantityChanged,
          movementType: data.movementType,
          reason: data.reason,
          createdBy: userId
        }
      });

      return updatedProduct;
    });
  },

  async getStockMovements(productId: string, query: any) {
    const { page = '1', limit = '10' } = query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: { productId },
        skip,
        take: limitNumber,
        include: {
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockMovement.count({ where: { productId } })
    ]);

    return { data, total, page: pageNumber, limit: limitNumber };
  }
};
