import { resetDataImportSession } from '../../../../../lib/blockDemos/dataImport.js';

/**
 * Resets the process-local demonstration import session.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Fresh import session or API error.
 */
export async function post(req, res) {
	const result = resetDataImportSession(req.params.sessionId);
	if (result.error) res.status(result.status || 400);
	return result;
}
