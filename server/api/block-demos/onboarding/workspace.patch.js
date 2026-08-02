import { updateOnboardingWorkspace } from '../../../lib/blockDemos/onboardingWorkspace.js';

/**
 * Validates and saves workspace identity and hosting choices.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated session or API error.
 */
export async function patch(req, res) {
	const result = updateOnboardingWorkspace(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
