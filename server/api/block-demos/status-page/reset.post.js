import { resetStatusPageWorkspace } from '../../../lib/blockDemos/statusPage.js';

/**
 * Restores the deterministic public status-page demo state.
 *
 * @returns {Promise<object>} Reset status-page workspace.
 */
export async function post() {
	return resetStatusPageWorkspace();
}
