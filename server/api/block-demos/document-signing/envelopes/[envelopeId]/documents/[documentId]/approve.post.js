import { approveDocumentSigningVersion } from '../../../../../../../lib/blockDemos/documentSigning.js';

/**
 * Approves the exact document version attached to a draft envelope.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Document approval response.
 */
export async function post(req, res) {
	const result = approveDocumentSigningVersion(req.params.envelopeId, req.params.documentId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
