import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/response';

export const dashboardController = {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getStats();
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
};
