import { resendTeamAccessInvite } from '../../../../../lib/blockDemos/teamAccess.js';

/**
 * Retries a failed invitation or refreshes a pending invitation expiry.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated team-access workspace or API error.
 */
export async function post(req, res) {
	const result = resendTeamAccessInvite(req.params.inviteId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
