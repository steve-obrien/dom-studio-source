import { revokeSharePermissionInvitation } from '../../../../../lib/blockDemos/sharePermissions.js';

/**
 * Revokes one pending invitation through the share-permissions demo API.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Revoked invitation and refreshed resource.
 */
export async function del(req, res) {
	const result = revokeSharePermissionInvitation(req.params.resourceId, req.params.inviteId);
	if (result.error) res.status(result.status || 400);
	return result;
}

export { del as delete };
