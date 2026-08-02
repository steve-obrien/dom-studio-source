import { refreshExpenseReceipt } from '../../../../../../lib/blockDemos/expenseCapture.js';

/**
 * Re-runs receipt extraction for one editable expense.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Updated workspace.
 */
export async function post(req, res) {
	const result = refreshExpenseReceipt(req.params.expenseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
