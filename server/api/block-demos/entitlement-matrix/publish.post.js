import { publishPackageDraft } from '../../../lib/blockDemos/entitlementMatrix.js';

/**
 * Publishes the checked package draft with acknowledgement.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Release receipt or API error.
 */
export async function post(req, res) {
	const result = publishPackageDraft(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
