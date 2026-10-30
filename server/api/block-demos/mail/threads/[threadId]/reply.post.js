import { replyToMailThread } from '../../../../../lib/blockDemos/mailWorkspace.js';

/**
 * Appends an operator reply to a mail conversation.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated thread or API error.
 */
export async function post(req, res) {
	const result = replyToMailThread(req.params.threadId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
