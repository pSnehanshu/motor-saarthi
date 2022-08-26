import firebaseAdmin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

function getFirebaseCredentials() {
  // First try to get it from ENV, if not set, read from file
  const buffer = process.env.GOOGLE_SERVICE_ACCOUNT_B64
    ? Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64, 'base64')
    : fs.readFileSync(
        path.join(__dirname, '..', 'google-service-account.json'),
      );

  // Convert to String and then parse
  const creds = JSON.parse(
    buffer.toString('utf8'),
  ) as firebaseAdmin.ServiceAccount;

  return creds;
}

// Intialize Firebase for FCM
const firebase = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(getFirebaseCredentials()),
});

export const fcm = firebase.messaging();
