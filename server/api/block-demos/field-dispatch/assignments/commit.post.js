import { commitFieldDispatchAssignment } from '../../../../lib/blockDemos/fieldDispatch.js';

/**
 * Commits one acknowledged exact dispatch assignment.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = commitFieldDispatchAssignment(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
