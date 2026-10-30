import { addDocumentSigningField } from '../../../../../lib/blockDemos/documentSigning.js';

/**
 * Adds a server-positioned signing field to a draft envelope.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Field creation response.
 */
export async function post(req, res) {
	const result = addDocumentSigningField(req.params.envelopeId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
