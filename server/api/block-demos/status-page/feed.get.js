import { getStatusPageFeed } from '../../../lib/blockDemos/statusPage.js';

/**
 * Returns a JSON Feed-compatible stream of public incident updates.
 *
 * @returns {Promise<object>} Public reliability feed.
 */
export async function get() {
	return getStatusPageFeed();
}
