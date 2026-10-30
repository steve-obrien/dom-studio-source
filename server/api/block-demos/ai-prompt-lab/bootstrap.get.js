import { getAiPromptLabBootstrap } from '../../../lib/blockDemos/aiPromptLab.js';

/**
 * Returns the API-backed prompt workspace and default prompt.
 *
 * @returns {Promise<Record<string, unknown>>} Prompt lab bootstrap payload.
 */
export async function get() {
	return getAiPromptLabBootstrap();
}
