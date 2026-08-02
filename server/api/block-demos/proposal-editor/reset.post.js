import { resetProposalEditorWorkspace } from '../../../lib/blockDemos/proposalEditor.js';

/**
 * Restores the seeded proposal editor workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Reset proposal workspace.
 */
export async function post() {
	return resetProposalEditorWorkspace();
}
