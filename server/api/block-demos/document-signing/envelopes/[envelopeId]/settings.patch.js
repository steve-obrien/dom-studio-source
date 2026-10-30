import { updateDocumentSigningSettings } from '../../../../../lib/blockDemos/documentSigning.js';

/**
 * Updates an envelope delivery contract at an exact revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Settings update response.
 */
export async function patch(req, res) {
	const result = updateDocumentSigningSettings(req.params.envelopeId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
