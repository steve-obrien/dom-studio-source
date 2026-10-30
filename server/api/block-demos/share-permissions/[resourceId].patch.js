import { updateSharePermissionResource } from '../../../lib/blockDemos/sharePermissions.js';

/**
 * Validates and applies link, safeguard, and collaborator-role changes.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated resource or API validation error.
 */
export async function patch(req, res) {
	const result = updateSharePermissionResource(req.params.resourceId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
