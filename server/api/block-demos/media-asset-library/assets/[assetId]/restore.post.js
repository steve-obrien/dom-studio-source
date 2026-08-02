import { restoreMediaAsset } from '../../../../../lib/blockDemos/mediaAssetLibrary.js';

/**
 * Restores one archived media asset to the active library.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Restored media asset or API error.
 */
export async function post(req, res) {
	const result = restoreMediaAsset(req.params.assetId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
