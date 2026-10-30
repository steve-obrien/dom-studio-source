import { getSupportCenterWorkspace } from '../../../lib/blockDemos/supportCenter.js';

/**
 * Returns queue summaries, service health, and rich support catalogs.
 *
 * @returns {Promise<object>} Support-center workspace.
 */
export async function get() {
	return getSupportCenterWorkspace();
}
