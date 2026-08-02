import { removeDocumentSigningField } from '../../../../../../lib/blockDemos/documentSigning.js';

/**
 * Removes one field from a draft envelope at an exact revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Field removal response.
 */
export async function del(req, res) {
	const result = removeDocumentSigningField(req.params.envelopeId, req.params.fieldId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}

export { del as delete };
