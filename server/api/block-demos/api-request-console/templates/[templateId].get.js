import { getApiRequestConsoleTemplate } from '../../../../lib/blockDemos/apiRequestConsole.js';

/**
 * Returns one saved request template.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Template result or API error.
 */
export async function get(req, res) {
	const result = getApiRequestConsoleTemplate(req.params.templateId);
	if (result.error) res.status(result.status || 400);
	return result;
}
