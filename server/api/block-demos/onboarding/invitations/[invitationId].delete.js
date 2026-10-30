import { removeOnboardingInvitation } from '../../../../lib/blockDemos/onboardingWorkspace.js';

/**
 * Removes a pending invitation from the setup session.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated session or API error.
 */
export async function del(req, res) {
	const result = removeOnboardingInvitation(req.params.invitationId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}

export { del as delete };
