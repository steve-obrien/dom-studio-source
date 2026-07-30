import { listSharePermissionResources } from '../../../lib/blockDemos/sharePermissions.js';

/**
 * Lists resources available to the API-backed share-permissions block.
 *
 * @returns {Promise<{ resources: Array<object> }>} Resource summaries.
 */
export async function get() {
	return {
		resources: listSharePermissionResources(),
	};
}
