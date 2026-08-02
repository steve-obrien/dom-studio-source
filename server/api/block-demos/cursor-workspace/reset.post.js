import { resetCursorWorkspace } from '../../../lib/blockDemos/cursorWorkspace.js';

/**
 * Restores the seeded developer workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Fresh workspace state.
 */
export async function post() {
	return resetCursorWorkspace();
}
