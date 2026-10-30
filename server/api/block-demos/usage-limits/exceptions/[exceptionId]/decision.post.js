import { decideUsageException } from '../../../../../lib/blockDemos/usageLimits.js';

/**
 * Records a decision for a pending customer exception.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = decideUsageException(req.params.exceptionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
