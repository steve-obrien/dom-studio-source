import { getAvailabilityPricingCalendar } from '../../../lib/blockDemos/availabilityPricingCalendar.js';

/**
 * Returns one resolved property month and its publication state.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Calendar payload or API error.
 */
export async function get(req, res) {
	const result = getAvailabilityPricingCalendar(req.params.listingId);
	if (result.error) res.status(result.status || 400);
	return result;
}
