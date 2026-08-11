import { Request, Response, NextFunction } from 'express';
import { challanService } from './challan.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/errorHandler';

export const challanController = {
  async getChallans(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await challanService.getChallans(req.query);
      return sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  },

  async getChallanById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await challanService.getChallanById(req.params.id);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async createChallan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not found');
      const data = await challanService.createChallan(req.body, req.user.id);
      return sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateChallan(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await challanService.updateChallan(req.params.id, req.body);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async confirmChallan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not found');
      const data = await challanService.confirmChallan(req.params.id, req.user.id);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async cancelChallan(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await challanService.cancelChallan(req.params.id);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
};
