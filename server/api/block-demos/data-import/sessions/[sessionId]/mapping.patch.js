import { updateDataImportMapping } from '../../../../../lib/blockDemos/dataImport.js';

/**
 * Saves target-to-source field mappings for one import session.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated session or API error.
 */
export async function patch(req, res) {
	const result = updateDataImportMapping(req.params.sessionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
