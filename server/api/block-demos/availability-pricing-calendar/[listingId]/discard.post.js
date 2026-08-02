import { discardAvailabilityPricingDrafts } from '../../../../lib/blockDemos/availabilityPricingCalendar.js';

/**
 * Discards all unpublished date drafts for the requested listing.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Discarded dates and refreshed calendar.
 */
export async function post(req, res) {
	const result = discardAvailabilityPricingDrafts(req.params.listingId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
