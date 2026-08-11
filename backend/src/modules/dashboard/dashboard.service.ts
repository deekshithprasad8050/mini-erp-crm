import prisma from '../../config/prisma';
import { CustomerStatus, ChallanStatus } from '@prisma/client';

export const dashboardService = {
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      activeCustomers,
      totalProducts,
      draftChallans,
      confirmedChallans,
      recentChallans,
      upcomingFollowUps
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: CustomerStatus.ACTIVE } }),
      prisma.product.count(),
      prisma.salesChallan.count({ where: { status: ChallanStatus.DRAFT } }),
      prisma.salesChallan.count({ where: { status: ChallanStatus.CONFIRMED } }),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { customerName: true } },
          user: { select: { name: true } }
        }
      }),
      prisma.customer.findMany({
        where: {
          followUpDate: {
            gte: today
          }
        },
        take: 5,
        orderBy: { followUpDate: 'asc' },
        select: {
          id: true,
          customerName: true,
          mobileNumber: true,
          followUpDate: true
        }
      })
    ]);

    // Prisma doesn't directly support comparing two columns in the same table in a where clause natively via prisma client, 
    // but we can query all and filter, or use raw query. For simplicity and since DB might be small, 
    // we'll fetch all or use raw if possible.
    // However, since Prisma doesn't support where fieldA <= fieldB natively, we use raw query
    const lowStockResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "Product" WHERE "currentStock" <= "minimumStock" AND "minimumStock" > 0
    `;
    const lowStockProductsCount = Number(lowStockResult[0].count);

    const lowStockProductsList = await prisma.$queryRaw<any[]>`
      SELECT id, "productName", "sku", "currentStock", "minimumStock"
      FROM "Product"
      WHERE "currentStock" <= "minimumStock" AND "minimumStock" > 0
      ORDER BY "currentStock" ASC
      LIMIT 5
    `;

    return {
      totalCustomers,
      activeCustomers,
      totalProducts,
      lowStockProducts: lowStockProductsCount,
      draftChallans,
      confirmedChallans,
      recentChallans,
      lowStockProductsList,
      upcomingFollowUps
    };
  }
};
