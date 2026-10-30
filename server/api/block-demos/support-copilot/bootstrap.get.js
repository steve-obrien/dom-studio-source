import { getSupportCopilotBootstrap } from '../../../lib/blockDemos/supportCopilot.js';

/**
 * Returns support agents, queue summaries, and rich control options.
 *
 * @returns {Promise<object>} Support-copilot bootstrap payload.
 */
export async function get() {
	return getSupportCopilotBootstrap();
}
