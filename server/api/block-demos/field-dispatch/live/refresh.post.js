import { refreshFieldDispatchLive } from '../../../../lib/blockDemos/fieldDispatch.js';

/**
 * Refreshes live GPS and ETA evidence at an exact workspace revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = refreshFieldDispatchLive(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
