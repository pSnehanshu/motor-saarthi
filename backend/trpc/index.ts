import * as trpc from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';

// created for each request
export const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => ({});
export type Context = trpc.inferAsyncReturnType<typeof createContext>;

export const appRouter = trpc
  .router<Context>()
  .query('getUser', {
    input: z.string(),
    async resolve(req) {
      req.input; // string
      return { id: req.input, name: 'Bilbo' };
    },
  })
  .mutation('createUser', {
    // validate input with Zod
    input: z.object({ name: z.string().min(5) }),
    async resolve(req) {
      // use your ORM of choice
      // return await UserModel.create({
      //   data: req.input,
      // });
      return 1;
    },
  });

// export type definition of API
export type AppRouter = typeof appRouter;
