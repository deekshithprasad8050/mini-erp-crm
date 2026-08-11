import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticateUser } from '../../middleware/auth';

const router = Router();

router.use(authenticateUser);

router.get('/stats', dashboardController.getStats);

export default router;
