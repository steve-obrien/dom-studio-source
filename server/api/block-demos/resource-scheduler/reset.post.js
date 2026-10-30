import { resetResourceSchedulerWorkspace } from '../../../lib/blockDemos/resourceScheduler.js';

/**
 * Restores the deterministic resource-scheduler workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Reset resource-scheduler payload.
 */
export async function post() {
	return resetResourceSchedulerWorkspace();
}
