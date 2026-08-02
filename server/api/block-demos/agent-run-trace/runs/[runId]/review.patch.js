import { updateAgentRunTraceReview } from '../../../../../lib/blockDemos/agentRunTrace.js';

/**
 * Saves revisioned investigation ownership and state.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated run or API error.
 */
export async function patch(req, res) {
	const result = updateAgentRunTraceReview(req.params.runId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
