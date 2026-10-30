import { updateDocumentSigningRecipient } from '../../../../../../lib/blockDemos/documentSigning.js';

/**
 * Updates one draft envelope recipient at an exact revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Recipient update response.
 */
export async function patch(req, res) {
	const result = updateDocumentSigningRecipient(req.params.envelopeId, req.params.recipientId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
