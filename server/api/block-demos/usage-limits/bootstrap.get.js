import { getUsageLimitsWorkspace } from '../../../lib/blockDemos/usageLimits.js';

/**
 * Returns the complete usage-governance workspace.
 *
 * @returns {Promise<object>} Usage policies, evidence, exceptions, and activity.
 */
export async function get() {
	return getUsageLimitsWorkspace();
}
