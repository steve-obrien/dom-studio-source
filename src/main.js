import { createNowApp } from '#now/runtime/createNowApp.js';
import App from './App.vue';
import './font.css';
import './site.css';
// Fold the homepage's intrinsic popover styles into the initial stylesheet.
import './pages/components/popover/popover.css';
import { routes } from './routes';
import { getAuthState, hasEntitlement, refreshSession } from './composable/useAuth.js';
import { initTheme } from './pages/lib/vue/useTheme.js';

import { getRouteHead, normalizePagePath } from './seo.js';
export { getRouteHead } from './seo.js';
const globalSearchOpenEvent = 'dom-studio:open-global-search';
const documentationRoutePrefixes = [
	'/ai',
	'/blocks',
	'/component-spec',
	'/components',
	'/charts',
	'/forms',
	'/headless',
	'/mobile',
	'/pricing',
	'/theming',
	'/visual',
];

if (typeof window !== 'undefined') {
	installGlobalSearchShortcut();
	if (import.meta.env.MODE === 'development') {
		void import('./motionDebug.js').then(installDevelopmentMotionDebugging);
	}
}

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

/**
 * Installs development-only controls for slowing animations and transitions.
 *
 * @param {{ installMotionDebugging: Function }} debugModule Loaded motion-debug module.
 * @returns {void}
 */
function installDevelopmentMotionDebugging(debugModule) {
	const cleanup = debugModule.installMotionDebugging();

	import.meta.hot?.dispose(cleanup);
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

/**
 * Replaces page-owned tags after navigation so canonicals and social metadata cannot leak.
 *
 * @param {import('vue-router').RouteLocationNormalizedLoaded} route Resolved route.
 * @returns {void}
 */
export function updateDocumentHead(route) {
	const head = getRouteHead(route);
	document.title = head.title;

	const pageTags = 'link[rel="canonical"], meta[name="description"], meta[name="keywords"], meta[name="robots"], meta[property^="og:"], meta[property^="article:"], meta[name^="twitter:"]';
	for (const tag of document.head.querySelectorAll(pageTags)) tag.remove();
	for (const attributes of head.meta) {
		const tag = document.createElement('meta');
		for (const [key, value] of Object.entries(attributes)) {
			if (value !== undefined && value !== null) tag.setAttribute(key, value);
		}
		document.head.appendChild(tag);
	}
	for (const attributes of head.link) {
		const tag = document.createElement('link');
		for (const [key, value] of Object.entries(attributes)) tag.setAttribute(key, value);
		document.head.appendChild(tag);
	}
	if (normalizePagePath(route.path) !== '/blog') document.getElementById('blog-jsonld')?.remove();
	if (!head.meta.some((tag) => tag.property === 'og:type' && tag.content === 'article')) {
		document.getElementById('blog-article-jsonld')?.remove();
	}
}

function applyInitialTheme() {
	initTheme();
}
