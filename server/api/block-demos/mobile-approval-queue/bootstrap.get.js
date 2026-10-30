import { getMobileApprovalWorkspace } from '../../../lib/blockDemos/mobileApprovalQueue.js';

/**
 * Returns the complete mobile approval task workspace.
 *
 * @returns {Promise<object>} Approval requests, actor, catalogs, and summary.
 */
export async function get() {
	return getMobileApprovalWorkspace();
}
