import { resetReferralProgram } from '../../../lib/blockDemos/referralProgram.js';

/**
 * Restores the seeded referral program demonstration.
 *
 * @returns {Promise<object>} Fresh referral workspace.
 */
export async function post() {
	return resetReferralProgram();
}
