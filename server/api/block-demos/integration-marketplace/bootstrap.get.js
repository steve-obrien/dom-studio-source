import { getIntegrationMarketplaceBootstrap } from '../../../lib/blockDemos/integrationMarketplace.js';

/**
 * Returns the integration catalog and default provider detail.
 *
 * @returns {Promise<Record<string, unknown>>} Marketplace bootstrap payload.
 */
export async function get() {
	return getIntegrationMarketplaceBootstrap();
}
