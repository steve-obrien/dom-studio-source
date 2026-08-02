import { validateFormOperationsForm } from '../../../../../lib/blockDemos/formOperations.js';

/**
 * Runs authoritative publication checks for one form revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Validation proof or API error.
 */
export async function post(req, res) {
	const result = validateFormOperationsForm(req.params.formId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
