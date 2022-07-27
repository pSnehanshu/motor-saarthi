import { IsDefined, IsPhoneNumber } from 'class-validator';
import { Router } from 'express';
import { addMinutes, isBefore } from 'date-fns';
import _ from 'lodash';
import { ValidateRequest } from '../utils/request-validator';
import prisma from '../../prisma/prisma';
import { RespondError, RespondSuccess } from '../utils/response';
import { Errors } from '../../shared/errors';

const router = Router();
export default router;

class RequestOtpDTO {
  @IsDefined()
  @IsPhoneNumber('IN')
  phone!: string;
}
router.post(
  '/request-otp',
  ValidateRequest('body', RequestOtpDTO),
  async (req, res) => {
    try {
      const { phone } = req.body as RequestOtpDTO;

      const user = await prisma.user.findUnique({
        where: { phone },
        include: { Customer: true },
      });
      if (user && !user.Customer) {
        return RespondError(res, Errors.LOGIN_FAILED, {
          statusCode: 401,
          errorSummary: 'Non-customers are not allowed to login',
        });
      }

      let otp = _.random(1000, 9999, false).toString();
      if (user?.login_otp && user.login_otp_expiry instanceof Date) {
        if (isBefore(new Date(), user.login_otp_expiry)) {
          otp = user.login_otp;
        }
      }

      const expiry = addMinutes(new Date(), 15);

      // Create the customer, or update OTP
      await prisma.user.upsert({
        where: { phone },
        update: {
          login_otp: otp,
          login_otp_expiry: expiry,
        },
        create: {
          phone,
          is_phone_verified: false,
          login_otp: otp,
          login_otp_expiry: expiry,
          Customer: {
            create: {},
          },
        },
      });

      // Send message
      console.log('OTP is', otp);

      RespondSuccess(res, null, 200);
    } catch (error) {
      console.error(error);
      RespondError(res, Errors.INTERNAL, { statusCode: 500 });
    }
  },
);
