import { restoreMailThread } from '../../../../../lib/blockDemos/mailWorkspace.js';

/**
 * Restores one recently archived thread with its one-use undo token.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Restored thread or API error.
 */
export async function post(req, res) {
	const result = restoreMailThread(req.params.threadId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
