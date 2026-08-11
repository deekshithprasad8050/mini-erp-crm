import { z } from 'zod';

export const createProductSchema = z.object({
  productName: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  unitPrice: z.number().positive(),
  currentStock: z.number().int().min(0).optional(),
  minimumStock: z.number().int().min(0).optional(),
  warehouseLocation: z.string().min(1)
});

export const updateProductSchema = createProductSchema.partial();

export const stockMovementSchema = z.object({
  quantityChanged: z.number().int().positive(),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(1)
});
