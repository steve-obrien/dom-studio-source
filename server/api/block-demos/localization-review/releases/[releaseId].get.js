import { getLocalizationReviewRelease } from '../../../../lib/blockDemos/localizationReviewWorkbench.js';

/**
 * Returns one localization release for the requested locale.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Release workflow or API error.
 */
export async function get(req, res) {
	const result = getLocalizationReviewRelease(req.params.releaseId, req.query.locale);
	if (result.error) res.status(result.status || 400);
	return result;
}
