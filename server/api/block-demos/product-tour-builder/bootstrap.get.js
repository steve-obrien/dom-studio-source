import { getProductTourBuilderBootstrap } from '../../../lib/blockDemos/productTourBuilder.js';

/**
 * Returns product-tour authoring context, choices, and current draft.
 *
 * @returns {Promise<Record<string, unknown>>} Product-tour builder payload.
 */
export async function get() {
	return getProductTourBuilderBootstrap();
}
