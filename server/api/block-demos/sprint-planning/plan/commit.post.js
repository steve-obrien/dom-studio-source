import { commitSprintPlan } from '../../../../lib/blockDemos/sprintPlanning.js';

/**
 * Commits an acknowledged sprint from one exact plan preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace and commitment receipt.
 */
export async function post(req, res) {
	const result = commitSprintPlan(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
