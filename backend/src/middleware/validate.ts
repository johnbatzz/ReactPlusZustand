import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validate<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = err.message;
        }
      });

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    req.body = result.data;
    next();
  };
}
