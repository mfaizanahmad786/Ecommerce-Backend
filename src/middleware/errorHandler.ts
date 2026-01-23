import { Request, Response, NextFunction } from 'express';

// ============================================
// STEP 1: Create Custom Error Classes
// ============================================
// These extend the built-in Error class to add status codes

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message); // Call parent Error constructor with message
    this.statusCode = statusCode;
    this.isOperational = true; // Mark as "expected" error (not a bug)

    // Maintains proper stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types for common HTTP errors
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400); // 400 = Bad Request
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404); // 404 = Not Found
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401); // 401 = Unauthorized (not logged in)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403); // 403 = Forbidden (logged in, but no permission)
  }
}

// ============================================
// STEP 2: Handle Prisma-Specific Errors
// ============================================
// Prisma throws errors with codes like "P2002", "P2025", etc.

const isPrismaError = (err: any): boolean => {
  return err.code && err.code.startsWith('P');
};

const handlePrismaError = (err: any): AppError => {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation (e.g., email already exists)
      const field = err.meta?.target?.[0] || 'field';
      return new ValidationError(`A record with this ${field} already exists`);
    
    case 'P2025':
      // Record not found for update/delete
      return new NotFoundError('Record not found');
    
    case 'P2003':
      // Foreign key constraint failed (invalid reference)
      return new ValidationError('Invalid reference to related record');
    
    case 'P2014':
      // Required relation violation
      return new ValidationError('This operation would violate a required relation');
    
    default:
      // Catch-all for other Prisma errors
      return new AppError('Database error occurred', 500);
  }
};

// ============================================
// STEP 3: Handle JWT Errors
// ============================================
// JWT library throws specific errors we need to catch

const handleJWTError = (): AppError => {
  return new UnauthorizedError('Invalid token. Please log in again.');
};

const handleJWTExpiredError = (): AppError => {
  return new UnauthorizedError('Your token has expired. Please log in again.');
};

// ============================================
// STEP 4: The Global Error Handler
// ============================================
// This is the main error handler middleware
// Must be placed AFTER all routes in index.ts

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Convert error to AppError if it isn't one already
  if (!(err instanceof AppError)) {
    // Check what type of error it is and convert accordingly
    
    if (isPrismaError(err)) {
      // Prisma database errors
      error = handlePrismaError(err);
    } 
    else if (err.name === 'JsonWebTokenError') {
      // Invalid JWT token
      error = handleJWTError();
    } 
    else if (err.name === 'TokenExpiredError') {
      // Expired JWT token
      error = handleJWTExpiredError();
    }
    else {
      // Generic error (fallback)
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Something went wrong';
      error = new AppError(message, statusCode);
    }
  }

  // Log error for debugging (in production, use a proper logger like Winston)
  console.error('❌ ERROR:', {
    message: error.message,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Send consistent error response to client
  res.status(error.statusCode).json({
    status: 'error',
    statusCode: error.statusCode,
    message: error.message,
    // Only include stack trace in development mode
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

// ============================================
// STEP 5: Async Handler Wrapper (BONUS!)
// ============================================
// This eliminates the need for try-catch in async functions
// Wrap your async route handlers with this

export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // If promise rejects, pass error to next() which goes to errorHandler
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// HOW TO USE:
// ============================================
// 
// 1. In index.ts (AFTER all routes):
//    app.use(errorHandler);
//
// 2. In controllers, throw errors:
//    throw new NotFoundError('Product not found');
//    throw new ValidationError('Invalid email');
//
// 3. Or wrap async handlers:
//    export const getProduct = catchAsync(async (req, res) => {
//      const product = await prisma.product.findUnique(...);
//      if (!product) throw new NotFoundError();
//      res.json(product);
//    });
