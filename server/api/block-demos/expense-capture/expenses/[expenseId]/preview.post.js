import { previewExpenseSubmission } from '../../../../../lib/blockDemos/expenseCapture.js';

/**
 * Creates an immutable expense submission preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = previewExpenseSubmission(req.params.expenseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
