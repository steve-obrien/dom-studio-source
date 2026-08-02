import { createDataImportJob } from '../../../../../lib/blockDemos/dataImport.js';

/**
 * Creates a validated asynchronous import job.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Created import job or API error.
 */
export async function post(req, res) {
	const result = createDataImportJob(req.params.sessionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
