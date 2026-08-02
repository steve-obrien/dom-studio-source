import { duplicateProductTourStep } from '../../../../../../../lib/blockDemos/productTourBuilder.js';

/**
 * Duplicates one step directly after its source.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated tour and duplicated step or API error.
 */
export async function post(req, res) {
	const result = duplicateProductTourStep(req.params.tourId, req.params.stepId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
