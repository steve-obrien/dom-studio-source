import { createBulkActionPreview } from '../../../lib/blockDemos/bulkActionOperations.js';

/**
 * Creates an immutable server-owned impact preview.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated workspace with preview or API error.
 */
export async function post(req, res) {
	const result = createBulkActionPreview(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
