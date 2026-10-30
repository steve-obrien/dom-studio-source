import { getDocumentSigningCertificate } from '../../../../../lib/blockDemos/documentSigning.js';

/**
 * Returns the immutable completion certificate for a completed envelope.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Certificate response.
 */
export async function get(req, res) {
	const result = getDocumentSigningCertificate(req.params.envelopeId);
	if (result.error) res.status(result.status || 400);
	return result;
}
