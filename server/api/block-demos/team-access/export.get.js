import { exportTeamAccessMembers } from '../../../lib/blockDemos/teamAccess.js';

/**
 * Creates an auditable CSV export payload for the current people directory.
 *
 * @returns {Promise<object>} CSV export metadata and content.
 */
export async function get() {
	return exportTeamAccessMembers();
}
