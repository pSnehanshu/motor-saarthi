import Queue from 'better-queue';
import { Expo } from 'expo-server-sdk';
import type { ExpoPushMessage } from 'expo-server-sdk';
import _ from 'lodash';
import { parseISO, addMilliseconds, isAfter } from 'date-fns';
import prisma from '../prisma/prisma';
import { ContactReasons } from '../shared/contact-reasons';

const expo = new Expo();

const checkReceiptAfterMiliseconds = 30 * 60 * 1000;

type ReceiptTask = {
  id: string;
  /** ISO date string */
  startAfter: string;
  notification: NotificationTask;
};
export const receiptQueue = new Queue<ReceiptTask>(
  async (batch: ReceiptTask[], cb) => {
    // Pick tickets that are ready to be checked
    const tasks = batch.filter((b) => {
      const startAfter = parseISO(b.startAfter);

      // Has enough time passed
      const isToBeProcessed = isAfter(new Date(), startAfter);

      if (!isToBeProcessed) {
        // It is too early, enqueue it for later
        // Because of the `afterProcessDelay` option, it will be executed only after 30 mins
        receiptQueue.push(b);
        return false;
      }

      return true;
    });

    if (tasks.length < 1) {
      console.log('No receipts to fetch at the moment');
      return cb();
    }

    try {
      console.log('Fetching receipt...');
      const receipts = await expo.getPushNotificationReceiptsAsync(
        tasks.map((b) => b.id),
      );

      /** Array of Expo Push Tokens */
      const devicesToDeregister: string[] = [];

      tasks.forEach((task) => {
        const receipt = receipts[task.id];
        if (!receipt) {
          // Receipt not generated yet, fetch later
          return receiptQueue.push(task);
        }

        // Receipt generated, check if success
        if (receipt.status === 'error') {
          const errorCode = receipt.details?.error;

          switch (errorCode) {
            case 'DeviceNotRegistered':
              // De-register device(s)
              const { to } = task.notification.message;
              if (Array.isArray(to)) {
                devicesToDeregister.push(...to);
              } else {
                devicesToDeregister.push(to);
              }
              break;
            case 'MessageRateExceeded':
              // Send after sometime
              setTimeout(
                () => sendNotificationQueue.push(task.notification),
                _.random(500, 5000),
              );
              break;
            case 'MessageTooBig':
              // Drop
              break;
            case 'InvalidCredentials':
            default:
              // Inform admin
              console.error('Failed to send notification', receipt);
              break;
          }
        } else {
          // ok
        }
      });

      // Actually deregister the devices
      if (devicesToDeregister.length > 0) {
        try {
          await prisma.device.deleteMany({
            where: {
              expo_push_token: {
                in: devicesToDeregister,
              },
            },
          });
        } catch (error) {
          console.error('Failed to de-register devices', error);
        }
      }

      cb();
    } catch (error) {
      console.error('Fetch receipt', error);

      // Retry after some time
      setTimeout(() => {
        tasks.forEach((b) => {
          receiptQueue.push(b);
        });
      }, 2 * 60 * 1000);

      // Mark as errored
      cb(error);
    }
  },
  { batchSize: 100, afterProcessDelay: checkReceiptAfterMiliseconds },
);

type NotificationTask = {
  id: string;
  qrId: string;
  vehicleId: string;
  reason: keyof typeof ContactReasons;
  message: ExpoPushMessage;
};
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

      const tickets = await expo.sendPushNotificationsAsync(
        batch.map((b) => b.message),
      );

      /** Array of Expo Push Tokens */
      const devicesToDeregister: string[] = [];

      let errorCount = 0;
      tickets.forEach((ticket, index) => {
        const task = batch[index];

        if (ticket.status === 'ok') {
          receiptQueue.push({
            id: ticket.id,
            startAfter: addMilliseconds(
              new Date(),
              checkReceiptAfterMiliseconds,
            ).toISOString(),
            notification: task,
          });
        } else {
          // Handle error
          errorCount++;
          const errorCode = ticket.details?.error;
          console.warn('Error while sending notification to Expo', errorCode);

          switch (errorCode) {
            case 'DeviceNotRegistered':
              // De-register device(s)
              const { to } = task.message;
              if (Array.isArray(to)) {
                devicesToDeregister.push(...to);
              } else {
                devicesToDeregister.push(to);
              }
              break;
            case 'MessageRateExceeded':
              // Send after sometime
              setTimeout(
                () => sendNotificationQueue.push(task),
                _.random(500, 5000),
              );
              break;
            case 'MessageTooBig':
              // Drop
              break;
            case 'InvalidCredentials':
            default:
              // Inform admin
              console.error('Failed to send notification', ticket);
              break;
          }
        }
      });

      // Actually deregister the devices
      if (devicesToDeregister.length > 0) {
        try {
          await prisma.device.deleteMany({
            where: {
              expo_push_token: {
                in: devicesToDeregister,
              },
            },
          });
        } catch (error) {
          console.error('Failed to de-register devices', error);
        }
      }

      if (errorCount > 0) {
        console.warn(`Failed to send ${errorCount} notifications!`);
      }

      cb();
    } catch (error) {
      console.error('Push notif error', error);

      // Retry after some time
      setTimeout(() => {
        batch.forEach((b) => {
          sendNotificationQueue.push(b);
        });
      }, 10000);

      // Mark as errored
      cb(error);
    }
  },
  { batchSize: 100, batchDelayTimeout: 5000 },
);
