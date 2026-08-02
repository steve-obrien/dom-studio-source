import { archiveMailThread } from '../../../../../lib/blockDemos/mailWorkspace.js';

/**
 * Archives one thread and returns an undo token.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Archived thread, undo token, or API error.
 */
export async function post(req, res) {
	const result = archiveMailThread(req.params.threadId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
