import { getIdentityVerificationSession } from '../../../lib/blockDemos/identityVerification.js';

/**
 * Returns the resumable process-local verification session.
 *
 * @returns {Promise<Record<string, unknown>>} Verification session payload.
 */
export async function get() {
	return { session: getIdentityVerificationSession() };
}
