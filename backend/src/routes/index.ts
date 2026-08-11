import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import customerRoutes from '../modules/customers/customer.routes';
import productRoutes from '../modules/products/product.routes';
import challanRoutes from '../modules/challans/challan.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/challans', challanRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
