import { getResourceSchedulerWorkspace } from '../../../lib/blockDemos/resourceScheduler.js';

/**
 * Returns the complete resource-scheduler workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Resource-scheduler payload.
 */
export async function get() {
	return getResourceSchedulerWorkspace();
}
