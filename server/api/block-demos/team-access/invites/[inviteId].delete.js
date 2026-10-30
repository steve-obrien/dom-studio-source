import { cancelTeamAccessInvite } from '../../../../lib/blockDemos/teamAccess.js';

/**
 * Cancels a pending or failed invitation at an exact workspace revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated team-access workspace or API error.
 */
export async function del(req, res) {
	const result = cancelTeamAccessInvite(req.params.inviteId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}

export { del as delete };
