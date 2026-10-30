import { updatePackagingSettings } from '../../../lib/blockDemos/entitlementMatrix.js';

/**
 * Saves revisioned packaging context settings.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function patch(req, res) {
	const result = updatePackagingSettings(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
