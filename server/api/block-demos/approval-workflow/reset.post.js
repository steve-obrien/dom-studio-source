import { resetApprovalWorkflow } from '../../../lib/blockDemos/approvalWorkflow.js';

/**
 * Restores the deterministic approval workflow example.
 *
 * @returns {Promise<object>} Clean approval workspace.
 */
export async function post() {
	return resetApprovalWorkflow();
}
