import { getDataImportSession } from '../../../../lib/blockDemos/dataImport.js';

/**
 * Returns one current data-import session.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Import session or API error.
 */
export async function get(req, res) {
	const result = getDataImportSession(req.params.sessionId);
	if (result.error) res.status(result.status || 400);
	return result;
}
