import { resetCustomerHealthWorkspace } from '../../../lib/blockDemos/customerHealthWorkspace.js';

/**
 * Restores the deterministic customer health demo.
 *
 * @returns {Promise<object>} Reset workspace.
 */
export async function post() {
	return resetCustomerHealthWorkspace();
}
