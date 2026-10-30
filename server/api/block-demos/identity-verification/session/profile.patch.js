import { saveIdentityVerificationProfile } from '../../../../lib/blockDemos/identityVerification.js';

/**
 * Validates and saves applicant profile fields.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated session or API error.
 */
export async function patch(req, res) {
	const result = saveIdentityVerificationProfile(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
