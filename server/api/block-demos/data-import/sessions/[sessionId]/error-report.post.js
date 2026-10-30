import { createDataImportErrorReport } from '../../../../../lib/blockDemos/dataImport.js';

/**
 * Generates a checksum-backed blocked-row report.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Error-report receipt or API error.
 */
export async function post(req, res) {
	const result = createDataImportErrorReport(req.params.sessionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
