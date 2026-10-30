import { getSharePermissionResource } from '../../../lib/blockDemos/sharePermissions.js';

/**
 * Returns one resource with collaborators, invitations, safeguards, and events.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Resource payload or API error.
 */
export async function get(req, res) {
	const result = getSharePermissionResource(req.params.resourceId);
	if (result.error) res.status(result.status || 400);
	return result;
}
