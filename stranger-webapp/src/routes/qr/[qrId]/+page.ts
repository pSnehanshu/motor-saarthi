import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import client from '../../../trpc';

export const load: PageLoad = async ({ params }) => {
	try {
		const { qrId } = params;
		const qr = await client.query('stranger.index', { qrId });
		return qr;
	} catch (err) {
		console.error(err);
		throw error(404, 'Not found');
	}
};
