import { approveChangelogRelease } from '../../../../lib/blockDemos/changelogPublisher.js';

/**
 * Approves a release for the assigned reviewer.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Approved release or authorization error.
 */
export async function post(req, res) {
	const result = approveChangelogRelease(req.params.releaseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
