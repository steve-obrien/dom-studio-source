import { updateResourceAllocationStatus } from '../../../../../lib/blockDemos/resourceScheduler.js';

/**
 * Transitions one exact allocation status.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated resource-scheduler payload.
 */
export async function post(req, res) {
	const result = updateResourceAllocationStatus(req.params.allocationId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
