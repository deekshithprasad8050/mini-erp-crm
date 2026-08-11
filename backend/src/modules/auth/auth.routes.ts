import { Router } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { loginSchema } from './auth.validator';
import { authenticateUser } from '../../middleware/auth';

const router = Router();

router.post('/', validateBody(loginSchema), authController.login);
router.get('/me', authenticateUser, authController.getMe);

export default router;
