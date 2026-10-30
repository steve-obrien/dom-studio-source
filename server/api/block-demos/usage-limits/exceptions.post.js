import { createUsageException } from '../../../lib/blockDemos/usageLimits.js';

/**
 * Creates a temporary customer exception request.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = createUsageException(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
