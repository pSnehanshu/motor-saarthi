import { createReactQueryHooks } from '@trpc/react';
import type { AppRouter } from '../../backend/trpc';

export const trpc = createReactQueryHooks<AppRouter>();

export const trpcClient = trpc.createClient({
  url: 'http://192.168.29.42:4080/trpc',

  // optional
  // headers() {
  //   return {
  //     authorization: getAuthCookie(),
  //   };
  // },
});
