import { getAppNavigationBuilderBootstrap } from '../../../lib/blockDemos/appNavigationBuilder.js';

/**
 * Return the navigation draft, editor options, validation state, and current editor.
 *
 * @returns {Promise<Record<string, unknown>>} Navigation-builder bootstrap payload.
 */
export async function get() {
	return getAppNavigationBuilderBootstrap();
}
