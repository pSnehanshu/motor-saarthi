import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();
export default router;

router.use('/auth', authRoutes);
