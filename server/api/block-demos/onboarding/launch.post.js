import { launchOnboardingWorkspace } from '../../../lib/blockDemos/onboardingWorkspace.js';

/**
 * Activates a ready workspace and returns immutable launch proof.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Launch receipt or API error.
 */
export async function post(req, res) {
	const result = launchOnboardingWorkspace(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
