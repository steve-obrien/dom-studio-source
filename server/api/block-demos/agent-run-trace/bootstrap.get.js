import { getAgentRunTraceBootstrap } from '../../../lib/blockDemos/agentRunTrace.js';

/**
 * Returns the agent run queue and reusable filter options.
 *
 * @returns {Promise<Record<string, unknown>>} Agent trace bootstrap payload.
 */
export async function get() {
	return getAgentRunTraceBootstrap();
}
