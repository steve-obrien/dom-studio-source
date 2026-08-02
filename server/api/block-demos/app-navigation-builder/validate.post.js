import { validateNavigationDraft } from '../../../lib/blockDemos/appNavigationBuilder.js';

/**
 * Run server-owned navigation route, policy, feature-flag, and hierarchy checks.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<Record<string, unknown>>} Validation report or API error.
 */
export async function post(req, res) {
	const result = validateNavigationDraft(req.body || {});
	if (result.error) res.status(result.status || 400);
	return result;
}
