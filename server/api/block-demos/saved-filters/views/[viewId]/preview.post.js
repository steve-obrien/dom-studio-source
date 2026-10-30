import { previewSavedFilter } from '../../../../../lib/blockDemos/savedFilters.js';

/**
 * Evaluates and locks one exact saved-view draft before persistence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Immutable query preview or API error.
 */
export async function post(req, res) {
	const result = previewSavedFilter(req.params.viewId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
