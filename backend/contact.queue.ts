import Queue from 'better-queue';
import _ from 'lodash';
import prisma from './prisma/prisma';
import { ContactReasons } from '../shared/contact-reasons';
import { fcm } from './utils/firebase';

type NotificationTask = {
  id: string;
  qrId: string;
  vehicleId: string;
  customerId: string;
  reason: keyof typeof ContactReasons;
  token: string;
  notif: {
    body?: string;
    title?: string;
    imageUrl?: string;
    data: Record<string, string>;
  };
  attemptNumber: number;
};

function retryNotification(_notifs: NotificationTask | NotificationTask[]) {
  const EXPONENTIAL_BACKOFF_BASE = 5; // sec
  const MAX_ATTEMPTS = 4;

  const notifications = Array.isArray(_notifs) ? _notifs : [_notifs];

  notifications.forEach((notification) => {
    const attempt =
      notification.attemptNumber < 1 ? 1 : notification.attemptNumber;

    if (attempt < MAX_ATTEMPTS) {
      setTimeout(() => {
        sendNotificationQueue.push({
          ...notification,
          attemptNumber: attempt + 1,
        });
      }, Math.pow(EXPONENTIAL_BACKOFF_BASE, attempt) * 1000);
    }
  });
}

export const sendNotificationQueue = new Queue<NotificationTask>(
  async (batch: NotificationTask[], cb) => {
    try {
      await prisma.contactAttempt.createMany({
        data: batch.map((b) => ({
          id: b.id,
          qr_id: b.qrId,
          reason: b.reason,
          vehicle_id: b.vehicleId,
        })),
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Failed create contact attempts', error);
      retryNotification(batch);
      return cb(error);
    }

    try {
      const result = await fcm.sendAll(
        batch.map((item) => ({
          notification: {
            body: item.notif.body,
            imageUrl: item.notif.imageUrl,
            title: item.notif.title,
          },
          data: item.notif.data,
          token: item.token,
        })),
      );

      if (result.failureCount > 0) {
        const failedMessages = result.responses
          .map((r, i) => ({
            notification: batch[i],
            response: r,
          }))
          .filter((r) => !r.response.success);

        // Retry failed notifs
        // Error code ref: https://firebase.google.com/docs/cloud-messaging/send-message#admin

        const devicesTokensToDeregister: string[] = [];

        failedMessages.map(({ notification, response }) => {
          switch (response.error?.code) {
            case 'messaging/invalid-recipient':
            case 'messaging/invalid-registration-token':
            case 'messaging/registration-token-not-registered':
              // De-register device
              devicesTokensToDeregister.push(notification.token);
              break;
            case 'messaging/message-rate-exceeded':
            case 'messaging/device-message-rate-exceeded':
            case 'messaging/topics-message-rate-exceeded':
            case 'messaging/server-unavailable':
            case 'messaging/internal-error':
            case 'messaging/unknown-error':
              // Re-try later
              retryNotification(notification);
              break;
            default:
              console.error(
                `FCM failed: (token: ${notification.token})`,
                response.error,
              );
          }
        });

        // Actually deregister the devices
        if (devicesTokensToDeregister.length > 0) {
          try {
            await prisma.device.deleteMany({
              where: {
                token: {
                  in: devicesTokensToDeregister,
                },
              },
            });
          } catch (error) {
            console.error('Failed to de-register devices', error);
          }
        }
      }

      cb();
    } catch (error) {
      retryNotification(batch);
      cb(error);
    }
  },
  { batchSize: 500, batchDelayTimeout: 5000 },
);
