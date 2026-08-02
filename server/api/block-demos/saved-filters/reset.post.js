import { resetSavedFiltersWorkspace } from '../../../lib/blockDemos/savedFilters.js';

/**
 * Restores the deterministic saved-filter demonstration workspace.
 *
 * @returns {Promise<object>} Reset workspace payload.
 */
export async function post() {
	return resetSavedFiltersWorkspace();
}
