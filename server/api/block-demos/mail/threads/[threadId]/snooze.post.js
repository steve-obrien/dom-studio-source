import { snoozeMailThread } from '../../../../../lib/blockDemos/mailWorkspace.js';

/**
 * Snoozes one thread until a supported schedule.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Snoozed thread or API error.
 */
export async function post(req, res) {
	const result = snoozeMailThread(req.params.threadId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
