import { saveIdentityVerificationDeclarations } from '../../../../lib/blockDemos/identityVerification.js';

/**
 * Saves consent and PEP declarations for the applicant.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated session or validation error.
 */
export async function patch(req, res) {
	const result = saveIdentityVerificationDeclarations(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
