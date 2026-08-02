import { selectFieldDispatchStop } from '../../../../lib/blockDemos/fieldDispatch.js';

/**
 * Selects one service stop with exact revision protection.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = selectFieldDispatchStop(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
