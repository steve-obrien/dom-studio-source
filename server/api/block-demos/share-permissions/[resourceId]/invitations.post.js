import { createSharePermissionInvitation } from '../../../../lib/blockDemos/sharePermissions.js';

/**
 * Creates one pending invitation through the share-permissions demo API.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Created invitation and refreshed resource.
 */
export async function post(req, res) {
	const result = createSharePermissionInvitation(req.params.resourceId, req.body || {});
	if (result.error) {
		res.status(result.status || 400);
		return result;
	}

	res.status(201);
	return result;
}
