import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { sendError } from '../utils/response';

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, (err as any).errors);
  }

  if (err instanceof ZodError) {
    return sendError(res, 'Validation Error', 400, err.errors);
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return sendError(res, 'Unique constraint failed', 400, err.meta);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Record not found', 404, err.meta);
    }
  }

  if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    return sendError(res, 'Invalid or expired token', 401);
  }

  return sendError(res, 'Internal Server Error', 500);
};
