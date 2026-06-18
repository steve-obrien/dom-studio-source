const componentPageModules = import.meta.glob([
	'../../components/*/Dom*.vue',
	'../../data/*/Dom*.vue',
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

function recordFromPath(path) {
	const match = path.match(/^\.\.\/\.\.\/(components|data|forms|mobile|visual)\/([^/]+)\/(Dom[^/]+)\.vue$/);
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

function labelFromSection(section) {
	return {
		components: 'Components',
		data: 'Data',
		forms: 'Forms',
		mobile: 'Mobile',
		visual: 'Visual',
	}[section] || labelFromSlug(section);
}

function labelFromExportName(exportName) {
	return labelFromSlug(
		String(exportName || '')
			.replace(/^Dom/, '')
			.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
			.toLowerCase(),
	);
}

function labelFromSlug(slug) {
	return String(slug || '')
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}
