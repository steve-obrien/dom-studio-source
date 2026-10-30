import { createApiRequestConsoleTemplate } from '../../../lib/blockDemos/apiRequestConsole.js';

/**
 * Creates a reusable API request template.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Created template or validation error.
 */
export async function post(req, res) {
	const result = createApiRequestConsoleTemplate(req.body || {});
	if (result.error) res.status(result.status || 400);
	else res.status(result.status || 201);
	return result;
}
