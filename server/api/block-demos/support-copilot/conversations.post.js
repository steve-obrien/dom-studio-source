import { createSupportConversation } from '../../../lib/blockDemos/supportCopilot.js';

/**
 * Creates a new support-copilot conversation.
 *
 * @param {import('express').Request} req HTTP request.
 * @returns {Promise<object>} Created conversation and empty message list.
 */
export async function post(req) {
	return createSupportConversation(req.body || {});
}
