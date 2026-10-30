import { executeApiRequestConsoleRun } from '../../../lib/blockDemos/apiRequestConsole.js';

/**
 * Executes a server-proxied API request and stores immutable evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Recorded request run or validation error.
 */
export async function post(req, res) {
	const result = executeApiRequestConsoleRun(req.body || {});
	if (result.error) res.status(result.status || 400);
	else res.status(result.status || 201);
	return result;
}
