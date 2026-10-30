import { listMediaAssets } from '../../../lib/blockDemos/mediaAssetLibrary.js';

/**
 * Lists media assets using server-owned search, filter, and sort rules.
 *
 * @param {import('express').Request} req HTTP request.
 * @returns {Promise<Record<string, unknown>>} Filtered media asset payload.
 */
export async function get(req) {
	return listMediaAssets(req.query || {});
}
