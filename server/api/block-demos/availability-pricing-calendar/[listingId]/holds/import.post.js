import { importAvailabilityPartnerHolds } from '../../../../../lib/blockDemos/availabilityPricingCalendar.js';

/**
 * Imports partner-channel holds into the selected month as saved drafts.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Imported dates and refreshed calendar.
 */
export async function post(req, res) {
	const result = importAvailabilityPartnerHolds(req.params.listingId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
