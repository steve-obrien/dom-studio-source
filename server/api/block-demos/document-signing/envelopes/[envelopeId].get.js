import { getDocumentSigningEnvelope } from '../../../../lib/blockDemos/documentSigning.js';

/**
 * Returns one signing envelope with documents, recipients, fields, and evidence.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Envelope response.
 */
export async function get(req, res) {
	const result = getDocumentSigningEnvelope(req.params.envelopeId);
	if (result.error) res.status(result.status || 400);
	return result;
}
