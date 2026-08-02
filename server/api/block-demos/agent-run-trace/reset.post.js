import { resetAgentRunTrace } from '../../../lib/blockDemos/agentRunTrace.js';

/**
 * Resets the process-local trace investigation workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Fresh trace state.
 */
export async function post() {
	return resetAgentRunTrace();
}
