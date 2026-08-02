import { getAgentRunTraceRun } from '../../../../lib/blockDemos/agentRunTrace.js';

/**
 * Returns one agent run and its safe span metadata.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Run detail or API error.
 */
export async function get(req, res) {
	const result = getAgentRunTraceRun(req.params.runId);
	if (result.error) res.status(result.status || 400);
	return result;
}
