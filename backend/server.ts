import 'dotenv/config';
import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import QRCode from 'qrcode';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
import prisma from './prisma/prisma';
import { Errors } from '../shared/errors';
import { RespondError } from './utils/response';
import { appRouter as trpcRouter, createContext } from './trpc';

const app = express();
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.set('trust proxy', true);

app.get('/print-qr/:qrId', async (req, res) => {
  const { qrId } = req.params;
  const proxyHost = req.headers['x-forwarded-host'];
  const host = proxyHost ? proxyHost : req.headers.host;
  const protocol = req.protocol;

  const qr = await prisma.qR.findUnique({
    where: {
      id: qrId,
    },
  });
  if (!qr) {
    return RespondError(res, Errors.NOT_FOUND, { statusCode: 404 });
  }

  const fullUrl = `${protocol}://${host}/qr/${encodeURIComponent(qr?.id)}`;

  const code = await QRCode.toDataURL(fullUrl);
  res.render('qr/index', { qr, qrUrl: code });
});

app.use(cors());

// tRPC
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: trpcRouter,
    createContext,
  }),
);

const port = process.env.PORT || 4080;
app.listen(port, () => console.log('MotorSaarthi is running on port', port));
