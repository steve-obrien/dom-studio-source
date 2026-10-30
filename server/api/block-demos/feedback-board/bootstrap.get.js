import { getFeedbackBoardWorkspace } from '../../../lib/blockDemos/feedbackBoard.js';

/**
 * Returns the API-backed feedback board with customer evidence and decisions.
 *
 * @returns {Promise<object>} Feedback workspace.
 */
export async function get() {
	return getFeedbackBoardWorkspace();
}
