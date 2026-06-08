import NotFoundPage from './NotFoundPage.vue';
import SignInPage from './pages/auth/sign-in/Index.vue';
import SignUpPage from './pages/auth/sign-up/Index.vue';
import DomStudioHome from './pages/docs/Index.vue';
import FloatingHeadlessPage from './pages/docs/headless/floating/Index.vue';
import PaywallPage from './pages/paywall/Index.vue';
import { getFormRedirectRecords, getLazyComponentRecords } from './pages/docs/_layout/componentManager.js';

const pageRouteModules = import.meta.glob([
	'./pages/**/Index.vue',
	'!./pages/auth/sign-in/Index.vue',
	'!./pages/auth/sign-up/Index.vue',
	'!./pages/docs/Index.vue',
	'!./pages/docs/headless/floating/Index.vue',
	'!./pages/paywall/Index.vue',
]);
const generatedComponentPage = () => import('./pages/docs/_layout/GeneratedComponentPage.vue');

function filePathToRoutePath(globKey) {
	const m = globKey.match(/^\.\/pages\/(.+)\/Index\.vue$/);
	if (!m) return null;
	const inner = m[1];
	if (inner === '.' || inner === '..' || inner.includes('..')) return null;
	if (inner.toLowerCase() === 'index') return '/';
	return `/${inner}`;
}

function titleFromRoutePath(routePath) {
	if (routePath === '/') return 'Home';
	if (routePath === '/docs') return 'Docs';
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
		meta: { title: 'DOM Studio', description: 'Source-owned Vue and web component primitives for humans and LLMs.' },
	},
	{
		path: '/docs',
		component: DomStudioHome,
		meta: { title: 'Docs', description: 'DOM Studio component docs, blocks, theme tokens, and AI builder guidance.' },
	},
	{
		path: '/docs/headless/floating',
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
];

const manualPaths = new Set(manualRoutes.map((r) => r.path));
const fileBasedPaths = new Set(fileBasedRoutes.map((r) => r.path));

const generatedComponentRoutes = getLazyComponentRecords()
	.map((record) => {
		if (fileBasedPaths.has(record.route)) return null;
		return {
			path: record.route,
			component: generatedComponentPage,
			props: {
				componentLoader: record.loader,
				componentSourceLoader: record.sourceLoader,
				section: record.section,
			},
			meta: routeMeta(record.route),
		};
	})
	.filter(Boolean);

const movedFormRedirects = getFormRedirectRecords()
	.map((record) => ({
		path: record.from,
		redirect: record.to,
	}));

export const routes = [
	...manualRoutes,
	...fileBasedRoutes.filter((r) => !manualPaths.has(r.path)),
	...generatedComponentRoutes,
	...movedFormRedirects,
	{
		path: '/:pathMatch(.*)*',
		name: 'NotFound',
		component: NotFoundPage,
		meta: { title: 'Page not found' },
	},
];

function routeMeta(path) {
	return {
		title: titleFromRoutePath(path),
		...(path.startsWith('/experiments') ? { requiresEntitlement: 'source' } : {}),
	};
}
