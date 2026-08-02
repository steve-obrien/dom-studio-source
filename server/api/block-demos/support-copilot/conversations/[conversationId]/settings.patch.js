import { updateSupportConversationSettings } from '../../../../../lib/blockDemos/supportCopilot.js';

/**
 * Updates the selected specialist or priority with optimistic revision checks.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated conversation or API error.
 */
export async function patch(req, res) {
	const result = updateSupportConversationSettings(req.params.conversationId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
