import { listDeliveryTrackerOrders } from '../../../lib/blockDemos/deliveryTracker.js';

/**
 * Lists delivery orders available to the API-backed tracker block.
 *
 * @returns {Promise<{ orders: Array<object> }>} Delivery order summaries.
 */
export async function get() {
	return {
		orders: listDeliveryTrackerOrders(),
	};
}
