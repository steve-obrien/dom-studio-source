import { submitCapturedExpense } from '../../../../../lib/blockDemos/expenseCapture.js';

/**
 * Submits one exact previewed expense.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = submitCapturedExpense(req.params.expenseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
