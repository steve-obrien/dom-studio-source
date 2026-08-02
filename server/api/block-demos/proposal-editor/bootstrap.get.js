import { getProposalEditorBootstrap } from '../../../lib/blockDemos/proposalEditor.js';

/**
 * Returns the proposal editor workspace and default proposal.
 *
 * @returns {Promise<Record<string, unknown>>} Proposal workspace bootstrap payload.
 */
export async function get() {
	return getProposalEditorBootstrap();
}
