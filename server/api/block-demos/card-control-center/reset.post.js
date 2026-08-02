import { resetCardControlWorkspace } from '../../../lib/blockDemos/cardControlCenter.js';

/**
 * Restores the deterministic card operations demo.
 *
 * @returns {Promise<Record<string, unknown>>} Fresh bootstrap payload.
 */
export async function post() {
	return resetCardControlWorkspace();
}
