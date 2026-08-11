import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200, message?: string) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, message: string, statusCode = 400, errors?: any) => {
  const response: ApiResponse<null> = {
    success: false,
    message,
    errors
  };
  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(res: Response, data: T, total: number, page: number, limit: number, statusCode = 200) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
  return res.status(statusCode).json(response);
};
