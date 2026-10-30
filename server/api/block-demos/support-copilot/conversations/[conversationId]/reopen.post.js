import { reopenSupportConversation } from '../../../../../lib/blockDemos/supportCopilot.js';

/**
 * Reopens a resolved support ticket for another customer follow-up.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Reopened conversation or API error.
 */
export async function post(req, res) {
	const result = reopenSupportConversation(req.params.conversationId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
