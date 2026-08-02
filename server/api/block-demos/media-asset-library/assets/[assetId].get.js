import { getMediaAsset } from '../../../../lib/blockDemos/mediaAssetLibrary.js';

/**
 * Returns one media asset with publishing and usage metadata.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Media asset or API error.
 */
export async function get(req, res) {
	const result = getMediaAsset(req.params.assetId);
	if (result.error) res.status(result.status || 400);
	return result;
}
