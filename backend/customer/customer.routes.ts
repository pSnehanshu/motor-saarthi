import { IsDefined, IsString } from 'class-validator';
import { Router } from 'express';
import prisma from '../../prisma/prisma';
import { ValidateRequest } from '../utils/request-validator';
import { RespondSuccess } from '../utils/response';
import authRoutes from './auth.routes';
import TokenGuard from './token.guard';

const router = Router();
export default router;

router.use('/auth', authRoutes);

// Protect routes
router.use(TokenGuard);

class RegisterDeviceDTO {
  /** Expo Push Token */
  @IsDefined()
  @IsString()
  ept!: string;
}
router.post(
  '/register-device',
  ValidateRequest('body', RegisterDeviceDTO),
  async (req, res) => {
    const { ept } = req.body as RegisterDeviceDTO;

    await prisma.device.upsert({
      where: {
        expo_push_token_customer_id: {
          customer_id: req.customerId!,
          expo_push_token: ept,
        },
      },
      update: {
        updated_at: new Date(),
      },
      create: {
        expo_push_token: ept,
        customer_id: req.customerId!,
      },
      select: null,
    });

    RespondSuccess(res, null);
  },
);
