import { updateProductTourStep } from '../../../../../../lib/blockDemos/productTourBuilder.js';

/**
 * Validates and saves one product-tour step.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated tour and step or API error.
 */
export async function patch(req, res) {
	const result = updateProductTourStep(req.params.tourId, req.params.stepId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
