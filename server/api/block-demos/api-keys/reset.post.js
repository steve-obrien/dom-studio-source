import { resetApiKeyManagement } from '../../../lib/blockDemos/apiKeyManagement.js';

/**
 * Restores the seeded credential inventory.
 *
 * @returns {Promise<Record<string, unknown>>} Fresh API key workspace.
 */
export async function post() {
	return resetApiKeyManagement();
}
