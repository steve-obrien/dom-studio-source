import { sideNavLinks } from '../_layout/sideNavLinks.js';

const defaultViewBox = '0 0 24 24';
const sourceModules = import.meta.glob([
	'../**/*.{vue,js}',
	'!../icons/**/*',
	'!../blog/content/**/*',
], { eager: true, import: 'default', query: '?raw' });

export function getIconInventory() {
	const icons = new Map();

	collectNavigationIcons(icons);
	collectSourceIcons(icons);

	return Array.from(icons.values())
		.map((icon, index) => decorateIcon(icon, index))
		.sort(sortIcons);
}

export function svgForIcon(icon) {
	const path = escapeAttribute(icon.path);
	const viewBox = escapeAttribute(icon.viewBox || defaultViewBox);
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" aria-hidden="true"><path d="${path}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
}

function collectNavigationIcons(icons) {
	for (const group of sideNavLinks) {
		collectNavItems(icons, group.items, group.label);
	}
}

function collectNavItems(icons, items = [], groupLabel = 'Navigation') {
	for (const item of items) {
		addIcon(icons, {
			path: item.icon,
			viewBox: defaultViewBox,
		}, {
			type: 'Navigation',
			group: groupLabel,
			label: item.label,
			href: item.to,
		});

		if (item.children?.length) {
			collectNavItems(icons, item.children, groupLabel);
		}
	}
}

function collectSourceIcons(icons) {
	for (const [globPath, rawSource] of Object.entries(sourceModules)) {
		const source = String(rawSource || '');
		const sourcePath = sourcePathFromGlob(globPath);
		const group = groupFromSourcePath(sourcePath);

		collectInlineSvgPaths(icons, source, sourcePath, group);
		collectPathLiterals(icons, source, sourcePath, group);
	}
}

function collectInlineSvgPaths(icons, source, sourcePath, group) {
	const svgPattern = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/g;

	for (const svgMatch of source.matchAll(svgPattern)) {
		const attrs = svgMatch[1] || '';
		const body = svgMatch[2] || '';
		const viewBox = extractAttribute(attrs, 'viewBox') || defaultViewBox;
		if (!isSmallIconViewBox(viewBox)) continue;

		const pathPattern = /<path\b([^>]*)>/g;

		for (const pathMatch of body.matchAll(pathPattern)) {
			const path = extractAttribute(pathMatch[1] || '', 'd');
			addIcon(icons, {
				path,
				viewBox,
			}, {
				type: 'Source',
				group,
				label: labelFromSourcePath(sourcePath),
				href: `${sourcePath}:${lineForIndex(source, svgMatch.index + pathMatch.index)}`,
			});
		}
	}
}

function collectPathLiterals(icons, source, sourcePath, group) {
	const pathLiteralPattern = /(['"`])((?:[Mm]\s*-?\d|[Mm]-?\d)[^'"`]{4,900})\1/g;

	for (const match of source.matchAll(pathLiteralPattern)) {
		if (isAttributeValue(source, match.index)) continue;

		addIcon(icons, {
			path: match[2],
			viewBox: defaultViewBox,
		}, {
			type: 'Source',
			group,
			label: labelFromSourcePath(sourcePath),
			href: `${sourcePath}:${lineForIndex(source, match.index)}`,
		});
	}
}

function addIcon(icons, icon, usage) {
	const path = normalizePath(icon.path);
	if (!path) return;

	const viewBox = normalizeViewBox(icon.viewBox);
	const key = `${viewBox}|${path}`;

	if (!icons.has(key)) {
		icons.set(key, {
			key,
			path,
			viewBox,
			usages: [],
		});
	}

	const record = icons.get(key);
	const usageKey = `${usage.type}|${usage.group}|${usage.label}|${usage.href || ''}`;
	if (!record.usages.some((existing) => existing.key === usageKey)) {
		record.usages.push({ ...usage, key: usageKey });
	}
}

function decorateIcon(icon, index) {
	const navigationUsage = icon.usages.find((usage) => usage.type === 'Navigation');
	const primaryUsage = navigationUsage || icon.usages[0] || {};
	const sourceGroups = unique(icon.usages.map((usage) => usage.group));
	const labels = unique(icon.usages.map((usage) => usage.label));
	const sources = unique(icon.usages.map((usage) => usage.href).filter(Boolean));
	const decorated = {
		...icon,
		id: `icon-${index + 1}`,
		name: primaryUsage.label || `Icon ${index + 1}`,
		group: primaryUsage.group || 'Source',
		sourceGroups,
		labels,
		sources,
		usageCount: icon.usages.length,
	};

	return {
		...decorated,
		svg: svgForIcon(decorated),
		searchText: [
			decorated.name,
			decorated.group,
			...sourceGroups,
			...labels,
			...sources,
			decorated.path,
		].join(' ').toLowerCase(),
	};
}

function sortIcons(a, b) {
	const groupDelta = groupRank(a.group) - groupRank(b.group);
	if (groupDelta) return groupDelta;
	return a.name.localeCompare(b.name);
}

function groupRank(group) {
	const index = [
		'Tooling',
		'Components',
		'Forms',
		'Visual',
		'Mobile',
		'Blocks',
		'Headless',
	].indexOf(group);
	return index === -1 ? 1000 : index;
}

function normalizePath(value) {
	const path = String(value || '').replace(/\s+/g, ' ').trim();
	if (path.length < 5 || path.length > 900) return '';
	if (!/[MmLlHhVvCcSsQqTtAaZz]/.test(path) || !/\d/.test(path)) return '';
	if (!/^[MmLlHhVvCcSsQqTtAaZz0-9.\-+,\s]+$/.test(path)) return '';
	if (largestCoordinate(path) > 128) return '';
	return path;
}

function normalizeViewBox(value) {
	const viewBox = String(value || defaultViewBox).replace(/\s+/g, ' ').trim();
	if (/^-?\d+(?:\.\d+)? -?\d+(?:\.\d+)? \d+(?:\.\d+)? \d+(?:\.\d+)?$/.test(viewBox)) {
		return viewBox;
	}
	return defaultViewBox;
}

function isSmallIconViewBox(value) {
	const parts = normalizeViewBox(value).split(' ').map(Number);
	return parts[2] <= 32 && parts[3] <= 32;
}

function largestCoordinate(path) {
	const numbers = path.match(/-?\d+(?:\.\d+)?/g) || [];
	return numbers.reduce((largest, value) => Math.max(largest, Math.abs(Number(value))), 0);
}

function extractAttribute(attrs, name) {
	const pattern = new RegExp(`(?:^|\\s)${name}=(["'])(.*?)\\1`);
	return attrs.match(pattern)?.[2] || '';
}

function isAttributeValue(source, index) {
	const before = source.slice(Math.max(0, index - 8), index);
	return /\bd\s*=$/.test(before);
}

function sourcePathFromGlob(globPath) {
	return globPath.replace(/^\.\.\//, 'src/pages/');
}

function groupFromSourcePath(sourcePath) {
	const segment = sourcePath.split('/')[2] || '';
	return {
		_layout: 'Layout',
		components: 'Components',
		forms: 'Forms',
		mobile: 'Mobile',
		visual: 'Visual',
		blocks: 'Blocks',
		headless: 'Headless',
		experiments: 'Experiments',
	}[segment] || 'Pages';
}

function labelFromSourcePath(sourcePath) {
	const file = sourcePath.split('/').pop() || 'Icon';
	return file
		.replace(/\.(vue|js)$/, '')
		.replace(/^Dom/, '')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.replace(/[-_]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim() || 'Icon';
}

function lineForIndex(source, index) {
	return source.slice(0, index).split('\n').length;
}

function unique(values) {
	return Array.from(new Set(values.filter(Boolean)));
}

function escapeAttribute(value) {
	return String(value || '')
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
