import { listAvailabilityPricingListings } from '../../../lib/blockDemos/availabilityPricingCalendar.js';

/**
 * Lists properties available to the API-backed revenue calendar.
 *
 * @returns {Promise<{ listings: Array<object> }>} Property selector payload.
 */
export async function get() {
	return { listings: listAvailabilityPricingListings() };
}
