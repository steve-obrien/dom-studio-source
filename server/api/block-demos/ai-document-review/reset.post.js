import { resetAiDocumentReviewWorkspace } from '../../../lib/blockDemos/aiDocumentReview.js';

/**
 * Restores the deterministic AI document review workspace.
 *
 * @returns {Promise<Record<string, unknown>>} Fresh review workspace.
 */
export async function post() {
	return resetAiDocumentReviewWorkspace();
}
