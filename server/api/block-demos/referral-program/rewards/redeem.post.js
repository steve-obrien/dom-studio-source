import { redeemReferralBalance } from '../../../../lib/blockDemos/referralProgram.js';

/**
 * Applies the acknowledged referral balance to the next invoice.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated referral workspace and redemption receipt.
 */
export async function post(req, res) {
	const result = redeemReferralBalance(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
