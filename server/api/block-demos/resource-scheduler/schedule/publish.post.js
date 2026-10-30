import { publishResourceSchedule } from '../../../../lib/blockDemos/resourceScheduler.js';

/**
 * Publishes pending schedule changes to the demo provider adapter.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated resource-scheduler payload.
 */
export async function post(req, res) {
	const result = publishResourceSchedule(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
