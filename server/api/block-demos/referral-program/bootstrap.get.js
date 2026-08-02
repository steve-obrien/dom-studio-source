import { getReferralWorkspace } from '../../../lib/blockDemos/referralProgram.js';

/**
 * Returns the complete referral program workspace.
 *
 * @returns {Promise<object>} Referral program state and catalog.
 */
export async function get() {
	return getReferralWorkspace();
}
