import { resetTeamAccessWorkspace } from '../../../lib/blockDemos/teamAccess.js';

/**
 * Restores the deterministic team-access demo workspace.
 *
 * @returns {Promise<object>} Reset team-access workspace.
 */
export async function post() {
	return resetTeamAccessWorkspace();
}
