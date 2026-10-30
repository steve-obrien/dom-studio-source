import { releaseAiDocumentReviewDocument } from '../../../../../lib/blockDemos/aiDocumentReview.js';

/**
 * Releases the reviewed document and creates immutable evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Document release response.
 */
export async function post(req, res) {
	const result = releaseAiDocumentReviewDocument(req.params.documentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
