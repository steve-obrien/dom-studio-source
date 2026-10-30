import { createReferralInvite } from '../../../lib/blockDemos/referralProgram.js';

/**
 * Creates a provider-tracked referral invitation.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated referral workspace and invite receipt.
 */
export async function post(req, res) {
	const result = createReferralInvite(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
