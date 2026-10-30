import { getSavedFiltersWorkspace } from '../../../lib/blockDemos/savedFilters.js';

/**
 * Returns the saved-view workspace, navigation summaries, and query catalogs.
 *
 * @returns {Promise<object>} Saved-view workspace payload.
 */
export async function get() {
	return getSavedFiltersWorkspace();
}
