import { updateMailThreadState } from '../../../../../lib/blockDemos/mailWorkspace.js';

/**
 * Updates read, star, and label state with optimistic revision checks.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated thread or API error.
 */
export async function patch(req, res) {
	const result = updateMailThreadState(req.params.threadId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
