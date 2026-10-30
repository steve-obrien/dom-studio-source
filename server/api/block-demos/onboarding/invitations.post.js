import { createOnboardingInvitation } from '../../../lib/blockDemos/onboardingWorkspace.js';

/**
 * Adds a scoped teammate invitation to the setup session.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Invitation proof or API error.
 */
export async function post(req, res) {
	const result = createOnboardingInvitation(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
