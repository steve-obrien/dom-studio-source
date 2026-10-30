import { getTeamAccessMember } from '../../../../lib/blockDemos/teamAccess.js';

/**
 * Returns one member with their access evidence and recent activity.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Member detail or API error.
 */
export async function get(req, res) {
	const result = getTeamAccessMember(req.params.memberId);
	if (result.error) res.status(result.status || 404);
	return result;
}
