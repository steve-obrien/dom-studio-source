import { updateTeamAccessPolicy } from '../../../../lib/blockDemos/teamAccess.js';

/**
 * Updates a workspace access policy at an exact revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated team-access workspace or API error.
 */
export async function patch(req, res) {
	const result = updateTeamAccessPolicy(req.params.policyId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
