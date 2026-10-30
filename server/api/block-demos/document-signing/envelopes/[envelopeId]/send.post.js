import { sendDocumentSigningEnvelope } from '../../../../../lib/blockDemos/documentSigning.js';

/**
 * Sends a ready envelope through the deterministic provider boundary.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Envelope send response.
 */
export async function post(req, res) {
	const result = sendDocumentSigningEnvelope(req.params.envelopeId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
