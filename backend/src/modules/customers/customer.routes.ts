import { Router } from 'express';
import { customerController } from './customer.controller';
import { authenticateUser, authorizeRoles } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createCustomerSchema, updateCustomerSchema, createFollowUpSchema } from './customer.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateUser);

router.get('/', authorizeRoles(Role.ADMIN, Role.SALES, Role.ACCOUNTS), customerController.getCustomers);
router.get('/:id', authorizeRoles(Role.ADMIN, Role.SALES, Role.ACCOUNTS), customerController.getCustomerById);
router.post('/', authorizeRoles(Role.ADMIN, Role.SALES), validateBody(createCustomerSchema), customerController.createCustomer);
router.put('/:id', authorizeRoles(Role.ADMIN, Role.SALES), validateBody(updateCustomerSchema), customerController.updateCustomer);
router.delete('/:id', authorizeRoles(Role.ADMIN), customerController.deleteCustomer);

router.get('/:id/followups', authorizeRoles(Role.ADMIN, Role.SALES), customerController.getFollowUps);
router.post('/:id/followups', authorizeRoles(Role.ADMIN, Role.SALES), validateBody(createFollowUpSchema), customerController.createFollowUp);

export default router;
