import { resetEntitlementMatrix } from '../../../lib/blockDemos/entitlementMatrix.js';

/**
 * Restores the seeded packaging demonstration.
 *
 * @returns {Promise<object>} Fresh packaging workspace.
 */
export async function post() {
	return resetEntitlementMatrix();
}
