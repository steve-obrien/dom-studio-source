import { updateApiRequestConsoleTemplate } from '../../../../lib/blockDemos/apiRequestConsole.js';

/**
 * Saves request template changes with optimistic revision protection.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated template or API error.
 */
export async function patch(req, res) {
	const result = updateApiRequestConsoleTemplate(req.params.templateId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
