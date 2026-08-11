import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { ChallanStatus, MovementType, Prisma } from '@prisma/client';
import { generateChallanNumber } from '../../utils/challanNumber';

export const challanService = {
  async getChallans(query: any) {
    const { page = '1', limit = '10', status, customerId } = query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.SalesChallanWhereInput = {};

    if (status) where.status = status as ChallanStatus;
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limitNumber,
        include: {
          customer: { select: { customerName: true } },
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.salesChallan.count({ where })
    ]);

    return { data, total, page: pageNumber, limit: limitNumber };
  },

  async getChallanById(id: string) {
    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { productName: true, sku: true } }
          }
        },
        customer: true,
        user: { select: { name: true, email: true } }
      }
    });

    if (!challan) {
      throw new AppError('Challan not found', 404);
    }

    return challan;
  },

  async createChallan(data: any, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) throw new AppError('Customer not found', 404);

      let totalQuantity = 0;
      const challanItemsData = [];

      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new AppError(`Product with ID ${item.productId} not found`, 404);

        const totalPrice = Number(product.unitPrice) * item.quantity;
        totalQuantity += item.quantity;

        challanItemsData.push({
          productId: product.id,
          productNameSnapshot: product.productName,
          skuSnapshot: product.sku,
          unitPriceSnapshot: product.unitPrice,
          quantity: item.quantity,
          totalPrice
        });
      }

      const challanNumber = await generateChallanNumber(tx as any);

      const challan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId: data.customerId,
          totalQuantity,
          status: ChallanStatus.DRAFT,
          createdBy: userId,
          items: {
            create: challanItemsData
          }
        },
        include: {
          items: true
        }
      });

      return challan;
    });
  },

  async updateChallan(id: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.findUnique({ where: { id } });
      
      if (!challan) throw new AppError('Challan not found', 404);
      if (challan.status !== ChallanStatus.DRAFT) throw new AppError('Only DRAFT challans can be updated', 400);

      const updateData: any = {};
      if (data.customerId) {
        const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
        if (!customer) throw new AppError('Customer not found', 404);
        updateData.customerId = data.customerId;
      }

      if (data.items && data.items.length > 0) {
        await tx.salesChallanItem.deleteMany({ where: { challanId: id } });

        let totalQuantity = 0;
        const challanItemsData = [];

        for (const item of data.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) throw new AppError(`Product with ID ${item.productId} not found`, 404);

          const totalPrice = Number(product.unitPrice) * item.quantity;
          totalQuantity += item.quantity;

          challanItemsData.push({
            productId: product.id,
            productNameSnapshot: product.productName,
            skuSnapshot: product.sku,
            unitPriceSnapshot: product.unitPrice,
            quantity: item.quantity,
            totalPrice
          });
        }

        updateData.totalQuantity = totalQuantity;
        updateData.items = { create: challanItemsData };
      }

      return await tx.salesChallan.update({
        where: { id },
        data: updateData,
        include: { items: true }
      });
    });
  },

  async confirmChallan(id: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!challan) throw new AppError('Challan not found', 404);
      if (challan.status !== ChallanStatus.DRAFT) throw new AppError('Only DRAFT challans can be confirmed', 400);

      const insufficientStockErrors = [];

      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new AppError(`Product ${item.productNameSnapshot} not found`, 404);

        if (product.currentStock < item.quantity) {
          insufficientStockErrors.push({
            productId: product.id,
            productName: product.productName,
            available: product.currentStock,
            requested: item.quantity
          });
        }
      }

      if (insufficientStockErrors.length > 0) {
        const error = new AppError('Insufficient stock for one or more products', 400);
        (error as any).errors = insufficientStockErrors;
        throw error;
      }

      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } }
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: MovementType.OUT,
            reason: `Sales Challan ${challan.challanNumber}`,
            createdBy: userId
          }
        });
      }

      return await tx.salesChallan.update({
        where: { id },
        data: { status: ChallanStatus.CONFIRMED },
        include: { items: true }
      });
    });
  },

  async cancelChallan(id: string) {
    const challan = await prisma.salesChallan.findUnique({ where: { id } });
    
    if (!challan) throw new AppError('Challan not found', 404);
    if (challan.status !== ChallanStatus.DRAFT) throw new AppError('Only DRAFT challans can be cancelled', 400);

    return await prisma.salesChallan.update({
      where: { id },
      data: { status: ChallanStatus.CANCELLED }
    });
  }
};
