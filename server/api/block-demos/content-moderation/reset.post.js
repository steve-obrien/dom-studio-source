import { resetModerationWorkspace } from '../../../lib/blockDemos/contentModeration.js';

/**
 * Restores deterministic moderation queue state.
 *
 * @returns {Promise<object>} Reset moderation workspace.
 */
export async function post() {
	return resetModerationWorkspace();
}
