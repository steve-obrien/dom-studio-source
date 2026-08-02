import { recordReferralShare } from '../../../lib/blockDemos/referralProgram.js';

/**
 * Records an attributable referral share.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated referral workspace and share receipt.
 */
export async function post(req, res) {
	const result = recordReferralShare(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
