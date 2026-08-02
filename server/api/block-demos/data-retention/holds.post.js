import { createDataRetentionHold } from '../../../lib/blockDemos/dataRetentionPolicyCenter.js';

/**
 * Creates a legal hold that overrides matching lifecycle jobs.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Created hold or API error.
 */
export async function post(req, res) {
	const result = createDataRetentionHold(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
