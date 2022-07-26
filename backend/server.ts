import 'dotenv/config';
// import 'reflect-metadata';
import express from 'express';
import strangerRoutes from './stranger/stranger.routes';

const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.set('view engine', 'ejs');

app.use('/qr', strangerRoutes);

const port = process.env.PORT || 4080;
app.listen(port, () => console.log('MotorSaarthi is running on port', port));
