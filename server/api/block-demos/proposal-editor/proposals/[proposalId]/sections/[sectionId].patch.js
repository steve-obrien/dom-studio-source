import { updateProposalEditorSection } from '../../../../../../lib/blockDemos/proposalEditor.js';

/**
 * Updates one proposal section at an exact revision.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Section update response.
 */
export async function patch(req, res) {
	const result = updateProposalEditorSection(req.params.proposalId, req.params.sectionId, req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
