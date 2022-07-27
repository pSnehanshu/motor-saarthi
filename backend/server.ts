import 'dotenv/config';
// import 'reflect-metadata';
import express from 'express';
import QRCode from 'qrcode';
import bodyParser from 'body-parser';
import prisma from '../prisma/prisma';
import { Errors } from '../shared/errors';
import strangerRoutes from './stranger/stranger.routes';
import { RespondError } from './utils/response';

const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('trust proxy', true);

app.use('/qr', strangerRoutes);

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

  const fullUrl = `${protocol}://${host}/qr/contact?qr=${encodeURIComponent(
    qr?.id,
  )}`;

  QRCode.toDataURL(fullUrl, (err, code) => {
    res.render('qr/index', { qr, qrUrl: code });
  });
});

const port = process.env.PORT || 4080;
app.listen(port, () => console.log('MotorSaarthi is running on port', port));
