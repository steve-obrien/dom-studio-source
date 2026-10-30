import { getIdentityVerificationBootstrap } from '../../../lib/blockDemos/identityVerification.js';

/**
 * Returns provider context and rich options for the verification section.
 *
 * @returns {Promise<Record<string, unknown>>} Verification bootstrap payload.
 */
export async function get() {
	return getIdentityVerificationBootstrap();
}
