import { h } from 'vue';
import { getPageSeo } from './seo.js';
import { getDataRedirectRecords, getDevRedirectRecords, getFormRedirectRecords, getLazyComponentRecords } from './pages/_layout/componentManager.js';
import { getBlockLegacyRedirects, getBlockRouteRecords } from './pages/blocks/blockRegistry.js';

/**
 * Loads the catch-all 404 page component.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
const NotFoundPage = () => import('./NotFoundPage.vue');
/**
 * Loads the sign-in page component.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
const SignInPage = () => import('./pages/auth/sign-in/Index.vue');
/**
 * Loads the sign-up page component.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
const SignUpPage = () => import('./pages/auth/sign-up/Index.vue');
/**
 * Loads the blog article page component.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
const BlogArticlePage = () => import('./pages/blog/Article.vue');
/**
 * Loads the block preview page component.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
const BlockPreviewPage = () => import('./pages/blocks/Preview.vue');
/**
 * Loads the media browser page component.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
const MediaBrowserPage = () => import('./pages/data/media-browser/Index.vue');
/**
 * Loads the public home page component.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
const DomStudioHome = () => import('./pages/Index.vue');
/**
 * Loads the shared theme documentation and editor component.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
const ThemingPage = () => import('./pages/theming/Index.vue');
/**
 * Loads the floating headless guidance page component.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
const FloatingHeadlessPage = () => import('./pages/headless/floating/Index.vue');
/**
 * Loads the paywall page component.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
const PaywallPage = () => import('./pages/paywall/Index.vue');
const pageRouteModules = import.meta.glob([
	'./pages/**/Index.vue',
	'!./pages/Index.vue',
	'!./pages/auth/sign-in/Index.vue',
	'!./pages/auth/sign-up/Index.vue',
	'!./pages/blog/Article.vue',
	'!./pages/blocks/*/Index.vue',
	'!./pages/blocks/*/**/Index.vue',
	'!./pages/headless/floating/Index.vue',
	'!./pages/paywall/Index.vue',
]);
/**
 * Loads the generated component documentation page shell.
 *
 * @returns {Promise<object>} Vue SFC module.
 */
const generatedComponentPage = () => import('./pages/_layout/GeneratedComponentPage.vue');

/**
 * Resolves generated documentation before routing so SSR and hydration share the
 * same component, description, playground, and reference content on first render.
 *
 * @param {object} record Discovered component and source loaders.
 * @returns {Promise<object>} Vue route component with fully resolved documentation props.
 */
async function loadComponentDocumentation(record) {
	const [page, component, source] = await Promise.all([
		generatedComponentPage(),
		record.loader(),
		record.sourceLoader?.(),
	]);
	return {
		name: `${record.exportName}Documentation`,
		/**
		 * Renders the shared documentation shell with the route's resolved source.
		 *
		 * @returns {import('vue').VNode} Component documentation page.
		 */
		render() {
			return h(page.default, {
				component: component.default || component,
				componentSource: source?.default || source || '',
				section: record.section,
			});
		},
	};
}

/**
 * Converts a page module path into its public route path.
 *
 * @param {string} globKey import.meta.glob key.
 * @returns {string|null} Route path, or null when the page is private.
 */
function filePathToRoutePath(globKey) {
	const m = globKey.match(/^\.\/pages\/(.+)\/Index\.vue$/);
	if (!m) return null;
	const inner = m[1];
	if (inner === '.' || inner === '..' || inner.includes('..')) return null;
	if (inner.split('/').some(isPrivateRouteSegment)) return null;
	if (inner.toLowerCase() === 'index') return '/';
	return `/${inner}`;
}

/**
 * Checks whether a route path segment is a private grouping folder.
 *
 * @param {string} segment Route path segment.
 * @returns {boolean} True when the segment is private.
 */
function isPrivateRouteSegment(segment) {
	return /^\(.+\)$/.test(segment);
}

/**
 * Infers a title from a route path when explicit metadata is absent.
 *
 * @param {string} routePath Public route path.
 * @returns {string} Human-readable route title.
 */
function titleFromRoutePath(routePath) {
	if (routePath === '/') return 'Home';
	if (routePath === '/charts') return 'Data Visualisation';
	if (routePath === '/charts/finance') return 'Finance & Cashflow';
	const seg = routePath.split("/").filter(Boolean).pop();
	if (!seg) return 'Index';
	return seg
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

const fileBasedRoutes = Object.entries(pageRouteModules)
	.map(([key, loader]) => {
		const path = filePathToRoutePath(key);
		if (!path) return null;
		return {
			path,
			component: loader,
			meta: routeMeta(path),
		};
	})
	.filter(Boolean);

const manualRoutes = [
	{
		path: '/',
		component: DomStudioHome,
		meta: { title: 'DOM Studio', description: 'A complete Vue and Web Component UI system you can own, edit, and ship.' },
	},
	{
		path: '/headless/floating',
		component: FloatingHeadlessPage,
		meta: { title: 'Floating', description: 'Shared positioning guidance for DOM Studio popovers, dropdowns, comboboxes, autocomplete lists, tooltips, and custom floating layers.' },
	},
	{
		path: '/auth/sign-in',
		component: SignInPage,
		meta: { title: 'Sign in', description: 'Sign in to DOM Studio source access.' },
	},
	{
		path: '/auth/sign-up',
		component: SignUpPage,
		meta: { title: 'Sign up', description: 'Create a DOM Studio account.' },
	},
	{
		path: '/paywall',
		component: PaywallPage,
		meta: { title: 'Source access', description: 'Unlock DOM Studio source access.' },
	},
	{
		path: '/tools',
		redirect: '/tools/json-unstringifier',
	},
	{
		path: '/theming/editor',
		component: ThemingPage,
		meta: { title: 'Theme Editor', description: 'Create and export a DOM Studio theme against live components.' },
	},
	{
		path: '/blog/:slug',
		component: BlogArticlePage,
		props: (route) => ({ key: route.params.slug }),
		meta: { title: 'Blog Article' },
	},
	{
		path: '/blocks/:blockPath(.*)/preview/:example',
		component: BlockPreviewPage,
		meta: { title: 'Block Preview', robots: 'noindex,follow' },
	},
	{
		path: '/data/media-browser/:folderPath(.*)*',
		component: MediaBrowserPage,
		meta: routeMeta('/data/media-browser'),
	},
	{
		path: '/data/json-viewer',
		redirect: '/dev/json-viewer',
	},
	{
		path: '/visual/code-block',
		redirect: '/dev/code-block',
	},
	// The Monaco Studio experiment was replaced by the canvas, whose code view can use Monaco.
	...['/designer/studio', '/components/studio', '/experiments/template-editor'].map((path) => ({ path, redirect: '/designer/canvas' })),
];

const manualPaths = new Set(manualRoutes.map((r) => r.path));
const fileBasedPaths = new Set(fileBasedRoutes.map((r) => r.path));

const blockRoutes = getBlockRouteRecords()
	.map((record) => ({
		path: record.route,
		component: record.loader,
		meta: {
			title: record.label,
			description: record.summary,
		},
	}));

const blockLegacyRedirects = getBlockLegacyRedirects()
	.filter((record) => record.from !== record.to && !fileBasedPaths.has(record.from))
	.map((record) => ({
		path: record.from,
		redirect: record.to,
	}));

const generatedComponentRoutes = getLazyComponentRecords()
	.map((record) => {
		if (fileBasedPaths.has(record.route)) return null;
		return {
			path: record.route,
			component: () => loadComponentDocumentation(record),
			meta: routeMeta(record.route),
		};
	})
	.filter(Boolean);

const movedFormRedirects = getFormRedirectRecords()
	.map((record) => ({
		path: record.from,
		redirect: record.to,
	}));

const movedDataRedirects = getDataRedirectRecords()
	.map((record) => ({
		path: record.from,
		redirect: record.to,
	}));

const movedDevRedirects = getDevRedirectRecords()
	.map((record) => ({
		path: record.from,
		redirect: record.to,
	}));

const legacyDocsRedirects = [
	{
		path: '/docs',
		redirect: '/',
	},
	{
		path: '/docs/:pathMatch(.*)*',
		redirect: redirectDocsPath,
	},
];

export const routes = [
	...manualRoutes,
	...fileBasedRoutes.filter((r) => !manualPaths.has(r.path)),
	...blockRoutes,
	...blockLegacyRedirects,
	...generatedComponentRoutes,
	...movedFormRedirects,
	...movedDataRedirects,
	...movedDevRedirects,
	...legacyDocsRedirects,
	{
		path: '/:pathMatch(.*)*',
		name: 'NotFound',
		component: NotFoundPage,
		meta: { title: 'Page Not Found', description: 'This page could not be found. Browse the DOM Studio component library to find the documentation you need.', robots: 'noindex,follow' },
	},
].map((route) => route.redirect ? route : {
	...route,
	meta: getPageSeo(route.path === '/data/media-browser/:folderPath(.*)*' ? '/data/media-browser' : route.path, route.meta),
});

/**
 * Builds route metadata for generated or file-discovered routes.
 *
 * @param {string} path Public route path.
 * @returns {object} Vue Router route metadata.
 */
function routeMeta(path) {
	return {
		title: titleFromRoutePath(path),
	};
}

/**
 * Redirects legacy /docs URLs to their current public path.
 *
 * @param {object} to Vue Router target route.
 * @returns {object} Redirect location.
 */
function redirectDocsPath(to) {
	const pathMatch = to.params.pathMatch;
	const segments = Array.isArray(pathMatch)
		? pathMatch
		: [pathMatch].filter(Boolean);
	return {
		path: `/${segments.join('/')}`,
		query: to.query,
		hash: to.hash,
	};
}
