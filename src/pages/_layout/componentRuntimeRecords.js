const eagerComponentModules = import.meta.glob([
	'../components/*/Dom*.vue',
	'../data/*/Dom*.vue',
	'../forms/*/Dom*.vue',
	'../mobile/*/Dom*.vue',
	'../visual/*/Dom*.vue',
	'!../components/playground/DomRenderer.vue',
	'!../components/toast/DomToastItem.vue',
	'!../forms/_shared/Dom*.vue',
], { eager: true, import: 'default' });

/**
 * Returns eager component records for editor surfaces that need real components.
 *
 * This module is intentionally separate from componentManager.js so ordinary
 * routes, navigation, and search can stay metadata-only while the inspector and
 * related-component docs can still inspect props and render components.
 *
 * @returns {Array<object>} Component records with live Vue component objects.
 */
export function getRuntimeComponentRecords() {
	return Object.entries(eagerComponentModules)
		.map(([path, component]) => recordFromPath(path, component))
		.filter(Boolean);
}

/**
 * Converts an import.meta.glob key into a component discovery record.
 *
 * @param {string} path Glob key relative to this layout folder.
 * @param {object} component Vue component object.
 * @returns {object|null} Component record, or null for unrecognized paths.
 */
function recordFromPath(path, component) {
	const match = path.match(/^\.\.\/(components|data|forms|mobile|visual)\/([^/]+)\/(Dom[^/]+)\.vue$/);
	if (!match) return null;

	const [, section, slug, exportName] = match;
	return {
		id: `${section}/${slug}`,
		path,
		section,
		slug,
		exportName,
		route: `/${section}/${slug}`,
		component,
	};
}
