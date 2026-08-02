import { updateEntitlementDraft } from '../../../../lib/blockDemos/entitlementMatrix.js';

/**
 * Saves plan values for one stable entitlement key.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function patch(req, res) {
	const result = updateEntitlementDraft(req.params.entitlementKey, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
