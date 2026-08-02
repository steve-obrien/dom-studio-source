import { publishUsagePolicy } from '../../../lib/blockDemos/usageLimits.js';

/**
 * Publishes a checked usage policy with explicit acknowledgement.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = publishUsagePolicy(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
