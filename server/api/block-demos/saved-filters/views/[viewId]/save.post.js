import { saveSavedFilter } from '../../../../../lib/blockDemos/savedFilters.js';

/**
 * Creates or updates a saved view from an acknowledged exact preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated view workspace or API error.
 */
export async function post(req, res) {
	const result = saveSavedFilter(req.params.viewId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
