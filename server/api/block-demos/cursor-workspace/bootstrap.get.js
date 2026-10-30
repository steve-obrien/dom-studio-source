import { getCursorWorkspaceBootstrap } from '../../../lib/blockDemos/cursorWorkspace.js';

/**
 * Returns the developer workspace bootstrap payload.
 *
 * @returns {Promise<Record<string, unknown>>} Workspace state.
 */
export async function get() {
	return getCursorWorkspaceBootstrap();
}
