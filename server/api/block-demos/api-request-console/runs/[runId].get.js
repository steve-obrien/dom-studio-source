import { getApiRequestConsoleRun } from '../../../../lib/blockDemos/apiRequestConsole.js';

/**
 * Returns one immutable API request run.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Request run or API error.
 */
export async function get(req, res) {
	const result = getApiRequestConsoleRun(req.params.runId);
	if (result.error) res.status(result.status || 400);
	return result;
}
