import { updateOnboardingPersonalization } from '../../../lib/blockDemos/onboardingWorkspace.js';

/**
 * Saves the viewer role and prioritized activation outcomes.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated session or API error.
 */
export async function patch(req, res) {
	const result = updateOnboardingPersonalization(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
