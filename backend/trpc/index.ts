import * as trpc from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';
import jwt, { VerifyOptions, JwtPayload } from 'jsonwebtoken';
import { DeviceType } from '@prisma/client';
import _ from 'lodash';
import QRCode from 'qrcode';
import { addMinutes, isBefore } from 'date-fns';
import prisma from '../prisma/prisma';
import { ContactReasons } from '../../shared/contact-reasons';
import { sendNotificationQueue } from '../contact.queue';
import cuid from 'cuid';

const isPhoneNumberValidator = z.string().regex(/^[6-9]\d{9}$/gi);

type QRVerify = {
  isAvailable: boolean;
  reason: string;
};
async function checkQrAvailability(qrId: string) {
  const qr = await prisma.qR.findUnique({
    where: {
      id: qrId,
    },
    select: {
      vehicle_id: true,
    },
  });

  if (!qr) {
    return {
      isAvailable: false,
      reason: 'QR does not exists',
    };
  }

  if (typeof qr.vehicle_id === 'string') {
    return {
      isAvailable: false,
      reason: 'QR already linked to another vehicle',
    };
  }

  return {
    isAvailable: true,
    reason: 'Ok',
  };
}

function jwtVerify(token: string, secret: string, options: VerifyOptions) {
  return new Promise<JwtPayload>((resolve, reject) => {
    jwt.verify(token, secret, options, (err, parsed) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(parsed as JwtPayload);
      }
    });
  });
}

export async function createContext(
  opts: trpcExpress.CreateExpressContextOptions,
) {
  const { req, res } = opts;
  const authHeader = req.header('authorization');
  let userId: string | undefined = undefined;
  let customerId: string | undefined = undefined;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const parsed = await jwtVerify(token, 'secret123', {
      issuer: 'MotorSaarthi',
      audience: 'MotorSaarthi',
    });

    userId = typeof parsed?.sub === 'string' ? parsed.sub : undefined;
    customerId =
      typeof parsed?.Customer?.id === 'string' ? parsed.Customer.id : undefined;
  }

  return { userId, customerId, req };
}
export type Context = trpc.inferAsyncReturnType<typeof createContext>;

function createRouter() {
  return trpc.router<Context>();
}
export const appRouter = createRouter()
  .query('ping', {
    input: z.string().default('N/A'),
    resolve({ input }) {
      console.log(new Date(), 'Ping received! Device said:', input);
    },
  })
  .merge(
    'customer.',
    createRouter()
      .middleware(async ({ ctx, next }) => {
        if (ctx.customerId && ctx.userId) {
          return next();
        }

        throw new trpc.TRPCError({
          code: 'UNAUTHORIZED',
        });
      })
      .mutation('register-device', {
        input: z.object({
          token: z.string(),
          type: z.nativeEnum(DeviceType),
        }),
        async resolve({ input, ctx }) {
          const { token, type } = input;

          await prisma.device.upsert({
            where: {
              token_customer_id_type: {
                customer_id: ctx.customerId!,
                type,
                token,
              },
            },
            update: {
              updated_at: new Date(),
            },
            create: {
              token,
              type,
              customer_id: ctx.customerId!,
            },
            select: null,
          });
        },
      })
      .query('fetch-vehicles', {
        input: z.object({
          take: z.number().default(10),
          skip: z.number().default(0),
        }),
        async resolve({ input, ctx }) {
          const vehicles = await prisma.vehicle.findMany({
            where: {
              owner_cust_id: ctx.customerId,
            },
            skip: input.skip,
            take: input.take,
            orderBy: {
              created_at: 'desc',
            },
          });

          return vehicles;
        },
      })
      .query('vehicle-info', {
        input: z.object({
          id: z.string().cuid(),
        }),
        async resolve({ input, ctx }) {
          const vehicle = await prisma.vehicle.findFirst({
            where: {
              id: input.id,
              owner_cust_id: ctx.customerId,
            },
            include: {
              QR: true,
            },
          });

          if (!vehicle) {
            throw new trpc.TRPCError({
              code: 'NOT_FOUND',
              message: `Vehicle ${input.id} not found`,
            });
          }

          // Generate QR code
          let qrCodeURL: string | null = null;
          if (vehicle.QR) {
            const proxyHost = ctx.req.headers['x-forwarded-host'];
            const host = proxyHost ? proxyHost : ctx.req.headers.host;
            const protocol = ctx.req.protocol;

            const fullUrl = `${protocol}://${host}/qr/${encodeURIComponent(
              vehicle.QR.id,
            )}`;
            try {
              const code = await QRCode.toDataURL(fullUrl);
              qrCodeURL = code;
            } catch (error) {
              console.error(error);
            }
          }

          return {
            ...vehicle,
            qrCodeURL,
          };
        },
      })
      .query('validate-qr', {
        input: z.object({
          qrId: z.string().cuid(),
        }),
        resolve({ input }) {
          return checkQrAvailability(input.qrId);
        },
      })
      .mutation('register-vehicle', {
        input: z.object({
          qrId: z.string().cuid(),
          id: z.string().cuid().optional(),
          name: z.string(),
          regNum: z.string(),
          wheelCount: z.enum(['2', '3', '4']).default('2'),
        }),
        async resolve({ input, ctx }) {
          // Validate QR
          const availability = await checkQrAvailability(input.qrId);
          if (!availability.isAvailable) {
            throw new trpc.TRPCError({
              code: 'CONFLICT',
              message: availability.reason,
            });
          }

          let vehicleId: string;

          if (input.id) {
            // Check if vehicle exists and belongs to this customer
            const vehicle = await prisma.vehicle.findUnique({
              where: { id: input.id },
              select: { id: true, owner_cust_id: true },
            });

            if (!vehicle || vehicle.owner_cust_id !== ctx.customerId) {
              throw new trpc.TRPCError({
                code: 'NOT_FOUND',
                message:
                  'Vehicle not found, do not submit id to create a new one',
              });
            }

            vehicleId = vehicle.id;
          } else {
            // Create vehicle
            const vehicle = await prisma.vehicle.create({
              data: {
                name: input.name,
                registration_num: input.regNum,
                owner_cust_id: ctx.customerId!,
                wheelCount: input.wheelCount,
              },
              select: { id: true },
            });

            vehicleId = vehicle.id;
          }

          // Assign QR to the vehicle
          await prisma.qR.update({
            where: {
              id: input.qrId,
            },
            data: {
              vehicle_id: vehicleId,
            },
          });

          return { id: vehicleId };
        },
      })
      .mutation('unlink-vehicle', {
        input: z.object({
          vehicleId: z.string().cuid(),
        }),
        async resolve({ input, ctx }): Promise<void> {
          // Fetch vehicle and QR
          const vehicle = await prisma.vehicle.findFirst({
            where: {
              id: input.vehicleId,
              owner_cust_id: ctx.customerId,
            },
            include: {
              QR: true,
            },
          });

          if (!vehicle) {
            throw new trpc.TRPCError({
              code: 'NOT_FOUND',
              message: `Vehicle ${input.vehicleId} either doesn't exist or doesn't belong to you`,
            });
          }
          if (!vehicle.QR) {
            throw new trpc.TRPCError({
              code: 'BAD_REQUEST',
              message: `Vehicle ${input.vehicleId} isn't linked to any QR`,
            });
          }

          // Unlink QR
          await prisma.qR.update({
            where: { id: vehicle.QR.id },
            data: { vehicle_id: null },
          });
        },
      }),
  )
  .merge(
    'auth.',
    createRouter()
      .mutation('request-otp', {
        input: z.object({
          phone: isPhoneNumberValidator,
        }),
        async resolve({ input }) {
          const { phone } = input;

          const user = await prisma.user.findUnique({
            where: { phone },
            include: { Customer: true },
          });
          if (user && !user.Customer) {
            throw new trpc.TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Non-customers are not allowed to login',
            });
          }

          let otp = _.random(1000, 9999, false).toString();
          if (user?.login_otp && user.login_otp_expiry instanceof Date) {
            if (isBefore(new Date(), user.login_otp_expiry)) {
              otp = user.login_otp;
            }
          }

          const expiry = addMinutes(new Date(), 15);

          // Create the customer, or update OTP
          await prisma.user.upsert({
            where: { phone },
            update: {
              login_otp: otp,
              login_otp_expiry: expiry,
            },
            create: {
              phone,
              is_phone_verified: false,
              login_otp: otp,
              login_otp_expiry: expiry,
              Customer: {
                create: {},
              },
            },
          });

          // Send message
          console.log('OTP is', otp);

          return null;
        },
      })
      .mutation('submit-otp', {
        input: z.object({
          otp: z.string().length(4),
          phone: isPhoneNumberValidator,
        }),
        async resolve({ input }) {
          const { otp, phone } = input;

          const user = await prisma.user.findUnique({
            where: { phone },
            include: { Customer: true },
          });
          if (!user) {
            throw new trpc.TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Login failed',
            });
          }
          if (!user.Customer) {
            throw new trpc.TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Non-customers are not allowed to login',
            });
          }
          if (!user.login_otp || !user.login_otp_expiry) {
            throw new trpc.TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid OTP',
            });
          }

          const hasExpired = !isBefore(new Date(), user.login_otp_expiry);
          if (hasExpired) {
            throw new trpc.TRPCError({
              code: 'UNAUTHORIZED',
              message: 'OTP expired',
            });
          }

          if (otp !== user.login_otp) {
            throw new trpc.TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid OTP',
            });
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              login_otp: null,
              login_otp_expiry: null,
            },
          });

          const token = jwt.sign(user, 'secret123', {
            issuer: 'MotorSaarthi',
            subject: user.id,
            audience: 'MotorSaarthi',
            expiresIn: '365 days',
          });

          return { user, token };
        },
      })
      .mutation('logout', {
        input: z.object({
          jwtToken: z
            .string()
            // JWT regex
            .regex(/^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/),
          regtoken: z.string().optional(),
          deviceType: z.nativeEnum(DeviceType).optional(),
        }),
        async resolve({ input }) {
          try {
            const { regtoken, jwtToken, deviceType } = input;

            const parsed = await jwtVerify(jwtToken, 'secret123', {
              issuer: 'MotorSaarthi',
              audience: 'MotorSaarthi',
            });

            const customerId = parsed?.Customer?.id as string;
            if (typeof customerId !== 'string') {
              throw new trpc.TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to extract customer id from JWT token',
              });
            }

            if (regtoken && deviceType)
              await prisma.device.deleteMany({
                where: {
                  customer_id: customerId,
                  token: regtoken,
                  type: deviceType,
                },
              });

            return null;
          } catch (error) {
            console.error(error);
            throw new trpc.TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to parse JWT token',
            });
          }
        },
      }),
  )
  .merge(
    'stranger.',
    createRouter()
      .query('index', {
        input: z.object({
          qrId: z.string(),
        }),
        async resolve({ input }) {
          const { qrId } = input;

          const qr = await prisma.qR.findUnique({
            where: {
              id: qrId,
            },
            include: {
              Vehicle: {
                include: {
                  OwnerCustomer: {
                    include: {
                      User: {
                        select: {
                          id: true,
                          name: true,
                          created_at: true,
                          updated_at: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          if (!qr) {
            throw new trpc.TRPCError({
              code: 'NOT_FOUND',
            });
          }

          return qr;
        },
      })
      .mutation('contact', {
        input: z.object({
          qrId: z.string(),
          reason: z.nativeEnum(ContactReasons),
        }),
        async resolve({ input }) {
          const { qrId, reason } = input;

          // Find the QR code
          const qr = await prisma.qR.findUnique({
            where: { id: qrId },
            include: {
              Vehicle: {
                include: {
                  OwnerCustomer: {
                    include: {
                      Devices: true,
                    },
                  },
                },
              },
            },
          });
          if (!qr || !qr.vehicle_id) {
            throw new trpc.TRPCError({
              code: 'NOT_FOUND',
              message: 'Invalid QR code',
            });
          }

          // Push notification to customer
          const devices = qr.Vehicle?.OwnerCustomer.Devices;
          if (Array.isArray(devices)) {
            devices.forEach((d) => {
              sendNotificationQueue.push({
                id: cuid(),
                qrId,
                reason,
                vehicleId: qr.vehicle_id!,
                customerId: qr.Vehicle?.owner_cust_id!,
                token: d.token,
                attemptNumber: 1,
                notif: {
                  data: {
                    reason,
                    vehicleId: qr.vehicle_id!,
                    vehicleRegNum: qr.Vehicle?.registration_num!,
                  },
                },
              });
            });
          }
        },
      }),
  );

// export type definition of API
export type AppRouter = typeof appRouter;
