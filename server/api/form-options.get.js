import { listDemoOptions } from '../lib/demoOptions.js';

/**
 * Serve paginated synthetic records for the public form examples; no user data,
 * database, API key or external service is involved.
 *
 * @param {import('express').Request} req Query with kind, q, cursor and limit.
 * @param {import('express').Response} res Response for cache and error status.
 * @returns {Object} Page envelope or a validation error.
 */
export function get(req, res) {
	try {
		const page = listDemoOptions(req.query);
		res.setHeader('Cache-Control', 'public, max-age=60');
		return page;
	} catch (error) {
		if (!(error instanceof TypeError)) throw error;
		res.status(400);
		return { error: error.message };
	}
}
