import { getChangelogRelease } from '../../../lib/blockDemos/changelogPublisher.js';

/**
 * Returns the complete changelog publishing workflow for one release.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Release workflow or API error.
 */
export async function get(req, res) {
	const result = getChangelogRelease(req.params.releaseId);
	if (result.error) res.status(result.status || 400);
	return result;
}
