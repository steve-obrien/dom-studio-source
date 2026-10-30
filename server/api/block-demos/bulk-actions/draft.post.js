import { updateBulkActionDraft } from '../../../lib/blockDemos/bulkActionOperations.js';

/**
 * Persists selection and configuration changes with revision protection.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace or API error.
 */
export async function post(req, res) {
	const result = updateBulkActionDraft(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
