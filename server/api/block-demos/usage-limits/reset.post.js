import { resetUsageLimits } from '../../../lib/blockDemos/usageLimits.js';

/**
 * Restores the seeded usage-limit demonstration.
 *
 * @returns {Promise<object>} Fresh usage-governance workspace.
 */
export async function post() {
	return resetUsageLimits();
}
