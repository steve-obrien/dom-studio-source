import { processDataImportJob } from '../../../../../../../lib/blockDemos/dataImport.js';

/**
 * Processes one deterministic worker batch for an import job.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated import job or API error.
 */
export async function post(req, res) {
	const result = processDataImportJob(req.params.sessionId, req.params.jobId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
