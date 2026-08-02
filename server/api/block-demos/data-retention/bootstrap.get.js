import { getDataRetentionBootstrap } from '../../../lib/blockDemos/dataRetentionPolicyCenter.js';

/**
 * Returns retention workspace navigation, controls, and legal holds.
 *
 * @returns {Promise<Record<string, unknown>>} Retention bootstrap payload.
 */
export async function get() {
	return getDataRetentionBootstrap();
}
