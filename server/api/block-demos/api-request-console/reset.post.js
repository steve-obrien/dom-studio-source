import { resetApiRequestConsole } from '../../../lib/blockDemos/apiRequestConsole.js';

/**
 * Restores the seeded API request console workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Fresh workspace state.
 */
export async function post() {
	return resetApiRequestConsole();
}
