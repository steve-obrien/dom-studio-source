import { resetWorkflowAutomationWorkspace } from '../../../lib/blockDemos/workflowAutomation.js';

/**
 * Restores the deterministic workflow-automation demonstration workspace.
 *
 * @returns {Promise<object>} Reset automation workspace.
 */
export async function post() {
	return resetWorkflowAutomationWorkspace();
}
