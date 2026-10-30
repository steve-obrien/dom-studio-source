import { submitIdentityVerification } from '../../../../lib/blockDemos/identityVerification.js';

/**
 * Submits a complete verification packet for manual review.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Submitted packet and receipt or API error.
 */
export async function post(req, res) {
	const result = submitIdentityVerification(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
