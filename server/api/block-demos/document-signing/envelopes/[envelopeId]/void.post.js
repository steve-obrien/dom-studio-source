import { voidDocumentSigningEnvelope } from '../../../../../lib/blockDemos/documentSigning.js';

/**
 * Voids a draft or sent envelope with explicit audit evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Envelope void response.
 */
export async function post(req, res) {
	const result = voidDocumentSigningEnvelope(req.params.envelopeId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
