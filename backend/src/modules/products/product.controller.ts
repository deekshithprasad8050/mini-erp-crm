import { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { AuthRequest } from '../../types';

export const productController = {
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.getProducts(req.query);
      return sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  },

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await productService.getProductById(req.params.id);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await productService.createProduct(req.body);
      return sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await productService.updateProduct(req.params.id, req.body);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async addStockMovement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('User not found');
      const data = await productService.addStockMovement(req.params.id, req.body, req.user.id);
      return sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  },

  async getStockMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.getStockMovements(req.params.id, req.query);
      return sendPaginated(res, result.data, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }
};
