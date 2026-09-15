import {
	componentAnchor,
	componentNavigationSections,
	getComponentNavigationSection,
	getComponentRecords,
	labelFromSection,
	labelFromSlug,
	primaryExportNameForSlug,
} from './componentManager.js';
import { inspectComponentRecord } from './componentInspector.js';
import { staticIconPaths } from './sideNavLinks.js';
import { getBlockRecords } from '../blocks/blockRegistry.js';

const pagePaths = Object.keys(import.meta.glob([
	'../**/Index.vue',
	'!../auth/**/Index.vue',
	'!../blocks/*/Index.vue',
	'!../blocks/*/**/Index.vue',
	'!../experiments/**/Index.vue',
	'!../paywall/**/Index.vue',
]));

const componentSectionOrder = componentNavigationSections;

const pageDescriptions = {
	'/': 'Page / DOM Studio product overview and library entry point.',
	'/ai': 'Page / AI components for agent chat, conversations, voice, audio, camera input, and review workflows.',
	'/ai/ui': 'Guide / Designing AI UI: streaming, tool calls, approvals, sources, voice, accessibility, and error recovery.',
	'/ai/builders': 'Guide / Build interfaces with AI using DOM Studio components, examples, metadata, and editable Studio specs.',
	'/blocks': 'Page / Block library overview for product screens and app patterns.',
	'/blog': 'Page / DOM Studio articles and product notes.',
	'/component-spec': 'Page / Component metadata, __doc, Vue props, and _edit controls for generated documentation and playgrounds.',
	'/charts': 'Page / Data visualisation, charts, metrics, and reporting dates.',
	'/charts/finance': 'Page / Finance, banking, investment portfolios, cashflow, money in and out, cash projections, dynamic data, and simulated bank transactions.',
	'/data': 'Page / API-backed data components for resource browsing, selection, upload, and management workflows.',
	'/dev': 'Page / Developer-facing components for code, payloads, diagnostics, and implementation docs.',
	'/forms': 'Page / Form primitives, schemas, fields, validation, and inputs.',
	'/forms/schema': 'Page / Form schema helpers and generated form definitions.',
	'/headless': 'Page / Framework-neutral custom element primitives.',
	'/icons': 'Page / Copyable SVG icon inventory generated from DOM Studio metadata and source usage.',
	'/mobile': 'Page / Mobile app shell, navigation, safe areas, and action sheets.',
	'/pricing': 'Page / DOM Studio source access and pricing.',
	'/theming': 'Page / Theme tokens, skins, dark mode, and style guidance.',
	'/tools/json-unstringifier': 'Tool / Convert stringified, escaped, or minified JSON into pretty copy-ready JSON.',
};

export function getGlobalSearchCommands() {
	return dedupeCommands([
		...componentCommands(),
		...blockCommands(),
		...pageCommands(),
	]);
}

function componentCommands() {
	return getComponentRecords()
		.map(inspectComponentRecord)
		.filter((record) => !record.hidden && !record.navHidden)
		.sort(sortComponentRecords)
		.map((record) => {
			const isPrimary = record.doc.nav?.primary || record.exportName === primaryExportNameForSlug(record.slug);
			const target = isPrimary ? record.route : `${record.route}#${componentAnchor(record)}`;
			const section = labelFromSection(getComponentNavigationSection(record));
			const summary = record.doc.description || `${record.label} documentation and examples.`;

			return {
				label: record.label,
				value: target,
				to: target,
				icon: record.icon || staticIconPaths[record.label],
				description: compactParts([
					`${section} component`,
					record.exportName,
					summary,
				]),
				search: compactParts([
					record.route,
					record.slug,
				]),
				priority: 10,
			};
		});
}

function blockCommands() {
	return getBlockRecords()
		.map((record) => ({
			label: record.label,
			value: record.route,
			to: record.route,
			icon: record.icon,
			description: compactParts([
				'Block',
				record.categoryLabel,
				record.summary,
			]),
			search: compactParts([
				record.route,
				record.sourcePath,
				record.blockPath,
				record.slug,
			]),
			priority: 20,
		}));
}

function pageCommands() {
	const routes = pagePaths
		.map(routeFromPagePath)
		.filter(Boolean)
		.concat('/');

	return routes
		.map((route) => ({
			label: pageLabel(route),
			value: route,
			to: route,
			icon: iconForPageRoute(route),
			description: pageDescriptions[route] || compactParts([
				'Page',
				sectionLabel(route),
			]),
			search: compactParts([
				route,
				route.split('/').filter(Boolean).map(labelFromSlug).join(' '),
			]),
			priority: 30,
		}))
		.sort((a, b) => a.label.localeCompare(b.label));
}

function dedupeCommands(commands) {
	const seen = new Set();
	return commands
		.sort((a, b) => {
			const priorityDelta = a.priority - b.priority;
			if (priorityDelta) return priorityDelta;
			return a.label.localeCompare(b.label);
		})
		.filter((command) => {
			const key = String(command.to || command.value || '').replace(/\/+$/, '') || command.label;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		})
		.map(({ priority, ...command }) => command);
}

function routeFromPagePath(pagePath) {
	if (pagePath === '../Index.vue') return '/';
	const match = pagePath.match(/^\.\.\/(.+)\/Index\.vue$/);
	if (!match) return null;

	const route = `/${match[1]}`;
	if (route.includes('/preview/')) return null;
	return route;
}

/**
 * Resolves a readable search label while preserving established page URLs.
 *
 * @param {string} route Public page route.
 * @returns {string} Label displayed in global search.
 */
function pageLabel(route) {
	if (route === '/') return 'Overview';
	if (route === '/ai') return 'AI Overview';
	if (route === '/ai/ui') return 'AI UI guide';
	if (route === '/ai/builders') return 'AI builders';
	if (route === '/component-spec') return 'Component metadata';
	const label = labelFromSlug(route.split('/').filter(Boolean).pop());
	if (['/blocks', '/charts', '/data', '/dev', '/forms', '/headless', '/mobile'].includes(route)) return `${label} Overview`;
	return label;
}

function iconForPageRoute(route) {
	const label = pageLabel(route);
	const section = sectionLabel(route);
	return staticIconPaths[label]
		|| staticIconPaths[section]
		|| staticIconPaths[label.replace(/ Overview$/, '')];
}

function sectionLabel(route) {
	const section = route.split('/').filter(Boolean)[0];
	if (!section) return 'Overview';
	return labelFromSlug(section);
}

function compactParts(parts) {
	return parts
		.flatMap((part) => Array.isArray(part) ? part : [part])
		.map((part) => String(part || '').trim())
		.filter(Boolean)
		.join(' / ');
}

/**
 * Orders search results by their displayed section, component order, and label.
 *
 * @param {object} a First inspected component record.
 * @param {object} b Second inspected component record.
 * @returns {number} Sort comparison result.
 */
function sortComponentRecords(a, b) {
	const sectionDelta = componentSectionOrder.indexOf(getComponentNavigationSection(a)) - componentSectionOrder.indexOf(getComponentNavigationSection(b));
	if (sectionDelta) return sectionDelta;
	const orderDelta = a.order - b.order;
	if (orderDelta) return orderDelta;
	return a.label.localeCompare(b.label);
}
