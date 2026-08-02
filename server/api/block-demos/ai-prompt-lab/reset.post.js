import { resetAiPromptLab } from '../../../lib/blockDemos/aiPromptLab.js';

/**
 * Restores seeded prompt, run, and review state.
 *
 * @returns {Promise<Record<string, unknown>>} Fresh prompt lab state.
 */
export async function post() {
	return resetAiPromptLab();
}
