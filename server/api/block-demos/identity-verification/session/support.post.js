import { requestIdentityVerificationSupport } from '../../../../lib/blockDemos/identityVerification.js';

/**
 * Records a scoped verification support request.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Support request proof or API error.
 */
export async function post(req, res) {
	const result = requestIdentityVerificationSupport(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
