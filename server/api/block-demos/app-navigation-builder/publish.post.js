import { publishNavigationDraft } from '../../../lib/blockDemos/appNavigationBuilder.js';

/**
 * Publish a validated immutable navigation version.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Publish receipt or API error.
 */
export async function post(req, res) {
	const result = publishNavigationDraft(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
