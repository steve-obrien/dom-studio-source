import { getSavedFilter } from '../../../../lib/blockDemos/savedFilters.js';

/**
 * Returns one complete saved view and its current evaluated result set.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Saved-view detail or API error.
 */
export async function get(req, res) {
	const result = getSavedFilter(req.params.viewId);
	if (result.error) res.status(result.status || 400);
	return result;
}
