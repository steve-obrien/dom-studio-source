import { getStatusPageComponent } from '../../../../lib/blockDemos/statusPage.js';

/**
 * Returns one component's regional evidence and related events.
 *
 * @param {import('express').Request} req HTTP request.
 * @param {import('express').Response} res HTTP response.
 * @returns {Promise<object>} Component detail or API error.
 */
export async function get(req, res) {
	const result = getStatusPageComponent(req.params.componentId, req.query.region);
	if (result.error) res.status(result.status || 400);
	return result;
}
