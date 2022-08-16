<script lang="ts">
	import type { AppRouter } from '../../../../../backend/trpc';
	import { createTRPCClient } from '@trpc/client';

	const client = createTRPCClient<AppRouter>({
		url: 'http://localhost:4080/trpc'
	});

	let count = 0;

	async function handleClick() {
		count += 1;

		await client.query('ping');
	}
</script>

<h1>Hello world</h1>

<button on:click={handleClick}>Num: {count}</button>
