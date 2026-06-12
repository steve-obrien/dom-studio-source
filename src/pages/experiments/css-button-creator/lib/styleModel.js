import { cssColorWithAlpha } from '../../../lib/css/color.js';

export const fillTypeOptions = [
	{ label: 'Solid', value: 'solid' },
	{ label: 'Linear gradient', value: 'linear' },
	{ label: 'Radial gradient', value: 'radial' },
];

export const shadowKindOptions = [
	{ label: 'Drop shadow', value: 'drop' },
	{ label: 'Inner shadow', value: 'inset' },
	{ label: 'Ring', value: 'ring' },
];

export const borderStyleOptions = [
	{ label: 'Solid', value: 'solid' },
	{ label: 'Dashed', value: 'dashed' },
	{ label: 'Dotted', value: 'dotted' },
	{ label: 'Double', value: 'double' },
	{ label: 'None', value: 'none' },
];

export function createButtonState(overrides = {}) {
	return {
		label: 'Save changes',
		typography: {
			enabled: true,
			open: true,
			textColor: '#ffffff',
			fontSize: 15,
			fontWeight: 650,
			...overrides.typography,
		},
		layout: {
			enabled: true,
			open: true,
			paddingX: 22,
			paddingY: 12,
			radius: 999,
			...overrides.layout,
		},
		background: {
			enabled: true,
			open: true,
			blendMode: 'normal',
			fills: createFillLayers(overrides.background),
		},
		border: {
			enabled: true,
			open: true,
			width: 1,
			style: 'solid',
			color: '#171717',
			...overrides.border,
		},
	};
}

export function createFillLayers(background = {}, options = {}) {
	if (Array.isArray(background.fills) && background.fills.length) {
		return background.fills.map((fill, index) => createFill({ ...fill, open: index === 0 }));
	}
	if (options.allowEmpty) return [];
	return [createFill()];
}

export function createBackgroundState(overrides = {}, options = {}) {
	return {
		enabled: overrides.enabled ?? true,
		open: overrides.open ?? true,
		blendMode: overrides.blendMode ?? 'normal',
		fills: createFillLayers(overrides, options),
	};
}

export function createSurface(overrides = {}) {
	return {
		bg: 'transparent',
		fg: 'currentColor',
		...overrides,
	};
}

export function createBorder(overrides = {}) {
	return {
		enabled: true,
		open: true,
		width: 1,
		style: 'solid',
		color: '#171717',
		...overrides,
		width: Number.parseFloat(overrides.width ?? 1),
	};
}

export function createBackdrop(overrides = {}) {
	return {
		enabled: false,
		open: true,
		blur: 0,
		saturate: 1,
		...overrides,
		blur: Number.parseFloat(overrides.blur ?? 0),
		saturate: Number.parseFloat(overrides.saturate ?? 1),
	};
}

export function createCssComponentStyle(overrides = {}) {
	const shadows = Array.isArray(overrides.shadows) ? overrides.shadows : [];
	return {
		surface: createSurface(overrides.surface),
		border: createBorder(overrides.border),
		backdrop: createBackdrop(overrides.backdrop),
		background: createBackgroundState(overrides.background, { allowEmpty: true }),
		shadows: shadows.map((shadow, index) => createShadow({ ...shadow, open: index === 0 })),
	};
}

export function replaceCssComponentStyle(target, source) {
	Object.assign(target.surface, source.surface);
	Object.assign(target.border, source.border);
	Object.assign(target.backdrop, source.backdrop);
	target.background.enabled = source.background.enabled;
	target.background.open = source.background.open;
	target.background.blendMode = source.background.blendMode;
	target.background.fills.splice(0, target.background.fills.length, ...source.background.fills.map((fill, index) => createFill({ ...fill, open: index === 0 })));
	target.shadows.splice(0, target.shadows.length, ...source.shadows.map((shadow, index) => createShadow({ ...shadow, open: index === 0 })));
}

export function createFill(overrides = {}) {
	return {
		enabled: true,
		open: true,
		kind: 'solid',
		color: '#171717',
		alpha: 100,
		gradientFrom: '#171717',
		gradientFromAlpha: 100,
		gradientTo: '#4f46e5',
		gradientToAlpha: 100,
		gradientAngle: 135,
		gradientFromStop: 0,
		gradientToStop: 100,
		...overrides,
		id: createId(),
	};
}

export function createShadow(overrides = {}) {
	return {
		enabled: true,
		open: true,
		kind: 'drop',
		color: '#000000',
		alpha: 20,
		x: 0,
		y: 8,
		blur: 18,
		spread: -6,
		...overrides,
		id: createId(),
	};
}

export function enabledFills(fillList) {
	return fillList.filter((fill) => fill.enabled);
}

export function fillToCss(fill) {
	if (fill.kind === 'linear') {
		return `linear-gradient(${fill.gradientAngle}deg, ${cssColorWithAlpha(fill.gradientFrom, fill.gradientFromAlpha)} ${fill.gradientFromStop}%, ${cssColorWithAlpha(fill.gradientTo, fill.gradientToAlpha)} ${fill.gradientToStop}%)`;
	}
	if (fill.kind === 'radial') {
		return `radial-gradient(circle at 50% 45%, ${cssColorWithAlpha(fill.gradientFrom, fill.gradientFromAlpha)} ${fill.gradientFromStop}%, ${cssColorWithAlpha(fill.gradientTo, fill.gradientToAlpha)} ${fill.gradientToStop}%)`;
	}
	return cssColorWithAlpha(fill.color, fill.alpha);
}

export function fillListToCss(fillList) {
	const visibleFills = enabledFills(fillList);
	if (!visibleFills.length) return 'transparent';
	return visibleFills.map((fill) => fillToCss(fill)).join(', ');
}

export function backgroundImageToCss(background) {
	if (!background?.enabled) return 'none';
	const css = fillListToCss(background.fills || []);
	return css === 'transparent' ? 'none' : css;
}

export function enabledShadows(shadowList) {
	return shadowList.filter((shadow) => shadow.enabled);
}

export function shadowToCss(shadow) {
	const color = cssColorWithAlpha(shadow.color, shadow.alpha);
	if (shadow.kind === 'ring') return `0 0 0 ${shadow.spread}px ${color}`;
	return `${shadow.kind === 'inset' ? 'inset ' : ''}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${color}`;
}

export function shadowListToCss(shadowList) {
	const visibleShadows = enabledShadows(shadowList);
	if (!visibleShadows.length) return 'none';
	return visibleShadows.map((shadow) => shadowToCss(shadow)).join(', ');
}

export function backdropToCss(backdrop) {
	if (!backdrop?.enabled) return 'none';
	const parts = [];
	const blur = Number.parseFloat(backdrop.blur);
	const saturate = Number.parseFloat(backdrop.saturate);
	if (blur > 0) parts.push(`blur(${formatCssNumber(blur)}px)`);
	if (Number.isFinite(saturate) && saturate !== 1) parts.push(`saturate(${formatCssNumber(saturate)})`);
	return parts.length ? parts.join(' ') : 'none';
}

export function parseBackdropValue(value) {
	const raw = String(value || '').trim();
	if (!raw || raw === 'none') return createBackdrop();
	return createBackdrop({
		enabled: true,
		blur: Number.parseFloat(raw.match(/blur\(\s*(-?\d+(?:\.\d+)?)px\s*\)/i)?.[1] ?? 0),
		saturate: Number.parseFloat(raw.match(/saturate\(\s*(-?\d+(?:\.\d+)?)\s*\)/i)?.[1] ?? 1),
	});
}

export function cssStyleValues(style) {
	const borderEnabled = style.border?.enabled && style.border.style !== 'none';
	return {
		bg: style.surface?.bg ?? 'transparent',
		fg: style.surface?.fg ?? 'currentColor',
		border: borderEnabled ? style.border.color : 'transparent',
		borderWidth: borderEnabled ? `${formatCssNumber(style.border.width)}px` : '0px',
		borderStyle: borderEnabled ? style.border.style : 'none',
		shadow: shadowListToCss(style.shadows || []),
		backdrop: backdropToCss(style.backdrop),
		bgImage: backgroundImageToCss(style.background),
	};
}

export function cssStyleToProperties(style) {
	const values = cssStyleValues(style);
	return {
		backgroundColor: values.bg,
		backgroundImage: values.bgImage,
		color: values.fg,
		borderColor: values.border,
		borderWidth: values.borderWidth,
		borderStyle: values.borderStyle,
		boxShadow: values.shadow,
		backdropFilter: values.backdrop,
		WebkitBackdropFilter: values.backdrop,
	};
}

export function cssStylePropertyValues(style) {
	const values = cssStyleValues(style);
	const background = values.bgImage === 'none'
		? values.bg
		: `${values.bgImage}, ${values.bg}`;
	const border = `${values.borderWidth} ${values.borderStyle} ${values.border}`;

	return {
		background,
		backgroundColor: values.bg,
		backgroundImage: values.bgImage,
		color: values.fg,
		border,
		borderColor: values.border,
		borderWidth: values.borderWidth,
		borderStyle: values.borderStyle,
		boxShadow: values.shadow,
		backdropFilter: values.backdrop,
		WebkitBackdropFilter: values.backdrop,
	};
}

export function cssStyleToMappedStyles(style, varmap = {}) {
	const properties = cssStylePropertyValues(style);
	const styles = {};
	const vars = {};
	const suppressedProperties = mappedShorthandSubProperties(varmap);

	Object.entries(properties).forEach(([property, value]) => {
		if (suppressedProperties.has(property) && !varmap[property]) return;

		const variableName = normalizeCssVariableName(varmap[property]);
		if (!variableName) {
			styles[property] = value;
			return;
		}

		vars[variableName] = value;
		styles[variableName] = value;
		styles[property] = `var(${variableName})`;
	});

	return { styles, vars };
}

function mappedShorthandSubProperties(varmap = {}) {
	const suppressed = new Set();
	if (normalizeCssVariableName(varmap.background)) {
		suppressed.add('backgroundColor');
		suppressed.add('backgroundImage');
	}
	if (normalizeCssVariableName(varmap.border)) {
		suppressed.add('borderColor');
		suppressed.add('borderWidth');
		suppressed.add('borderStyle');
	}
	return suppressed;
}

export function cssStyleToVariables(style, variables = {}) {
	const values = cssStyleValues(style);
	return Object.fromEntries(Object.entries(values)
		.filter(([key]) => variables[key])
		.map(([key, value]) => [variables[key], value]));
}

export function addFillLayer(background) {
	background.fills.forEach((fill) => {
		fill.open = false;
	});
	background.fills.unshift(createFill({ kind: 'linear' }));
}

export function duplicateFillLayer(background, index) {
	background.fills.splice(index + 1, 0, createFill({ ...background.fills[index], open: true }));
}

export function removeFillLayer(background, index) {
	background.fills.splice(index, 1);
}

export function addShadowLayer(shadowList) {
	shadowList.forEach((shadow) => {
		shadow.open = false;
	});
	shadowList.push(createShadow());
}

export function duplicateShadowLayer(shadowList, index) {
	shadowList.splice(index + 1, 0, createShadow({ ...shadowList[index], open: true }));
}

export function removeShadowLayer(shadowList, index) {
	shadowList.splice(index, 1);
}

export function shadowTitle(shadow) {
	if (shadow.kind === 'ring') return 'Ring';
	if (shadow.kind === 'inset') return 'Inner shadow';
	return 'Drop shadow';
}

function createId() {
	return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function formatCssNumber(value) {
	return Number(Number.parseFloat(value || 0).toFixed(3)).toString();
}

function normalizeCssVariableName(value) {
	const name = String(value || '').trim();
	return /^--[a-zA-Z0-9-_]+$/.test(name) ? name : '';
}
