import { Router } from 'express';
import { Errors } from '../../shared/errors';
import { RespondError } from '../utils/response';
import prisma from '../../prisma/prisma';

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

  res.render('stranger/qr', { qr });
});
