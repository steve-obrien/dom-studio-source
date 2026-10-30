import { getCardDisputeBootstrap } from '../../../lib/blockDemos/cardDisputeFlow.js';

/**
 * Returns the dispute queue, selected transaction, and rich selector options.
 *
 * @param {import('express').Request} req HTTP request.
 * @returns {Promise<Record<string, unknown>>} Dispute workspace bootstrap payload.
 */
export async function get(req) {
	return getCardDisputeBootstrap(req.query.transactionId);
}
