import { getEntitlementWorkspace } from '../../../lib/blockDemos/entitlementMatrix.js';

/**
 * Returns the complete packaging operations workspace.
 *
 * @returns {Promise<object>} Packaging draft, catalog, and evidence.
 */
export async function get() {
	return getEntitlementWorkspace();
}
