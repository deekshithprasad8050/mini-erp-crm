import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { CustomerStatus, CustomerType, Prisma } from '@prisma/client';

export const customerService = {
  async getCustomers(query: any) {
    const { page = '1', limit = '10', search, status, customerType } = query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status as CustomerStatus;
    }

    if (customerType) {
      where.customerType = customerType as CustomerType;
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNumber,
        include: {
          _count: {
            select: { followUps: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    return { data, total, page: pageNumber, limit: limitNumber };
  },

  async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          include: {
            user: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return customer;
  },

  async createCustomer(data: any) {
    if (data.followUpDate) {
        data.followUpDate = new Date(data.followUpDate);
    }
    return await prisma.customer.create({
      data
    });
  },

  async updateCustomer(id: string, data: any) {
    await this.getCustomerById(id); // Ensure exists
    
    if (data.followUpDate) {
        data.followUpDate = new Date(data.followUpDate);
    }

    return await prisma.customer.update({
      where: { id },
      data
    });
  },

  async deleteCustomer(id: string) {
    await this.getCustomerById(id);

    const challanCount = await prisma.salesChallan.count({
      where: { customerId: id }
    });

    if (challanCount > 0) {
      throw new AppError('Cannot delete customer with associated challans', 400);
    }

    // Delete associated followups first
    await prisma.customerFollowUp.deleteMany({
      where: { customerId: id }
    });

    return await prisma.customer.delete({
      where: { id }
    });
  },

  async getFollowUps(customerId: string, query: any) {
    const { page = '1', limit = '10' } = query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [data, total] = await Promise.all([
      prisma.customerFollowUp.findMany({
        where: { customerId },
        skip,
        take: limitNumber,
        include: {
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customerFollowUp.count({ where: { customerId } })
    ]);

    return { data, total, page: pageNumber, limit: limitNumber };
  },

  async createFollowUp(customerId: string, data: any, userId: string) {
    await this.getCustomerById(customerId);

    return await prisma.$transaction(async (tx) => {
      const followUp = await tx.customerFollowUp.create({
        data: {
          customerId,
          note: data.note,
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
          createdBy: userId
        }
      });

      if (data.followUpDate) {
        await tx.customer.update({
          where: { id: customerId },
          data: { followUpDate: new Date(data.followUpDate) }
        });
      }

      return followUp;
    });
  }
};
