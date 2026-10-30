import { getSupportConversation } from '../../../../lib/blockDemos/supportCopilot.js';

/**
 * Returns one support conversation and its ordered message history.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Conversation payload or API error.
 */
export async function get(req, res) {
	const result = getSupportConversation(req.params.conversationId);
	if (result.error) res.status(result.status || 400);
	return result;
}
