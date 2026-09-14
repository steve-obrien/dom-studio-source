const blockPageModules = import.meta.glob('./**/Index.vue');
const blockMetaModules = import.meta.glob('./**/block.meta.js', { eager: true, import: 'default' });
// Only inventory paths: no example import functions or dependency preload maps.
const blockExamplePaths = Object.keys(import.meta.glob('./**/examples/*.vue'));

export const defaultBlockIcon = 'M5 5h14v14H5V5Zm4 4h6M9 13h6M9 17h3';

const categoryDescriptions = {
	'App Shells': 'Whole-product layouts for dashboards, workspaces, and persistent navigation.',
	'Account Settings': 'User-facing settings surfaces for preferences, account safety, access, and personalization.',
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
	return getBlockCategoryTree().map((category) => ({
		id: category.id,
		name: category.name,
		description: category.description,
		order: category.order,
		count: category.count,
		records: flattenCategoryRecords(category),
	}));
}

export function getBlockCategoryTree() {
	const categories = new Map();

	for (const record of getBlockRecords()) {
		let siblings = categories;
		const categoryPath = [];

		record.categoryPath.forEach((name, index) => {
			categoryPath.push(name);

			if (!siblings.has(name)) {
				siblings.set(name, createCategoryNode(name, categoryPath, record, index));
			}

			const category = siblings.get(name);
			category.order = Math.min(category.order, record.categoryOrders[index] ?? 1000);
			category.description = category.description || categoryDescriptionFor(record, index);

			if (index === record.categoryPath.length - 1) {
				category.records.push(record);
			}

			siblings = category._children;
		});
	}

	return Array.from(categories.values())
		.map(finalizeCategoryNode)
		.sort(sortCategoryNodes);
}

export function getBlockRecordByPath(path) {
	const blockPath = normalizeBlockPath(path);
	if (!blockPath) return null;

	return getBlockRecords().find((record) => (
		record.blockPath === blockPath
		|| record.slug === blockPath
	)) || null;
}

export function getBlockLegacyRedirects() {
	return getBlockRecords()
		.filter((record) => record.legacyRoute !== record.route)
		.map((record) => ({
			from: record.legacyRoute,
			to: record.route,
		}));
}

export function getBlockRouteRecords() {
	return getBlockRecords()
		.map((record) => {
			const loader = blockPageModules[`./${record.blockPath}/Index.vue`];
			if (!loader) return null;

			return {
				route: record.route,
				label: record.label,
				summary: record.summary,
				loader,
			};
		})
		.filter(Boolean);
}

export function getBlockNavItems() {
	return getBlockCategoryTree().map(navItemFromCategory);
}

function navItemFromCategory(category) {
	return {
		to: `/blocks#${category.id}`,
		label: category.name,
		count: category.count,
		icon: firstRecordInCategory(category)?.icon || defaultBlockIcon,
		children: [
			...category.children.map(navItemFromCategory),
			...category.records.map(navItemFromRecord),
		],
	};
}

function navItemFromRecord(record) {
	return {
		to: record.route,
		label: record.label,
		tag: publicBlockNavTag(record.tag),
		icon: record.icon,
	};
}

/**
 * Converts internal block metadata into concise public sidebar badges.
 *
 * @param {unknown} value Block metadata tag.
 * @returns {string} Public navigation badge text, or an empty string.
 */
function publicBlockNavTag(value) {
	const tag = String(value || '').trim();
	const normalizedTag = tag.toLowerCase();
	if (normalizedTag === 'reviewed') return '';
	if (normalizedTag === 'api-backed') return 'API';
	return tag;
}

function recordFromPagePath(pagePath) {
	const match = pagePath.match(/^\.\/(.+)\/Index\.vue$/);
	if (!match) return null;

	const blockPath = match[1];
	if (!blockPath || blockPath === 'Index' || blockPath.includes('..')) return null;

	const slug = blockPath.split('/').pop();
	const meta = blockMetaModules[`./${blockPath}/block.meta.js`] || {};
	const categoryPath = normalizeCategoryPath(meta, blockPath);
	const category = categoryPath[0];

	return {
		id: `blocks/${blockPath}`,
		slug,
		blockPath,
		label: labelFromSlug(slug),
		route: `/blocks/${blockPath}`,
		legacyRoute: `/blocks/${slug}`,
		category,
		categoryPath,
		categoryLabel: categoryPath.join(' / '),
		categoryDescription: meta.categoryDescription || categoryDescriptions[category] || 'Auto-discovered block family.',
		categoryOrder: finiteNumber(meta.categoryOrder, 1000),
		categoryOrders: normalizeCategoryOrders(meta, categoryPath),
		summary: meta.summary || `Auto-discovered ${labelFromSlug(slug).toLowerCase()} block.`,
		icon: meta.icon || defaultBlockIcon,
		tag: meta.tag || '',
		order: finiteNumber(meta.order, 1000),
		exampleCount: countExamples(blockPath),
		sourcePath: `src/pages/blocks/${blockPath}`,
	};
}

function createCategoryNode(name, categoryPath, record, index) {
	return {
		id: categoryId(categoryPath),
		name,
		description: categoryDescriptionFor(record, index),
		order: record.categoryOrders[index] ?? 1000,
		categoryPath: [...categoryPath],
		records: [],
		children: [],
		count: 0,
		_children: new Map(),
	};
}

function finalizeCategoryNode(category) {
	const children = Array.from(category._children.values())
		.map(finalizeCategoryNode)
		.sort(sortCategoryNodes);
	const records = [...category.records].sort(sortBlockRecords);
	const count = records.length + children.reduce((total, child) => total + child.count, 0);

	return {
		id: category.id,
		name: category.name,
		description: category.description || 'Auto-discovered block family.',
		order: category.order,
		categoryPath: category.categoryPath,
		records,
		children,
		count,
	};
}

function flattenCategoryRecords(category) {
	return [
		...category.records,
		...category.children.flatMap(flattenCategoryRecords),
	].sort(sortBlockRecords);
}

function firstRecordInCategory(category) {
	return category.records[0] || category.children.map(firstRecordInCategory).find(Boolean);
}

function categoryDescriptionFor(record, index) {
	if (index === record.categoryPath.length - 1) return record.categoryDescription;
	return categoryDescriptions[record.categoryPath[index]] || '';
}

function normalizeCategoryPath(meta, blockPath) {
	const value = meta.categoryPath ?? meta.categories ?? meta.category;
	const fallback = blockPath
		.split('/')
		.slice(0, -1)
		.map(labelFromSlug);
	if (!value && fallback.length) return fallback;

	const source = value || 'Uncategorised';
	const parts = Array.isArray(value)
		? source
		: String(source).split('/');
	const categoryPath = parts
		.map((part) => String(part).trim())
		.filter(Boolean);

	return categoryPath.length ? categoryPath : ['Uncategorised'];
}

function normalizeCategoryOrders(meta, categoryPath) {
	if (Array.isArray(meta.categoryOrders)) {
		return categoryPath.map((_, index) => finiteNumber(meta.categoryOrders[index], index === 0 ? meta.categoryOrder : 1000));
	}

	return categoryPath.map((_, index) => index === 0 ? finiteNumber(meta.categoryOrder, 1000) : 1000);
}

function categoryId(categoryPath) {
	return `block-category-${categoryPath.map(slugFromText).join('--')}`;
}

function slugFromText(value) {
	return String(value)
		.trim()
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'category';
}

function countExamples(blockPath) {
	const prefix = `./${blockPath}/examples/`;
	return blockExamplePaths.filter((path) => path.startsWith(prefix)).length;
}

function normalizeBlockPath(value) {
	const path = Array.isArray(value)
		? value.join('/')
		: String(value || '');

	return path
		.replace(/^\/?blocks\//, '')
		.replace(/\/preview\/.*$/, '')
		.replace(/^\/+|\/+$/g, '');
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

function sortCategoryNodes(a, b) {
	const orderDelta = a.order - b.order;
	if (orderDelta) return orderDelta;
	return a.name.localeCompare(b.name);
}
