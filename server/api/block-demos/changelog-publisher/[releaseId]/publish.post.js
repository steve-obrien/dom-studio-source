import { publishChangelogRelease } from '../../../../lib/blockDemos/changelogPublisher.js';

/**
 * Schedules or immediately publishes an approved changelog release.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Publication proof or blocking checks.
 */
export async function post(req, res) {
	const result = publishChangelogRelease(req.params.releaseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
