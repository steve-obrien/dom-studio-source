import { resetFieldDispatchWorkspace } from '../../../lib/blockDemos/fieldDispatch.js';

/**
 * Restores the deterministic field-dispatch workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Reset workspace payload.
 */
export async function post() {
	return resetFieldDispatchWorkspace();
}
