import { getDataImportBootstrap } from '../../../lib/blockDemos/dataImport.js';

/**
 * Returns the parsed file, import choices, mappings, and resumable session.
 *
 * @returns {Promise<Record<string, unknown>>} Data-import bootstrap payload.
 */
export async function get() {
	return getDataImportBootstrap();
}
