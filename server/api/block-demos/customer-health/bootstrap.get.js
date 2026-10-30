import { getCustomerHealthWorkspace } from '../../../lib/blockDemos/customerHealthWorkspace.js';

/**
 * Returns the complete customer health workspace.
 *
 * @returns {Promise<object>} Portfolio, selected account, catalogs, and workflow state.
 */
export async function get() {
	return getCustomerHealthWorkspace();
}
