import { getFieldDispatchWorkspace } from '../../../lib/blockDemos/fieldDispatch.js';

/**
 * Returns the complete field-dispatch workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Dispatch workspace payload.
 */
export async function get() {
	return getFieldDispatchWorkspace();
}
