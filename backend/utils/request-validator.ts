import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { RespondError } from './response';
import { Errors } from '../../shared/errors';

export function ValidateRequest(item: 'body' | 'query', schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const data = req[item];
    const result = await schema.safeParseAsync(data);

    if (result.success) {
      const { data: parsed } = result;
      req[item] = parsed;
      next();
    } else {
      RespondError(res, Errors.VALIDATION_FAILED, {
        errorSummary: 'Invalid input',
        data: result.error,
        statusCode: 400,
      });
    }
  };
}
