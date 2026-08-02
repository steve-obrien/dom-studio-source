import { reactivateTeamMember } from '../../../../../lib/blockDemos/teamAccess.js';

/**
 * Reactivates a suspended member when workspace capacity permits.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated team-access workspace or API error.
 */
export async function post(req, res) {
	const result = reactivateTeamMember(req.params.memberId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
