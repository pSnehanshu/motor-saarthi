import * as trpc from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';
import jwt, { VerifyOptions, JwtPayload } from 'jsonwebtoken';
import _ from 'lodash';
import { addMinutes, isBefore } from 'date-fns';
import prisma from '../../prisma/prisma';

const isPhoneNumberValidator = z.string().regex(/^[6-9]\d{9}$/gi);

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

  return { userId, customerId };
}
export type Context = trpc.inferAsyncReturnType<typeof createContext>;

function createRouter() {
  return trpc.router<Context>();
}
export const appRouter = createRouter()
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
          /** Expo Push Token */
          ept: z.string(),
        }),
        async resolve({ input, ctx }) {
          const { ept } = input;

          await prisma.device.upsert({
            where: {
              expo_push_token_customer_id: {
                customer_id: ctx.customerId!,
                expo_push_token: ept,
              },
            },
            update: {
              updated_at: new Date(),
            },
            create: {
              expo_push_token: ept,
              customer_id: ctx.customerId!,
            },
            select: null,
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
          token: z
            .string()
            // JWT regex
            .regex(/^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/),
          /** Expo Push Token */
          ept: z.string().optional(),
        }),
        async resolve({ input }) {
          try {
            const { ept, token } = input;

            const parsed = await jwtVerify(token, 'secret123', {
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

            if (ept)
              await prisma.device.deleteMany({
                where: {
                  customer_id: customerId,
                  expo_push_token: ept,
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
  );

// export type definition of API
export type AppRouter = typeof appRouter;