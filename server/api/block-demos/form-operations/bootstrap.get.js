import { getFormOperationsBootstrap } from '../../../lib/blockDemos/formOperations.js';

/**
 * Returns the editable form, response inbox, and reusable choices.
 *
 * @returns {Promise<Record<string, unknown>>} Form-operations bootstrap payload.
 */
export async function get() {
	return getFormOperationsBootstrap();
}
