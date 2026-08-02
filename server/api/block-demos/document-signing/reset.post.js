import { resetDocumentSigningWorkspace } from '../../../lib/blockDemos/documentSigning.js';

/**
 * Restores the deterministic signing workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Restored signing workspace.
 */
export async function post() {
	return resetDocumentSigningWorkspace();
}
