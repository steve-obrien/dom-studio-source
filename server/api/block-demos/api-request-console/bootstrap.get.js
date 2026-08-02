import { getApiRequestConsoleBootstrap } from '../../../lib/blockDemos/apiRequestConsole.js';

/**
 * Returns API request console options, templates, and recent runs.
 *
 * @returns {Promise<Record<string, unknown>>} API console workspace.
 */
export async function get() {
	return getApiRequestConsoleBootstrap();
}
