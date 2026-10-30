import { resetWebhookOperations } from '../../../lib/blockDemos/webhookOperations.js';

/**
 * Restores the seeded webhook operations workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Fresh webhook bootstrap payload.
 */
export async function post() {
	return resetWebhookOperations();
}
