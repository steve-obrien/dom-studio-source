import { previewSprintPlan } from '../../../../lib/blockDemos/sprintPlanning.js';

/**
 * Builds one immutable, server-validated sprint commitment preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Exact sprint plan preview or API error.
 */
export async function post(req, res) {
	const result = previewSprintPlan(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
