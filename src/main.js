import { createNowApp } from '#now/runtime/createNowApp.js';
import App from './App.vue';
import './style.css';
import { routes } from './routes';
import { getAuthState, hasEntitlement, refreshSession } from './composable/useAuth.js';
import { initTheme } from './pages/lib/vue/useTheme.js';

const siteName = 'getdom.studio';
const globalSearchOpenEvent = 'dom-studio:open-global-search';
const documentationRoutePrefixes = [
	'/ai',
	'/blocks',
	'/component-spec',
	'/components',
	'/forms',
	'/headless',
	'/mobile',
	'/pricing',
	'/theming',
	'/visual',
];

if (typeof window !== 'undefined') installGlobalSearchShortcut();

const scrollBehavior = (to, from, savedPosition) => {
	if (savedPosition) return savedPosition;
	if (isDocumentationRoutePath(to.path) && isDocumentationRoutePath(from.path)) return false;
	return { top: 0 };
};

function isDocumentationRoutePath(path) {
	if (path === '/') return true;
	return documentationRoutePrefixes.some((prefix) => (
		path === prefix || path.startsWith(`${prefix}/`)
	));
}

export function createDomStudioApp() {
	const { app, router, pinia } = createNowApp({
		App,
		routes,
		routerOptions: {
			scrollBehavior,
		},
	});

	if (typeof window !== 'undefined') {
		applyInitialTheme();
		installAuthGuard(router);
		router.afterEach((to) => updateDocumentHead(to));
	}

	return { app, router, pinia };
}

function installGlobalSearchShortcut() {
	if (window.__domStudioGlobalSearchShortcutHandler) {
		window.removeEventListener('keydown', window.__domStudioGlobalSearchShortcutHandler, { capture: true });
		document.removeEventListener('keydown', window.__domStudioGlobalSearchShortcutHandler, { capture: true });
	}

	window.__domStudioGlobalSearchShortcutHandler = (event) => {
		if (!isGlobalSearchShortcut(event)) return;
		event.__domStudioGlobalSearchHandled = true;
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation?.();
		window.dispatchEvent(new CustomEvent(globalSearchOpenEvent));
	};
	window.addEventListener('keydown', window.__domStudioGlobalSearchShortcutHandler, { capture: true });
	document.addEventListener('keydown', window.__domStudioGlobalSearchShortcutHandler, { capture: true });
}

function isGlobalSearchShortcut(event) {
	if (event.repeat || event.altKey || event.shiftKey || event.isComposing) return false;
	if (!(event.metaKey || event.ctrlKey)) return false;
	return String(event.key || '').toLowerCase() === 'k';
}

function installAuthGuard(router) {
	router.beforeEach(async (to) => {
		const requiredEntitlement = to.matched.find((record) => record.meta?.requiresEntitlement)?.meta?.requiresEntitlement;
		if (!requiredEntitlement) return true;

		getAuthState();
		if (!hasEntitlement(requiredEntitlement)) {
			await refreshSession();
		}

		if (hasEntitlement(requiredEntitlement)) return true;

		return {
			path: '/paywall',
			query: { from: to.fullPath },
		};
	});
}

export function getRouteHead(route) {
	const title = route.meta?.title ? `${route.meta.title} | ${siteName}` : siteName;
	const description = route.meta?.description || '';
	const keywords = route.meta?.keywords || '';
	const robots = route.meta?.robots || '';

	return {
		title,
		meta: [
			description ? { name: 'description', content: description } : null,
			keywords ? { name: 'keywords', content: keywords } : null,
			robots ? { name: 'robots', content: robots } : null,
		].filter(Boolean),
	};
}

export function updateDocumentHead(route) {
	const head = getRouteHead(route);

	document.title = head.title;

	const description = head.meta.find((meta) => meta.name === 'description')?.content;
	const keywords = head.meta.find((meta) => meta.name === 'keywords')?.content;
	const robots = head.meta.find((meta) => meta.name === 'robots')?.content;

	if (description) {
		updateMetaTag('meta[name="description"]', {
			name: 'description',
			content: description,
		});
	} else {
		removeMetaTag('meta[name="description"]');
	}

	if (keywords) {
		updateMetaTag('meta[name="keywords"]', {
			name: 'keywords',
			content: keywords,
		});
	} else {
		removeMetaTag('meta[name="keywords"]');
	}

	if (robots) {
		updateMetaTag('meta[name="robots"]', {
			name: 'robots',
			content: robots,
		});
	} else {
		removeMetaTag('meta[name="robots"]');
	}
}

function applyInitialTheme() {
	initTheme();
}

function updateMetaTag(selector, attributes) {
	let tag = document.head.querySelector(selector);
	if (!tag) {
		tag = document.createElement('meta');
		document.head.appendChild(tag);
	}

	for (const [key, value] of Object.entries(attributes)) {
		tag.setAttribute(key, value);
	}
}

function removeMetaTag(selector) {
	document.head.querySelector(selector)?.remove();
}
