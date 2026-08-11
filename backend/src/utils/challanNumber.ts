import { PrismaClient } from '@prisma/client';

export const generateChallanNumber = async (prisma: PrismaClient): Promise<string> => {
  const currentYear = new Date().getFullYear();
  
  const lastChallan = await prisma.salesChallan.findFirst({
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      challanNumber: true
    }
  });

  let nextNumber = 1;

  if (lastChallan) {
    const parts = lastChallan.challanNumber.split('-');
    if (parts.length === 3 && parts[1] === currentYear.toString()) {
      nextNumber = parseInt(parts[2], 10) + 1;
    }
  }

  const paddedNumber = nextNumber.toString().padStart(6, '0');
  return `CH-${currentYear}-${paddedNumber}`;
};
