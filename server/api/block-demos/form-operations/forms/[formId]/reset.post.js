import { resetFormOperations } from '../../../../../lib/blockDemos/formOperations.js';

/**
 * Resets the process-local form demonstration.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Fresh form workspace or API error.
 */
export async function post(req, res) {
	const result = resetFormOperations(req.params.formId);
	if (result.error) res.status(result.status || 400);
	return result;
}
