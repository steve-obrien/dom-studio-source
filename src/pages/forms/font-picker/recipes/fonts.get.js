// Copy into your own Node.js 22 / Express backend; this is not a DOM Studio API.
// Mount with: import getFonts from './fonts.get.js'; app.get('/api/fonts', getFonts);
// Set GOOGLE_FONTS_API_KEY on the server only.

const refreshInterval = 24 * 60 * 60 * 1000;
const retryInterval = 5 * 60 * 1000;
let catalogue = null;
let nextRefreshAt = 0;
let pendingRefresh = null;

/**
 * Refresh the process-local catalogue, retaining the last good data on failure.
 * Only validated family/category records are exposed to consumers. Never log
 * the upstream URL or raw errors, which could contain the private API key.
 *
 * @returns {Promise<void>} Resolves after updating the cache or retry deadline.
 */
async function refreshCatalogue() {
	try {
		const key = process.env.GOOGLE_FONTS_API_KEY;
		if (!key) throw new Error('Missing server-side Google Fonts key.');

		const url = new URL('https://www.googleapis.com/webfonts/v1/webfonts');
		url.searchParams.set('key', key);
		url.searchParams.set('sort', 'alpha');
		const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
		if (!response.ok) throw new Error('Catalogue request failed.');
		const body = await response.json();
		if (!Array.isArray(body.items) || !body.items.length) {
			throw new Error('Empty or invalid catalogue.');
		}

		const fonts = [];
		for (const item of body.items) {
			if (typeof item?.family !== 'string' || !item.family.trim()) {
				throw new Error('Invalid font family.');
			}
			fonts.push({
				family: item.family.trim(),
				category: typeof item.category === 'string' ? item.category : 'sans-serif',
			});
		}
		catalogue = { fonts, updatedAt: new Date().toISOString() };
		nextRefreshAt = Date.now() + refreshInterval;
	} catch {
		nextRefreshAt = Date.now() + retryInterval;
		// Add a sanitised failure metric here in your application's monitoring.
	}
}

/**
 * Serve cached metadata, coalescing expired-cache requests into one refresh.
 * A missing cache fails explicitly so the frontend can use its bundled list.
 *
 * @param {import('express').Request} _request Incoming application request.
 * @param {import('express').Response} response Application JSON response.
 * @returns {Promise<void>} Resolves once the catalogue or a 503 is sent.
 */
export default async function getFonts(_request, response) {
	if (!pendingRefresh && Date.now() >= nextRefreshAt) {
		pendingRefresh = refreshCatalogue();
	}
	if (pendingRefresh) {
		await pendingRefresh;
		pendingRefresh = null;
	}
	if (!catalogue) {
		response.set('Cache-Control', 'no-store');
		response.set('Retry-After', '300');
		response.status(503).json({ error: 'Font catalogue temporarily unavailable.' });
		return;
	}
	response.set('Cache-Control', 'public, max-age=300');
	response.json(catalogue);
}
