const blockPageModules = import.meta.glob('./*/Index.vue');
const blockMetaModules = import.meta.glob('./*/block.meta.js', { eager: true, import: 'default' });
const blockExampleModules = import.meta.glob('./*/examples/*.vue');

export const defaultBlockIcon = 'M5 5h14v14H5V5Zm4 4h6M9 13h6M9 17h3';

const categoryDescriptions = {
	'App Shells': 'Whole-product layouts for dashboards, workspaces, and persistent navigation.',
	Communication: 'Messaging, inbox, and conversation surfaces with realistic application density.',
	Conversion: 'Authentication, activation, and setup flows that move users into the product.',
	'Data Capture': 'Form-led compositions for collecting and validating structured product data.',
	Monetization: 'Billing, subscription, pricing, and revenue-management surfaces for SaaS products.',
	Operations: 'Internal workspaces for support, administration, customer success, and account operations.',
	'Work Management': 'Planning and execution surfaces for organizing backlog, capacity, and delivery.',
};

export function getBlockRecords() {
	return Object.keys(blockPageModules)
		.map(recordFromPagePath)
		.filter(Boolean)
		.sort(sortBlockRecords);
}

export function getBlockCategories() {
	const categories = new Map();

	for (const record of getBlockRecords()) {
		if (!categories.has(record.category)) {
			categories.set(record.category, {
				name: record.category,
				description: record.categoryDescription,
				order: record.categoryOrder,
				records: [],
			});
		}
		categories.get(record.category).records.push(record);
	}

	return Array.from(categories.values())
		.map((category) => ({
			...category,
			count: category.records.length,
		}))
		.sort((a, b) => {
			const orderDelta = a.order - b.order;
			if (orderDelta) return orderDelta;
			return a.name.localeCompare(b.name);
		});
}

export function getBlockNavItems() {
	return getBlockRecords().map((record) => ({
		to: record.route,
		label: record.label,
		tag: record.tag,
		icon: record.icon,
	}));
}

function recordFromPagePath(pagePath) {
	const match = pagePath.match(/^\.\/([^/]+)\/Index\.vue$/);
	if (!match) return null;

	const slug = match[1];
	const meta = blockMetaModules[`./${slug}/block.meta.js`] || {};
	const category = meta.category || 'Uncategorised';

	return {
		id: `blocks/${slug}`,
		slug,
		label: labelFromSlug(slug),
		route: `/blocks/${slug}`,
		category,
		categoryDescription: meta.categoryDescription || categoryDescriptions[category] || 'Auto-discovered block family.',
		categoryOrder: finiteNumber(meta.categoryOrder, 1000),
		summary: meta.summary || `Auto-discovered ${labelFromSlug(slug).toLowerCase()} block.`,
		icon: meta.icon || defaultBlockIcon,
		tag: meta.tag || '',
		order: finiteNumber(meta.order, 1000),
		exampleCount: countExamples(slug),
		sourcePath: `src/pages/blocks/${slug}`,
	};
}

function countExamples(slug) {
	const prefix = `./${slug}/examples/`;
	return Object.keys(blockExampleModules).filter((path) => path.startsWith(prefix)).length;
}

function finiteNumber(value, fallback) {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
}

function labelFromSlug(slug) {
	return slug
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function sortBlockRecords(a, b) {
	const orderDelta = a.order - b.order;
	if (orderDelta) return orderDelta;
	return a.label.localeCompare(b.label);
}
