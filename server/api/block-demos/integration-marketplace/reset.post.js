import { resetIntegrationMarketplace } from '../../../lib/blockDemos/integrationMarketplace.js';

/**
 * Restores the seeded integration marketplace.
 *
 * @returns {Promise<Record<string, unknown>>} Fresh marketplace bootstrap payload.
 */
export async function post() {
	return resetIntegrationMarketplace();
}
