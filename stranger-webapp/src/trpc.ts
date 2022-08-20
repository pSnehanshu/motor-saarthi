import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '../../backend/trpc';

const url =
	typeof window === 'undefined'
		? 'http://localhost:4080/trpc'
		: process.env.NODE_ENV === 'production'
		? '/api/trpc'
		: 'http://localhost:4080/trpc';

export default createTRPCClient<AppRouter>({ url });
