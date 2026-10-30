import { completeDocumentSigningRecipient } from '../../../../../../../lib/blockDemos/documentSigning.js';

/**
 * Simulates one certificate-backed signing provider callback.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Signer callback response.
 */
export async function post(req, res) {
	const result = completeDocumentSigningRecipient(req.params.envelopeId, req.params.recipientId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
