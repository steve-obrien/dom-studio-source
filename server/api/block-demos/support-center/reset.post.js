import { resetSupportCenterWorkspace } from '../../../lib/blockDemos/supportCenter.js';

/**
 * Restores the deterministic support-center demo workspace.
 *
 * @returns {Promise<object>} Reset support workspace.
 */
export async function post() {
	return resetSupportCenterWorkspace();
}
