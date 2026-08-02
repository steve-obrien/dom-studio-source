import { resetFeedbackBoardWorkspace } from '../../../lib/blockDemos/feedbackBoard.js';

/**
 * Restores the deterministic feedback-board demo workspace.
 *
 * @returns {Promise<object>} Reset feedback workspace.
 */
export async function post() {
	return resetFeedbackBoardWorkspace();
}
