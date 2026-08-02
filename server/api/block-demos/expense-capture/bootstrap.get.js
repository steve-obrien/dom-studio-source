import { getExpenseCaptureWorkspace } from '../../../lib/blockDemos/expenseCapture.js';

/**
 * Returns the complete expense inbox and selected draft.
 *
 * @returns {Promise<Record<string, unknown>>} Expense capture workspace.
 */
export async function get() {
	return getExpenseCaptureWorkspace();
}
