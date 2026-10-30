import { getAgentRunTracePayload } from '../../../../../lib/blockDemos/agentRunTrace.js';

/**
 * Returns one redacted span payload with access evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Payload access result or API error.
 */
export async function get(req, res) {
	const result = getAgentRunTracePayload(req.params.runId, req.query.spanId);
	if (result.error) res.status(result.status || 400);
	return result;
}
