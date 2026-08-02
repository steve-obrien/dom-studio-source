import { createAgentRunTraceAction } from '../../../../../lib/blockDemos/agentRunTrace.js';

/**
 * Creates an auditable replay, eval case, or redacted export.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Action receipt or API error.
 */
export async function post(req, res) {
	const result = createAgentRunTraceAction(req.params.runId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
