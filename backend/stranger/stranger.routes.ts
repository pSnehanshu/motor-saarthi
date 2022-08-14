import { Router } from 'express';
import cuid from 'cuid';
import { z } from 'zod';
import { Errors } from '../../shared/errors';
import { RespondError, RespondSuccess } from '../utils/response';
import prisma from '../../prisma/prisma';
import {
  ContactReasons,
  ContactReasonsHumanFriendly,
} from '../../shared/contact-reasons';
import { Expo } from 'expo-server-sdk';
import { sendNotificationQueue } from '../contact.queue';
import { ValidateRequest } from '../utils/request-validator';

const expo = new Expo();

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

  res.render('stranger/contact', { qr, reasons: ContactReasonsHumanFriendly });
});

const ContactDTO = z.object({
  qrId: z.string(),
  reason: z.nativeEnum(ContactReasons),
});
router.post(
  '/contact',
  ValidateRequest('body', ContactDTO),
  async (req, res) => {
    try {
      const { qrId, reason } = req.body as z.output<typeof ContactDTO>;

      const qr = await prisma.qR.findUnique({
        where: { id: qrId },
        include: {
          Vehicle: {
            include: {
              OwnerCustomer: {
                include: {
                  Devices: true,
                },
              },
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

      // Push notification to customer
      const devices = qr.Vehicle?.OwnerCustomer.Devices;
      if (Array.isArray(devices)) {
        devices.forEach((d) => {
          sendNotificationQueue.push({
            message: {
              to: d.expo_push_token,
              title: 'Someone contacted you about your vehicle',
              body: `Your vehicle ${qr.Vehicle?.registration_num} is ${ContactReasonsHumanFriendly[reason]}. Please reach there as soon as possible.`,
            },
            id: cuid(),
            qrId,
            reason,
            vehicleId: qr.vehicle_id!,
            customerId: qr.Vehicle?.owner_cust_id!,
          });
        });
      }

      RespondSuccess(res, null, 200);
    } catch (error) {
      console.error(error);
      RespondError(res, Errors.INTERNAL, { statusCode: 500 });
    }
  },
);
