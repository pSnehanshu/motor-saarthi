import { Errors } from "./errors";

export type SuccessResponse<T = unknown> = {
  statusCode: number;
  success: true;
  data: T;
};

export type ErrorResponse<T = unknown> = {
  statusCode: number;
  success: false;
  data: null | T;
  type: Errors;
  message: string;
};
