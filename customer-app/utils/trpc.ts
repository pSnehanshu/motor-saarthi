import { createReactQueryHooks } from '@trpc/react';
import type { AppRouter } from '../../backend/trpc';
import { getAuthToken } from '../queries/getAuthToken';
import hostname from './hostname';

export const trpc = createReactQueryHooks<AppRouter>();

export const trpcClient = trpc.createClient({
  url: `${hostname}/trpc`,
  async headers() {
    const token = await getAuthToken();
    return {
      authorization: token ? `Bearer ${token}` : undefined,
    };
  },
});
