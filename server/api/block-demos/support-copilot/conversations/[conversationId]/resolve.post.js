import { resolveSupportConversation } from '../../../../../lib/blockDemos/supportCopilot.js';

/**
 * Resolves an open support ticket after server-owned workflow checks.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Resolved conversation or API error.
 */
export async function post(req, res) {
	const result = resolveSupportConversation(req.params.conversationId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
