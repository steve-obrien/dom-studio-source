import { getAuthSession } from '../../lib/auth.js';

export async function get(req) {
	return {
		auth: await getAuthSession(req),
	};
}
