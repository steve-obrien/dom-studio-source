import { getApprovalWorkflowWorkspace } from '../../../lib/blockDemos/approvalWorkflow.js';

/**
 * Returns the complete approval operations workspace.
 *
 * @returns {Promise<object>} Approval requests, actor, catalogs, and summary.
 */
export async function get() {
	return getApprovalWorkflowWorkspace();
}
