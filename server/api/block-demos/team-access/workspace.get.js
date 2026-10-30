import { getTeamAccessWorkspace } from '../../../lib/blockDemos/teamAccess.js';

/**
 * Returns the current team directory, invitation queue, policies, and audit trail.
 *
 * @returns {Promise<object>} Team-access workspace.
 */
export async function get() {
	return getTeamAccessWorkspace();
}
