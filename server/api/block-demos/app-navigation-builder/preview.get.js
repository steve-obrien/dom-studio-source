import { getAppNavigationPreview } from '../../../lib/blockDemos/appNavigationBuilder.js';

/**
 * Return a server-filtered navigation preview for one audience and device.
 *
 * @param {import('express').Request} req HTTP request.
 * @returns {Promise<Record<string, unknown>>} Filtered navigation preview.
 */
export async function get(req) {
	return getAppNavigationPreview(req.query || {});
}
