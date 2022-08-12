import { createReactQueryHooks } from '@trpc/react';
import type { AppRouter } from '../../backend/trpc';
import { getAuthToken } from '../queries/auth';

export const trpc = createReactQueryHooks<AppRouter>();

export const trpcClient = trpc.createClient({
  url: 'http://192.168.29.42:4080/trpc',
  async headers() {
    const token = await getAuthToken();
    return {
      authorization: token ? `Bearer ${token}` : undefined,
    };
  },
});
