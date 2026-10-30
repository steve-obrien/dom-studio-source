import { getFormOperationsForm } from '../../../../lib/blockDemos/formOperations.js';

/**
 * Returns one form and its current responses.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Form payload or API error.
 */
export async function get(req, res) {
	const result = getFormOperationsForm(req.params.formId);
	if (result.error) res.status(result.status || 400);
	return result;
}
