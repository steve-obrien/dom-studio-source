import { suspendTeamMember } from '../../../../../lib/blockDemos/teamAccess.js';

/**
 * Suspends a member after recording a reason and explicit acknowledgement.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated team-access workspace or API error.
 */
export async function post(req, res) {
	const result = suspendTeamMember(req.params.memberId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
