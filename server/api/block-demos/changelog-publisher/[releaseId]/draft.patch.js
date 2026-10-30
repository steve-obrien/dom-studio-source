import { updateChangelogDraft } from '../../../../lib/blockDemos/changelogPublisher.js';

/**
 * Validates and persists a complete changelog draft.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Updated release or API error.
 */
export async function patch(req, res) {
	const result = updateChangelogDraft(req.params.releaseId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
