import { createFormOperationsSubmission } from '../../../../../lib/blockDemos/formOperations.js';

/**
 * Accepts one public form response through server-owned validation.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Response confirmation or API error.
 */
export async function post(req, res) {
	const result = createFormOperationsSubmission(req.params.formId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
