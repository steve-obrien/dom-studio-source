import { getModerationWorkspace } from '../../../lib/blockDemos/contentModeration.js';

/**
 * Returns the moderation queue, reviewer context, counts, and select catalogs.
 *
 * @returns {Promise<object>} Moderation workspace bootstrap payload.
 */
export async function get() {
	return getModerationWorkspace();
}
