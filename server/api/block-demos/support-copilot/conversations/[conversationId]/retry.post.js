import { retrySupportCopilotMessage } from '../../../../../lib/blockDemos/supportCopilot.js';

/**
 * Retries the latest failed support-copilot tool call.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Recovered conversation or API error.
 */
export async function post(req, res) {
	const result = retrySupportCopilotMessage(req.params.conversationId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
