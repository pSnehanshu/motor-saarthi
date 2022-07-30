import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Errors } from '../../shared/errors';
import { RespondError } from '../utils/response';

export default function TokenGuard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.header('authorization');
  if (!authHeader) {
    return RespondError(res, Errors.UNAUTHORIZED, {
      statusCode: 401,
      errorSummary: 'Bearer token must be present',
    });
  }

  const token = authHeader.replace('Bearer ', '');

  jwt.verify(
    token,
    'secret123',
    {
      issuer: 'MotorSaarthi',
      audience: 'MotorSaarthi',
    },
    (err, parsed) => {
      if (err) {
        console.error(err);
        return RespondError(res, Errors.UNAUTHORIZED, {
          statusCode: 401,
          errorSummary: 'Failed to parse token',
        });
      }

      if (typeof parsed?.sub === 'string') req.userId = parsed?.sub;

      const customerId = (parsed as any)?.Customer?.id as string;
      if (typeof customerId === 'string') req.customerId = customerId;

      if (req.userId && req.customerId) {
        // Verified user
        next();
      } else {
        RespondError(res, Errors.UNAUTHORIZED, {
          statusCode: 401,
          errorSummary: 'Data in token not currect',
        });
      }
    },
  );
}
