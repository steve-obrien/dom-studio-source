import { getUsageReconciliationWorkspace } from '../../../lib/blockDemos/usageEventReconciliation.js';

/**
 * Returns the complete usage-event reconciliation workspace.
 *
 * @returns {Promise<object>} Reconciliation periods, cases, options, and summary.
 */
export async function get() {
	return getUsageReconciliationWorkspace();
}
