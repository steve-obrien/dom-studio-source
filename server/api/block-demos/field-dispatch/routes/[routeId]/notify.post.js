import { sendFieldDispatchRouteUpdate } from '../../../../../lib/blockDemos/fieldDispatch.js';

/**
 * Sends one acknowledged route update through a named provider channel.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = sendFieldDispatchRouteUpdate(req.params.routeId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
