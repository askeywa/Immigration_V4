import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import logger from '../utils/logger';

/**
 * Validates request body, query, and params against Zod schema
 * 
 * @example
 * const schema = z.object({
 *   body: z.object({ email: z.string().email() }),
 *   query: z.object({ page: z.coerce.number() }),
 *   params: z.object({ id: z.string() })
 * });
 * 
 * router.post('/users/:id', validate(schema), handler);
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate and transform request data
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Replace request data with validated/transformed data
      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;
      
      next();
    } catch (error) {
      handleZodError(error, req, res);
    }
  };
};

/**
 * Validates only request body
 * 
 * @example
 * const schema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8)
 * });
 * 
 * router.post('/login', validateBody(schema), handler);
 */
export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      handleZodError(error, req, res);
    }
  };
};

/**
 * Validates only query parameters
 * 
 * @example
 * const schema = z.object({
 *   page: z.coerce.number().default(1),
 *   limit: z.coerce.number().default(10)
 * });
 * 
 * router.get('/users', validateQuery(schema), handler);
 */
export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      handleZodError(error, req, res);
    }
  };
};

/**
 * Validates only route parameters
 * 
 * @example
 * const schema = z.object({
 *   id: z.string().regex(/^[0-9a-fA-F]{24}$/)
 * });
 * 
 * router.get('/users/:id', validateParams(schema), handler);
 */
export const validateParams = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      handleZodError(error, req, res);
    }
  };
};

/**
 * Handles Zod validation errors and formats them into consistent API response
 */
function handleZodError(error: unknown, req: Request, res: Response): void {
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
      received: 'received' in err ? err.received : undefined,
    }));

    logger.warn('Validation failed', {
      path: req.originalUrl.split('?')[0],
      method: req.method,
      errors: formattedErrors,
      ip: req.ip,
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: formattedErrors,
      },
    });
    return;
  }

  // Unexpected error
  logger.error('Validation middleware error', { 
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Validation failed',
    },
  });
}

