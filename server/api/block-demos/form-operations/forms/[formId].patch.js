import { updateFormOperationsForm } from '../../../../lib/blockDemos/formOperations.js';

/**
 * Saves revisioned form settings.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated form or API error.
 */
export async function patch(req, res) {
	const result = updateFormOperationsForm(req.params.formId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
