import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../types';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not found in request');
      const data = await authService.getMe(req.user.id);
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }
};
