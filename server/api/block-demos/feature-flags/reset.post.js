import { resetFeatureFlagWorkspace } from '../../../lib/blockDemos/featureFlagRelease.js';

/**
 * Restores the deterministic feature-flag demo.
 *
 * @returns {Promise<object>} Reset feature-release workspace.
 */
export async function post() {
	return resetFeatureFlagWorkspace();
}
