import { getMailThread } from '../../../../lib/blockDemos/mailWorkspace.js';

/**
 * Returns one complete mail conversation.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Mail thread or API error.
 */
export async function get(req, res) {
	const result = getMailThread(req.params.threadId);
	if (result.error) res.status(result.status || 400);
	return result;
}
