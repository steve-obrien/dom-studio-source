import { selectFieldDispatchRoute } from '../../../../lib/blockDemos/fieldDispatch.js';

/**
 * Selects one field route with exact revision protection.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = selectFieldDispatchRoute(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
