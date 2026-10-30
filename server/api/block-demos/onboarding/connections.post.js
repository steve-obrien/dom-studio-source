import { connectOnboardingSource } from '../../../lib/blockDemos/onboardingWorkspace.js';

/**
 * Connects a source or confirms the clean-workspace path.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Connection proof or API error.
 */
export async function post(req, res) {
	const result = connectOnboardingSource(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
