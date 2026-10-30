import { uploadMediaAsset } from '../../../lib/blockDemos/mediaAssetLibrary.js';

/**
 * Runs the demo ingestion pipeline for one local file metadata record.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Uploaded media asset or API error.
 */
export async function post(req, res) {
	const result = uploadMediaAsset(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
