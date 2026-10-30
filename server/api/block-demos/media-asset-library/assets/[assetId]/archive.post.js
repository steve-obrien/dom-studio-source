import { archiveMediaAsset } from '../../../../../lib/blockDemos/mediaAssetLibrary.js';

/**
 * Archives one media asset with optimistic revision protection.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Archived media asset or API error.
 */
export async function post(req, res) {
	const result = archiveMediaAsset(req.params.assetId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
