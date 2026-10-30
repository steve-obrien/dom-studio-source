import { getMediaAssetLibraryBootstrap } from '../../../lib/blockDemos/mediaAssetLibrary.js';

/**
 * Returns media filters, collection counts, upload policy, and editor context.
 *
 * @returns {Promise<Record<string, unknown>>} Media library bootstrap payload.
 */
export async function get() {
	return getMediaAssetLibraryBootstrap();
}
