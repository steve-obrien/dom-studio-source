import { listChangelogReleases } from '../../../lib/blockDemos/changelogPublisher.js';

/**
 * Lists release summaries for the changelog publisher navigation.
 *
 * @returns {Promise<{ releases: Array<object> }>} Release summaries.
 */
export async function get() {
	return { releases: listChangelogReleases() };
}
