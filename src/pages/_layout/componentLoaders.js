const lazyComponentModules = import.meta.glob([
	'../components/*/Dom*.vue',
	'../data/*/Dom*.vue',
	'../charts/*/Dom*.vue',
	'../dev/*/Dom*.vue',
	'../forms/*/Dom*.vue',
	'../mobile/*/Dom*.vue',
	'../visual/*/Dom*.vue',
	'!../components/playground/DomRenderer.vue',
	'!../components/toast/DomToastItem.vue',
	'!../forms/_shared/Dom*.vue',
], { import: 'default' });
const lazyComponentSourceModules = import.meta.glob([
	'../components/*/Dom*.vue',
	'../data/*/Dom*.vue',
	'../charts/*/Dom*.vue',
	'../dev/*/Dom*.vue',
	'../forms/*/Dom*.vue',
	'../mobile/*/Dom*.vue',
	'../visual/*/Dom*.vue',
	'!../components/playground/DomRenderer.vue',
	'!../components/toast/DomToastItem.vue',
	'!../forms/_shared/Dom*.vue',
], { import: 'default', query: '?raw' });

/**
 * Resolves a component implementation or source only when documentation needs it.
 * Keeping these import maps in a separate chunk avoids shipping every component's
 * preload dependency list with the homepage router.
 *
 * @param {string} path Catalogued component path.
 * @param {boolean} source Whether to load raw SFC source instead of the component.
 * @returns {Promise<object|string>} Component or source module content.
 */
export function loadComponent(path, source = false) {
	const loader = (source ? lazyComponentSourceModules : lazyComponentModules)[path];
	if (!loader) throw new Error(`Unknown component path: ${path}`);
	return loader();
}
