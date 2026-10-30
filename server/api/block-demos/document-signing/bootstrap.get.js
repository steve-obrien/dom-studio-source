import { getDocumentSigningBootstrap } from '../../../lib/blockDemos/documentSigning.js';

/**
 * Returns the document-signing workspace and default envelope.
 *
 * @returns {Promise<Record<string, unknown>>} Signing workspace bootstrap payload.
 */
export async function get() {
	return getDocumentSigningBootstrap();
}
