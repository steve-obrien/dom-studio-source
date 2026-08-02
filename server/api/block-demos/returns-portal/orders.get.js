import { listReturnOrders } from '../../../lib/blockDemos/returnsPortal.js';

/**
 * Lists orders available to the API-backed returns portal.
 *
 * @returns {Promise<{ orders: Array<object> }>} Order selector payload.
 */
export async function get() {
	return { orders: listReturnOrders() };
}
