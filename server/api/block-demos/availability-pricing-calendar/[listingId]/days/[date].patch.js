import { updateAvailabilityPricingDay } from '../../../../../lib/blockDemos/availabilityPricingCalendar.js';

/**
 * Validates and saves a draft rate and availability rule for one date.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated calendar payload or API error.
 */
export async function patch(req, res) {
	const result = updateAvailabilityPricingDay(req.params.listingId, req.params.date, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
