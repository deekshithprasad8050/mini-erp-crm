import { Request, Response, NextFunction } from 'express';
import { customerService } from './customer.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { AuthRequest } from '../../types';

export const customerController = {
  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.getCustomers(req.query);
      return sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  },

  async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.getCustomerById(req.params.id);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.createCustomer(req.body);
      return sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.updateCustomer(req.params.id, req.body);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      await customerService.deleteCustomer(req.params.id);
      return sendSuccess(res, null, 200, 'Customer deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async getFollowUps(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.getFollowUps(req.params.id, req.query);
      return sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  },

  async createFollowUp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not found');
      const data = await customerService.createFollowUp(req.params.id, req.body, req.user.id);
      return sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  }
};
