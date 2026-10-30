import { resetBulkActionWorkspace } from '../../../lib/blockDemos/bulkActionOperations.js';

/**
 * Restores the deterministic bulk action example.
 *
 * @returns {Promise<object>} Clean bulk action workspace.
 */
export async function post() {
	return resetBulkActionWorkspace();
}
