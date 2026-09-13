import { renderToString } from 'vue/server-renderer';
import { createDomStudioApp, getRouteHead } from './main.js';
import { hydrateAuthState } from './composable/useAuth.js';
import { hydrateBillingOffer } from './composable/useBillingOffer.js';
import { getAuthSession, hasEntitlement } from '../server/lib/auth.js';
import { getBillingOffer } from '../server/lib/billingOffer.js';

export async function render(url, ssrContext, serverContext = {}) {
	ssrContext.req = serverContext.req || { headers: {} };
	ssrContext.res = serverContext.res || {};

	const { app, router, pinia } = createDomStudioApp();
	const auth = await getAuthSession(ssrContext.req);
	const billingOffer = getBillingOffer();

	ssrContext.payload.auth = auth;
	ssrContext.payload.billingOffer = billingOffer;
	hydrateAuthState(auth);
	hydrateBillingOffer(billingOffer);

	await router.push(url);
	await router.isReady();

	let route = router.currentRoute.value;
	const requiredEntitlement = route.matched.find((record) => record.meta?.requiresEntitlement)?.meta?.requiresEntitlement;
	if (requiredEntitlement && !hasEntitlement(auth, requiredEntitlement)) {
		await router.replace({
			path: '/paywall',
			query: { from: route.fullPath },
		});
		await router.isReady();
		ssrContext.status = 402;
		route = router.currentRoute.value;
	}

	applyRouteHead(route, ssrContext);
	if (route.matched.some((record) => record.name === 'NotFound')) {
		ssrContext.status = 404;
	}

	const appHtml = await renderToString(app, ssrContext);

	return {
		appHtml,
		payload: {
			...ssrContext.payload,
			pinia: pinia.state.value,
		},
		status: ssrContext.status,
	};
}

/**
 * Copies shared route metadata into the head rendered by Now.
 *
 * @param {import('vue-router').RouteLocationNormalizedLoaded} route Resolved route.
 * @param {object} ssrContext Request-local server-rendering context.
 * @returns {void}
 */
function applyRouteHead(route, ssrContext) {
	const head = getRouteHead(route);

	ssrContext.head.title = head.title;
	ssrContext.head.meta = head.meta;
	ssrContext.head.link = head.link;
}
