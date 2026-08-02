import { publishDataRetentionPolicy } from '../../../../../lib/blockDemos/dataRetentionPolicyCenter.js';

/**
 * Publishes a signed retention policy and schedules its first lifecycle run.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Publication proof or API error.
 */
export async function post(req, res) {
	const result = publishDataRetentionPolicy(req.params.dataClassId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
