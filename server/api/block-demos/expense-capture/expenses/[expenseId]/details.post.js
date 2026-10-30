import { saveExpenseCaptureDetails } from '../../../../../lib/blockDemos/expenseCapture.js';

/**
 * Saves editable expense fields and re-evaluates policy.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = saveExpenseCaptureDetails(req.params.expenseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
