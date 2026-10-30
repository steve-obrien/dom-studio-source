import { listPickupHandoffOrders } from '../../../lib/blockDemos/pickupHandoff.js';

/**
 * Lists pickup orders available to the API-backed handoff block.
 *
 * @returns {Promise<{ orders: Array<object> }>} Pickup order summaries.
 */
export async function get() {
	return { orders: listPickupHandoffOrders() };
}
