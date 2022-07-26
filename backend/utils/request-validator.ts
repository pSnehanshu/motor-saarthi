import type { Request, Response, NextFunction } from "express";
import type { ValidationError } from "class-validator";
import { transformAndValidate } from "class-transformer-validator";
import _ from "lodash";
import { RespondError } from "./response";
import { Errors } from "../../shared/errors";

declare type Class<T = any> = new (...args: any[]) => T;

export const ValidateRequest =
  (item: "body" | "query", schema: Class<Record<string, any>>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    // Create object
    const data = req[item];

    // Validate
    try {
      const finalData = await transformAndValidate(schema, data, {
        validator: {
          forbidUnknownValues: true,
        },
      });

      // No errors, proceed
      req[item] = finalData;
      return next();
    } catch (e) {
      const errors = e as ValidationError[];

      // Check if there are errors
      if (errors.length > 0) {
        return RespondError(res, Errors.VALIDATION_FAILED, {
          statusCode: 400,
          errorSummary: "You have provided invalid input",
          data: errors.map((e) => _.pick(e, ["property", "constraints"])),
        });
      }
    }
  };
