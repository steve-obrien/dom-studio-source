import { getDataRetentionPolicy } from '../../../../lib/blockDemos/dataRetentionPolicyCenter.js';

/**
 * Returns one environment-specific retention policy workspace.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Policy workspace or API error.
 */
export async function get(req, res) {
	const result = getDataRetentionPolicy(req.params.dataClassId, req.query.environment);
	if (result.error) res.status(result.status || 400);
	return result;
}
