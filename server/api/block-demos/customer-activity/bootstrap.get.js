import { getCustomerActivityWorkspace } from '../../../lib/blockDemos/customerActivityWorkspace.js';

/**
 * Returns the complete customer activity workspace.
 *
 * @returns {Promise<object>} Accounts, events, tasks, and catalogs.
 */
export async function get() {
	return getCustomerActivityWorkspace();
}
