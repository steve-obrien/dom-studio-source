import { publishLocalizationLocale } from '../../../../../lib/blockDemos/localizationReviewWorkbench.js';

/**
 * Publishes a complete locale pack and returns synchronization proof.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Published release, receipt, or API error.
 */
export async function post(req, res) {
	const result = publishLocalizationLocale(req.params.releaseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
