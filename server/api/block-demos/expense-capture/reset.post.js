import { resetExpenseCaptureWorkspace } from '../../../lib/blockDemos/expenseCapture.js';

/**
 * Restores the deterministic expense inbox.
 *
 * @returns {Promise<Record<string, unknown>>} Reset workspace.
 */
export async function post() {
	return resetExpenseCaptureWorkspace();
}
