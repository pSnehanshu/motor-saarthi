import { Response } from "express";
import type { Errors } from "../../shared/errors";
import type {
  ErrorResponse,
  SuccessResponse,
} from "../../shared/responses.type";

export function generateErrorResponse<T>(
  errorType: Errors,
  statusCode: number,
  options?: { errorSummary?: string; data?: T }
): ErrorResponse<T> {
  return {
    success: false,
    statusCode: statusCode,
    type: errorType,
    message: options?.errorSummary ?? "Something went wrong",
    data: options?.data ?? null,
  };
}

export function RespondError(
  res: Response,
  errorType: Errors,
  options?: {
    statusCode?: number;
    errorSummary?: string;
    data?: Record<string, any>;
  }
) {
  const code = options?.statusCode ?? 500;
  return res.status(code).json(
    generateErrorResponse(errorType, code, {
      errorSummary: options?.errorSummary,
      data: options?.data,
    })
  );
}

export function generateSuccessResponse<T>(
  data: T,
  statusCode: number
): SuccessResponse<T> {
  return {
    statusCode,
    data,
    success: true,
  };
}

export function RespondSuccess<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json(generateSuccessResponse(data, statusCode));
}
