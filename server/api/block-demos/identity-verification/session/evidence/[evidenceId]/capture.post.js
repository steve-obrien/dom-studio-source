import { captureIdentityVerificationEvidence } from '../../../../../../lib/blockDemos/identityVerification.js';

/**
 * Captures one evidence item through the demo provider boundary.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated session or provider error.
 */
export async function post(req, res) {
	const result = captureIdentityVerificationEvidence(req.params.evidenceId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
