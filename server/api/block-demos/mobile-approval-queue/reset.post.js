import { resetMobileApprovalWorkspace } from '../../../lib/blockDemos/mobileApprovalQueue.js';

/**
 * Restores the deterministic mobile approval example.
 *
 * @returns {Promise<object>} Clean mobile approval workspace.
 */
export async function post() {
	return resetMobileApprovalWorkspace();
}
