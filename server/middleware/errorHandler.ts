/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Create an operational error
 */
export class OperationalError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends OperationalError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends OperationalError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends OperationalError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * Bad Request Error
 */
export class BadRequestError extends OperationalError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends OperationalError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

/**
 * Centralized error handler
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details: any = undefined;

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        const target = (err.meta?.target as string[]) || [];
        message = `A record with this ${target.join(', ')} already exists`;
        break;
      case 'P2025':
        // Record not found
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        // Foreign key constraint failed
        message = 'Related record not found';
        break;
      case 'P2014':
        // Required relation violation
        message = 'The change violates a required relation';
        break;
      default:
        message = 'Database operation failed';
    }
  }
  
  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      statusCode,
      message,
      stack: err.stack,
      originalError: err,
    });
  }

  // Log errors in production (use proper logging service)
  if (process.env.NODE_ENV === 'production') {
    // Only log unexpected errors (non-operational)
    if (!err.isOperational) {
      console.error('UNEXPECTED ERROR:', {
        statusCode,
        message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
      });
    }
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected error occurred';
  } else if (process.env.NODE_ENV === 'development') {
    details = {
      stack: err.stack,
      originalError: err.name,
    };
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    statusCode,
    ...(details && { details }),
  });
}

/**
 * Async handler wrapper to catch promise rejections
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new NotFoundError(`Route ${req.method} ${req.url} not found`);
  next(error);
}






