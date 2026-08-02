import { updateMediaAsset } from '../../../../lib/blockDemos/mediaAssetLibrary.js';

/**
 * Saves accessibility, licensing, title, and search metadata for one asset.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated media asset or API error.
 */
export async function patch(req, res) {
	const result = updateMediaAsset(req.params.assetId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
