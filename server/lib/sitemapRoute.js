import { loadStaticRouteRecords } from '../../scripts/lib/load-routes.mjs';
import { buildSitemap, readSiteUrl } from '../../scripts/lib/sitemap.mjs';

/**
 * Registers the live public sitemap endpoint before static files and SSR fallbacks.
 *
 * @param {import('express').Express} app Express application.
 * @param {{ loadRouteRecords?: Function, loadSiteUrl?: Function }} [options] Optional loader overrides for testing.
 * @returns {void}
 */
export function installSitemapRoute(app, options = {}) {
	app.get('/sitemap.xml', createSitemapHandler(options));
}

/**
 * Creates a sitemap request handler with injectable data loaders.
 *
 * @param {{ loadRouteRecords?: Function, loadSiteUrl?: Function }} [options] Optional loader overrides.
 * @returns {import('express').RequestHandler} Express sitemap request handler.
 */
export function createSitemapHandler({
	loadRouteRecords = loadCurrentRouteRecords,
	loadSiteUrl = readSiteUrl,
} = {}) {
	/**
	 * Builds the sitemap from current application routes and persisted articles.
	 *
	 * @param {import('express').Request} request Incoming request.
	 * @param {import('express').Response} response Outgoing response.
	 * @returns {Promise<void>}
	 */
	return async function handleSitemapRequest(request, response) {
		try {
			const [siteUrl, routeRecords] = await Promise.all([
				loadSiteUrl(),
				loadRouteRecords(),
			]);
			response
				.status(200)
				.set({
					'Cache-Control': 'no-cache, no-store, must-revalidate',
					'Content-Type': 'application/xml; charset=utf-8',
					'X-Content-Type-Options': 'nosniff',
				})
				.send(buildSitemap(siteUrl, routeRecords));
		} catch (error) {
			console.error('Unable to build the dynamic sitemap.', error);
			response
				.status(503)
				.set({
					'Cache-Control': 'no-store',
					'Content-Type': 'text/plain; charset=utf-8',
				})
				.send('Sitemap temporarily unavailable.');
		}
	};
}

/**
 * Loads the complete route inventory and surfaces failures to the HTTP handler.
 *
 * @returns {Promise<Array<{ path: string, lastmod?: string }>>} Current public sitemap routes.
 */
async function loadCurrentRouteRecords() {
	return loadStaticRouteRecords({ throwOnError: true });
}
