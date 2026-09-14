import { componentCatalog } from './componentCatalog.generated.js';

export const componentSections = ['components', 'data', 'charts', 'dev', 'forms', 'mobile', 'visual'];

/**
 * Returns component records that are safe for app-shell navigation and search.
 *
 * These records intentionally contain metadata only. Component implementations
 * and raw SFC source strings are resolved through lazy records or runtime-only
 * discovery so ordinary routes do not preload the whole component catalogue.
 *
 * @returns {Array<object>} Lightweight component discovery records.
 */
export function getComponentRecords() {
	return componentCatalog.map(recordFromCatalogRecord);
}

/**
 * Returns lazy loaders for generated component documentation routes.
 *
 * @returns {Array<object>} Component records with dynamic component and source loaders.
 */
export function getLazyComponentRecords() {
	return getComponentRecords()
		.map((record) => ({
			...record,
			loader: createComponentLoader(record.path),
			sourceLoader: createComponentLoader(record.path, true),
		}));
}

/**
 * Creates a documentation loader without importing the full component import map.
 *
 * @param {string} path Catalogued component path.
 * @param {boolean} source Whether to load raw SFC source.
 * @returns {Function} Lazy Vue Router or documentation source loader.
 */
function createComponentLoader(path, source = false) {
	/**
	 * Resolves the shared import map and then the requested component resource.
	 * @returns {Promise<object|string>} Component implementation or raw source.
	 */
	async function load() {
		const { loadComponent } = await import('./componentLoaders.js');
		return loadComponent(path, source);
	}
	return load;
}

/**
 * Finds the first metadata record for a public component route.
 *
 * @param {string} route Public route path.
 * @returns {object|undefined} Matching component record when one exists.
 */
export function getComponentRecordByRoute(route) {
	return getComponentRecords().find((record) => record.route === route);
}

/**
 * Builds legacy redirects for components that moved from /components to /forms.
 *
 * @returns {Array<{ from: string, to: string }>} Redirect records.
 */
export function getFormRedirectRecords() {
	return getLazyComponentRecords()
		.filter((record) => record.section === 'forms')
		.map((record) => ({
			from: `/components/${record.slug}`,
			to: record.route,
		}));
}

/**
 * Builds legacy redirects for components that moved from /components to /data.
 *
 * @returns {Array<{ from: string, to: string }>} Redirect records.
 */
export function getDataRedirectRecords() {
	return getLazyComponentRecords()
		.filter((record) => record.section === 'data')
		.map((record) => ({
			from: `/components/${record.slug}`,
			to: record.route,
		}));
}

/**
 * Builds legacy redirects for developer components from /components.
 *
 * @returns {Array<{ from: string, to: string }>} Redirect records.
 */
export function getDevRedirectRecords() {
	return getLazyComponentRecords()
		.filter((record) => record.section === 'dev')
		.map((record) => ({
			from: `/components/${record.slug}`,
			to: record.route,
		}));
}

/**
 * Converts a component section key into a readable navigation label.
 *
 * @param {string} section Section key.
 * @returns {string} Human-readable section label.
 */
export function labelFromSection(section) {
	return {
		components: 'Components',
		data: 'Data',
		charts: 'Data Visualisation',
		dev: 'Dev',
		forms: 'Forms',
		mobile: 'Mobile',
		visual: 'Visual',
	}[section] || labelFromSlug(section);
}

/**
 * Converts a URL slug into a title-cased label.
 *
 * @param {string} slug URL slug.
 * @returns {string} Human-readable label.
 */
export function labelFromSlug(slug) {
	return slug
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

/**
 * Converts a component export name into a default display label.
 *
 * @param {string} exportName Component export name.
 * @returns {string} Human-readable component label.
 */
export function labelFromExportName(exportName) {
	return labelFromSlug(
		String(exportName || '')
			.replace(/^Dom/, '')
			.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
			.toLowerCase(),
	);
}

/**
 * Builds a stable hash anchor for secondary component records.
 *
 * @param {object} record Component record.
 * @returns {string} URL hash anchor without the leading #.
 */
export function componentAnchor(record) {
	return String(record?.exportName || record?.slug || '')
		.replace(/^Dom/, 'dom-')
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.toLowerCase();
}

/**
 * Infers the primary component export name for a component folder slug.
 *
 * @param {string} slug Component folder slug.
 * @returns {string} Expected primary export name.
 */
export function primaryExportNameForSlug(slug) {
	return `Dom${slug
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('')}`;
}

/**
 * Normalizes a catalog module record into the shape expected by docs helpers.
 *
 * @param {object} record Static component catalog record.
 * @returns {object} Component discovery record.
 */
function recordFromCatalogRecord(record) {
	const doc = record.doc || {};
	return {
		...record,
		doc,
		studio: record.studio || doc.studio || {},
	};
}
