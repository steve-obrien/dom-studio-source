import { resetUsageReconciliation } from '../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Restores the deterministic usage reconciliation example.
 *
 * @returns {Promise<object>} Clean reconciliation workspace.
 */
export async function post() {
	return resetUsageReconciliation();
}
