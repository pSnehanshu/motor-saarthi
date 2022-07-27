import { Router } from 'express';
import { Errors } from '../../shared/errors';
import { RespondError, RespondSuccess } from '../utils/response';
import prisma from '../../prisma/prisma';
import { ContactReasons } from '../../shared/contact-reasons';
import { ValidateRequest } from '../utils/request-validator';
import { IsDefined, IsIn, IsString } from 'class-validator';

const router = Router();
export default router;

router.get('/contact', async (req, res) => {
  const qrId = req.query.qr;
  if (typeof qrId !== 'string') {
    return RespondError(res, Errors.NOT_FOUND, { statusCode: 404 });
  }

  const qr = await prisma.qR.findUnique({
    where: {
      id: qrId,
    },
    include: {
      Vehicle: {
        include: {
          OwnerCustomer: {
            include: {
              User: true,
            },
          },
        },
      },
    },
  });

  if (!qr) {
    return RespondError(res, Errors.NOT_FOUND, { statusCode: 404 });
  }

  res.render('stranger/contact', { qr, reasons: ContactReasons });
});

class ContactDTO {
  @IsDefined()
  @IsString()
  qrId!: string;

  @IsDefined()
  @IsIn(Object.keys(ContactReasons))
  reason!: keyof typeof ContactReasons;
}
router.post(
  '/contact',
  ValidateRequest('body', ContactDTO),
  async (req, res) => {
    try {
      const { qrId, reason } = req.body as ContactDTO;

      const qr = await prisma.qR.findUnique({
        where: { id: qrId },
        include: {
          Vehicle: {
            include: {
              OwnerCustomer: true,
            },
          },
        },
      });
      if (!qr || !qr.vehicle_id) {
        return RespondError(res, Errors.NOT_FOUND, {
          statusCode: 404,
          errorSummary: 'Invalid QR code',
        });
      }

      await prisma.contactAttempt.create({
        data: {
          qr_id: qrId,
          reason,
          vehicle_id: qr.vehicle_id,
        },
      });

      // Push notification to customer

      RespondSuccess(res, null, 200);
    } catch (error) {
      console.error(error);
      RespondError(res, Errors.INTERNAL, { statusCode: 500 });
    }
  },
);
