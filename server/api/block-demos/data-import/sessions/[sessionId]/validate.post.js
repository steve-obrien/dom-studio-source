import { validateDataImport } from '../../../../../lib/blockDemos/dataImport.js';

/**
 * Runs authoritative import checks for the current session revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Validation proof or API error.
 */
export async function post(req, res) {
	const result = validateDataImport(req.params.sessionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
