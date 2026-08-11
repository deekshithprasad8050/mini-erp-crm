import { Router } from 'express';
import { productController } from './product.controller';
import { authenticateUser, authorizeRoles } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createProductSchema, updateProductSchema, stockMovementSchema } from './product.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateUser);

router.get('/', authorizeRoles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), productController.getProducts);
router.get('/:id', authorizeRoles(Role.ADMIN, Role.SALES, Role.WAREHOUSE), productController.getProductById);
router.post('/', authorizeRoles(Role.ADMIN), validateBody(createProductSchema), productController.createProduct);
router.put('/:id', authorizeRoles(Role.ADMIN), validateBody(updateProductSchema), productController.updateProduct);

router.post('/:id/stock', authorizeRoles(Role.ADMIN, Role.WAREHOUSE), validateBody(stockMovementSchema), productController.addStockMovement);
router.get('/:id/stock-movements', authorizeRoles(Role.ADMIN, Role.WAREHOUSE), productController.getStockMovements);

export default router;
