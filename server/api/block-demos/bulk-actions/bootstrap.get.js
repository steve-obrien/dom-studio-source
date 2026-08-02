import { getBulkActionWorkspace } from '../../../lib/blockDemos/bulkActionOperations.js';

/**
 * Returns the complete bulk action operations workspace.
 *
 * @returns {Promise<object>} Workspace, catalogs, current workflow, and history.
 */
export async function get() {
	return getBulkActionWorkspace();
}
