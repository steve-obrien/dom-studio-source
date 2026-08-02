import { advanceReferralLifecycle } from '../../../../../lib/blockDemos/referralProgram.js';

/**
 * Advances one referral through the deterministic provider lifecycle.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated referral workspace and webhook evidence.
 */
export async function post(req, res) {
	const result = advanceReferralLifecycle(req.params.referralId);
	if (result.error) res.status(result.status || 400);
	return result;
}
