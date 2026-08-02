import { resetCustomerActivityWorkspace } from '../../../lib/blockDemos/customerActivityWorkspace.js';

/**
 * Restores the deterministic customer activity demo.
 *
 * @returns {Promise<object>} Reset workspace.
 */
export async function post() {
	return resetCustomerActivityWorkspace();
}
