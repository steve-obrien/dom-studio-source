import { runDocumentSigningPreflight } from '../../../../../lib/blockDemos/documentSigning.js';

/**
 * Recalculates authoritative envelope readiness.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Preflight response.
 */
export async function post(req, res) {
	const result = runDocumentSigningPreflight(req.params.envelopeId);
	if (result.error) res.status(result.status || 400);
	return result;
}
