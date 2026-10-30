import { getLoginGatewayBootstrap } from '../../../lib/blockDemos/loginGateway.js';

/**
 * Return product identity, demo credentials, and authentication policy.
 *
 * @returns {Promise<Record<string, unknown>>} Login gateway bootstrap payload.
 */
export async function get() {
	return getLoginGatewayBootstrap();
}
