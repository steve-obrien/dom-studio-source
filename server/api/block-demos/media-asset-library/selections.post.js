import { insertMediaAssets } from '../../../lib/blockDemos/mediaAssetLibrary.js';

/**
 * Validates and inserts a publish-ready asset selection into a destination.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Insertion receipt or API error.
 */
export async function post(req, res) {
	const result = insertMediaAssets(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
