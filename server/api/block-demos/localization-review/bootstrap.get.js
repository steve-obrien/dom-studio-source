import { getLocalizationReviewBootstrap } from '../../../lib/blockDemos/localizationReviewWorkbench.js';

/**
 * Returns release, locale, filter, glossary, and reviewer options.
 *
 * @returns {Promise<Record<string, unknown>>} Localization workbench bootstrap payload.
 */
export async function get() {
	return getLocalizationReviewBootstrap();
}
