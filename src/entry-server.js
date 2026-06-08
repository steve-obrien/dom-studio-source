import { renderToString } from 'vue/server-renderer';
import { createDomStudioApp, getRouteHead } from './main.js';
import { hydrateAuthState } from './composable/useAuth.js';
import { getAuthSession, hasEntitlement } from '../server/lib/auth.js';

export async function render(url, ssrContext, serverContext = {}) {
	const { app, router, pinia } = createDomStudioApp();
	const auth = await getAuthSession(serverContext.req || { headers: {} });

	ssrContext.payload.auth = auth;
	hydrateAuthState(auth);

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

function applyRouteHead(route, ssrContext) {
	const head = getRouteHead(route);

	ssrContext.head.title = head.title;
	ssrContext.head.meta = head.meta;
}
