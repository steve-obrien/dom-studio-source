import { updateReferralPreferences } from '../../../lib/blockDemos/referralProgram.js';

/**
 * Persists revisioned reward and notification preferences.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated referral workspace or API error.
 */
export async function patch(req, res) {
	const result = updateReferralPreferences(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
