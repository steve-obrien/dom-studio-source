import { updateFormOperationsResponse } from '../../../../../../lib/blockDemos/formOperations.js';

/**
 * Saves optimistic response triage state.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated response inbox or API error.
 */
export async function patch(req, res) {
	const result = updateFormOperationsResponse(req.params.formId, req.params.responseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
