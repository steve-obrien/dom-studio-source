import { getWorkflowAutomationWorkspace } from '../../../lib/blockDemos/workflowAutomation.js';

/**
 * Returns workflow summaries, catalogs, and workspace context.
 *
 * @returns {Promise<object>} Workflow automation bootstrap payload.
 */
export async function get() {
	return getWorkflowAutomationWorkspace();
}
