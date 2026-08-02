import { previewTeamMemberRole } from '../../../../../../lib/blockDemos/teamAccess.js';

/**
 * Previews the capabilities, seat impact, and acknowledgements for a role change.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Role-change preview or API error.
 */
export async function post(req, res) {
	const result = previewTeamMemberRole(req.params.memberId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
