import { resetCardDisputeWorkspace } from '../../../lib/blockDemos/cardDisputeFlow.js';

/**
 * Restores the seeded dispute workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Fresh bootstrap payload.
 */
export async function post() {
	return resetCardDisputeWorkspace();
}
