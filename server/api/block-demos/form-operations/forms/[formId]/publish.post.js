import { publishFormOperationsForm } from '../../../../../lib/blockDemos/formOperations.js';

/**
 * Publishes a validated form after explicit acknowledgement.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Publication receipt or API error.
 */
export async function post(req, res) {
	const result = publishFormOperationsForm(req.params.formId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
