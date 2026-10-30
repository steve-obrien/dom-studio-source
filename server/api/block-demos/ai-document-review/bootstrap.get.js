import { getAiDocumentReviewBootstrap } from '../../../lib/blockDemos/aiDocumentReview.js';

/**
 * Returns the AI document review workspace and default contract.
 *
 * @returns {Promise<Record<string, unknown>>} Review workspace bootstrap payload.
 */
export async function get() {
	return getAiDocumentReviewBootstrap();
}
