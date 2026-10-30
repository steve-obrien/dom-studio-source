import { getApiKeyManagementBootstrap } from '../../../lib/blockDemos/apiKeyManagement.js';

/**
 * Returns the credential inventory and default key detail.
 *
 * @returns {Promise<Record<string, unknown>>} API key workspace bootstrap payload.
 */
export async function get() {
	return getApiKeyManagementBootstrap();
}
