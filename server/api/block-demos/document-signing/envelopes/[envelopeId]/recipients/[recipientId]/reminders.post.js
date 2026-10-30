import { remindDocumentSigningRecipient } from '../../../../../../../lib/blockDemos/documentSigning.js';

/**
 * Sends an auditable reminder to one active recipient.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Reminder response.
 */
export async function post(req, res) {
	const result = remindDocumentSigningRecipient(req.params.envelopeId, req.params.recipientId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
