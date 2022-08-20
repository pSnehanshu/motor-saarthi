import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '../../backend/trpc';

export default createTRPCClient<AppRouter>({
	url: 'http://192.168.29.42:4080/trpc'
});
