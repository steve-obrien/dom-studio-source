import { getWebhookOperationsBootstrap } from '../../../lib/blockDemos/webhookOperations.js';

/**
 * Returns the webhook operations workspace and default evidence.
 *
 * @returns {Promise<Record<string, unknown>>} Webhook bootstrap payload.
 */
export async function get() {
	return getWebhookOperationsBootstrap();
}
