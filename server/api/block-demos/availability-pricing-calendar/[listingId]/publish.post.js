import { publishAvailabilityPricingCalendar } from '../../../../lib/blockDemos/availabilityPricingCalendar.js';

/**
 * Publishes pending calendar drafts to connected booking channels.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Publish receipt or API error.
 */
export async function post(req, res) {
	const result = publishAvailabilityPricingCalendar(req.params.listingId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
