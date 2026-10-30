import { getFeatureFlagWorkspace } from '../../../lib/blockDemos/featureFlagRelease.js';

/**
 * Returns the complete feature-release workspace.
 *
 * @returns {Promise<object>} Feature flags, catalogs, evidence, and exact revisions.
 */
export async function get() {
	return getFeatureFlagWorkspace();
}
