import { z } from 'zod';

export const createCustomerSchema = z.object({
  customerName: z.string().min(1),
  mobileNumber: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  businessName: z.string().min(1),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(1),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  followUpDate: z.string().optional().or(z.date().optional()),
  notes: z.string().optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  note: z.string().min(1),
  followUpDate: z.string().optional().or(z.date().optional())
});
