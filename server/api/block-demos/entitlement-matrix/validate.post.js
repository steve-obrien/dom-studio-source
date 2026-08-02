import { validatePackageDraft } from '../../../lib/blockDemos/entitlementMatrix.js';

/**
 * Runs authoritative packaging release checks.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Validation evidence or API error.
 */
export async function post(req, res) {
	const result = validatePackageDraft(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
