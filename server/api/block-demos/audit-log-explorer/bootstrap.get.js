import { getAuditLogBootstrap } from '../../../lib/blockDemos/auditLogExplorer.js';

/**
 * Returns audit workspace context, filters, saved views, and recent jobs.
 *
 * @returns {Promise<Record<string, unknown>>} Audit explorer bootstrap payload.
 */
export async function get() {
	return getAuditLogBootstrap();
}
