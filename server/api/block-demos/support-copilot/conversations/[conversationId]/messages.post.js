import { sendSupportCopilotMessage } from '../../../../../lib/blockDemos/supportCopilot.js';

/**
 * Sends an operator prompt and returns the persisted copilot response.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated conversation, messages, and assistant response.
 */
export async function post(req, res) {
	const result = sendSupportCopilotMessage(req.params.conversationId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
