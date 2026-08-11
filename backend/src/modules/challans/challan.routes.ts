import { Router } from 'express';
import { challanController } from './challan.controller';
import { authenticateUser, authorizeRoles } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createChallanSchema, updateChallanSchema } from './challan.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticateUser);

router.get('/', authorizeRoles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), challanController.getChallans);
router.get('/:id', authorizeRoles(Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS), challanController.getChallanById);
router.post('/', authorizeRoles(Role.ADMIN, Role.SALES), validateBody(createChallanSchema), challanController.createChallan);
router.put('/:id', authorizeRoles(Role.ADMIN, Role.SALES), validateBody(updateChallanSchema), challanController.updateChallan);

router.post('/:id/confirm', authorizeRoles(Role.ADMIN, Role.SALES), challanController.confirmChallan);
router.post('/:id/cancel', authorizeRoles(Role.ADMIN, Role.SALES), challanController.cancelChallan);

export default router;
