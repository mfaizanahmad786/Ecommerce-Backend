import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from './errorHandler.js';

/**
 * Validation middleware factory
 * Creates middleware that validates req.body, req.params, and req.query against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 * 
 * @example
 * router.post('/register', validate(registerSchema), register);
 */
export const validate = (schema: z.ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request against the schema
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      
      // If validation passes, proceed to the next middleware/controller
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Extract and format Zod validation errors
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        // Create a user-friendly error message
        const errorMessage = errors.map((e) => e.message).join(', ');

        // Throw ValidationError which will be caught by global error handler
        next(new ValidationError(`Validation failed: ${errorMessage}`));
      } else {
        // Pass unexpected errors to error handler
        next(error);
      }
    }
  };
};
