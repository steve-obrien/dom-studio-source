import { runIdentityVerificationChecks } from '../../../../lib/blockDemos/identityVerification.js';

/**
 * Runs server-owned screening checks for the current packet.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Screening results or provider error.
 */
export async function post(req, res) {
	const result = runIdentityVerificationChecks(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
