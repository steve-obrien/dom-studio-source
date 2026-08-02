import { toggleSavedFilterFavorite } from '../../../../../lib/blockDemos/savedFilters.js';

/**
 * Adds or removes one saved view from the operator's favorite navigation.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated view workspace or API error.
 */
export async function post(req, res) {
	const result = toggleSavedFilterFavorite(req.params.viewId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
