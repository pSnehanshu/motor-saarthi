import Queue from 'better-queue';
import { Expo } from 'expo-server-sdk';
import type { ExpoPushMessage } from 'expo-server-sdk';
import _ from 'lodash';
import { subMinutes } from 'date-fns';
import cuid from 'cuid';
import cron from 'node-cron';
import prisma from '../prisma/prisma';
import { ContactReasons } from '../shared/contact-reasons';

const expo = new Expo();

type NotificationTask = {
  id: string;
  qrId: string;
  vehicleId: string;
  customerId: string;
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
      const promises = tickets.map(async (ticket, index) => {
        const task = batch[index];

        if (ticket.status === 'ok') {
          await prisma.expoPushTicket.create({
            data: {
              ticket_status: 'ok',
              receipt_id: ticket.id,
              contact_attempt_id: task.id,
              customer_id: task.customerId,
              expo_push_token: Array.isArray(task.message.to)
                ? task.message.to[0]
                : task.message.to,
            },
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
      await Promise.allSettled(promises);

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

/** Cron to check for push receipts */
cron.schedule('*/15 * * * *', async () => {
  const dateBefore = subMinutes(new Date(), 30);

  const tickets = await prisma.expoPushTicket.findMany({
    where: {
      created_at: { lt: dateBefore },
      ticket_status: 'ok',
      receipt_id: { not: null },
      receipt_status: null,
    },
    include: {
      ContactAttempt: {
        include: {
          Vehicle: true,
        },
      },
    },
    orderBy: { created_at: 'asc' },
  });

  const chunks = expo.chunkPushNotificationReceiptIds(
    tickets.map((t) => t.receipt_id!),
  );

  console.log(
    `Total tickets to check: ${tickets.length}; Total chunks created: ${chunks.length}`,
  );

  for (const chunk of chunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

      /** Array of Expo Push Tokens */
      const devicesToDeregister: string[] = [];

      const promises = chunk.map(async (receiptId) => {
        const ticket = tickets.find((t) => t.receipt_id === receiptId);
        const receipt = receipts[receiptId];
        if (ticket && receipt) {
          if (receipt.status === 'ok') {
            await prisma.expoPushTicket
              .update({
                where: { id: ticket.id },
                data: {
                  receipt_status: 'ok',
                },
              })
              .catch((err) => {
                console.error('Failed to update ticket status', err);
              });
          } else {
            const errorCode = receipt.details?.error;

            await prisma.expoPushTicket.update({
              where: { id: ticket.id },
              data: {
                receipt_status: 'error',
                receipt_error: errorCode,
              },
            });

            switch (errorCode) {
              case 'DeviceNotRegistered':
                // De-register device(s)
                devicesToDeregister.push(ticket.expo_push_token);
                break;
              case 'MessageRateExceeded':
                // Send after sometime
                const reason = ticket.ContactAttempt
                  .reason as keyof typeof ContactReasons;
                setTimeout(
                  () =>
                    sendNotificationQueue.push({
                      customerId: ticket.customer_id,
                      qrId: ticket.ContactAttempt.qr_id,
                      vehicleId: ticket.ContactAttempt.vehicle_id,
                      reason,
                      id: cuid(),
                      message: {
                        to: ticket.expo_push_token,
                        title: 'Someone contacted you about your vehicle',
                        body: `Your vehicle ${ticket.ContactAttempt.Vehicle?.registration_num} is ${ContactReasons[reason]}. Please reach there as soon as possible.`,
                      },
                    }),
                  _.random(500, 5000),
                );
                break;
              case 'MessageTooBig':
                // Drop
                break;
              // @ts-ignore
              case 'MismatchSenderId':
              case 'InvalidCredentials':
              default:
                // Inform admin
                console.error('Failed to send notification', ticket);
                break;
            }
          }
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Fetch notif receipt error', error);
    }
  }
});
