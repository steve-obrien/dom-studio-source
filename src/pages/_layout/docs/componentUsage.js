const componentPageModules = import.meta.glob([
	'../../components/*/Dom*.vue',
	'../../data/*/Dom*.vue',
	'../../dev/*/Dom*.vue',
	'../../forms/*/Dom*.vue',
	'../../mobile/*/Dom*.vue',
	'../../visual/*/Dom*.vue',
	'!../../components/playground/DomRenderer.vue',
	'!../../components/toast/DomToastItem.vue',
	'!../../forms/_shared/Dom*.vue',
]);

const componentRecords = Object.keys(componentPageModules)
	.map(recordFromPath)
	.filter(Boolean);

const componentRecordsByName = new Map(
	componentRecords.map((record) => [record.exportName, record]),
);

/**
 * Finds DOM Studio component references in a source snippet.
 *
 * @param {string} source Source code to inspect.
 * @returns {Array<object>} Matched component usage records.
 */
export function getComponentUsage(source) {
	if (!source) return [];

	const seen = new Set();
	const usage = [];
	const matcher = /\bDom[A-Z][A-Za-z0-9]*\b/g;
	let match;

	while ((match = matcher.exec(source))) {
		const name = match[0];
		const record = componentRecordsByName.get(name);
		if (!record || seen.has(name)) continue;

		seen.add(name);
		usage.push({
			...record,
			label: labelFromExportName(name),
			sectionLabel: labelFromSection(record.section),
			index: match.index,
		});
	}

	return usage.sort((a, b) => a.index - b.index);
}

/**
 * Converts a component glob path into a lightweight component record.
 *
 * @param {string} path Glob path from import.meta.glob.
 * @returns {object|null} Component usage record, or null when unrecognized.
 */
function recordFromPath(path) {
	const match = path.match(/^\.\.\/\.\.\/(components|data|dev|forms|mobile|visual)\/([^/]+)\/(Dom[^/]+)\.vue$/);
	if (!match) return null;

	const [, section, slug, exportName] = match;

	return {
		id: `${section}/${slug}`,
		section,
		slug,
		exportName,
		route: `/${section}/${slug}`,
	};
}

/**
 * Converts a component section key into a readable label.
 *
 * @param {string} section Section key.
 * @returns {string} Human-readable section label.
 */
function labelFromSection(section) {
	return {
		components: 'Components',
		data: 'Data',
		dev: 'Dev',
		forms: 'Forms',
		mobile: 'Mobile',
		visual: 'Visual',
	}[section] || labelFromSlug(section);
}

/**
 * Converts a component export name into a readable label.
 *
 * @param {string} exportName Component export name.
 * @returns {string} Human-readable label.
 */
function labelFromExportName(exportName) {
	return labelFromSlug(
		String(exportName || '')
			.replace(/^Dom/, '')
			.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
			.toLowerCase(),
	);
}

/**
 * Converts a URL slug into a title-cased label.
 *
 * @param {string} slug URL slug.
 * @returns {string} Human-readable label.
 */
function labelFromSlug(slug) {
	return String(slug || '')
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}
