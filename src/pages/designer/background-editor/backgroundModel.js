import { cssColorWithAlpha } from '../../lib/css/color.js';

export const fillTypeOptions = [
	{ label: 'Solid', value: 'solid' },
	{ label: 'Linear gradient', value: 'linear' },
	{ label: 'Radial gradient', value: 'radial' },
];

/** Shared theme editor helper: createFillLayers. */
export function createFillLayers(background = {}, options = {}) {
	if (Array.isArray(background.fills) && background.fills.length) {
		return background.fills.map((fill, index) => createFill({ ...fill, open: index === 0 }));
	}
	if (options.allowEmpty) return [];
	return [createFill()];
}

/** Creates a background record with independently owned fill layers. */
export function createBackgroundState(overrides = {}, options = {}) {
	return {
		enabled: overrides.enabled ?? true,
		open: overrides.open ?? true,
		blendMode: overrides.blendMode ?? 'normal',
		fills: createFillLayers(overrides, options),
	};
}

/** Creates a new fill identity; assign a deterministic ID after construction for SSR. */
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

/** Shared theme editor helper: enabledFills. */
export function enabledFills(fillList) {
	return fillList.filter((fill) => fill.enabled);
}

/** Shared theme editor helper: fillToCss. */
export function fillToCss(fill) {
	if (fill.kind === 'linear') {
		return `linear-gradient(${fill.gradientAngle}deg, ${cssColorWithAlpha(fill.gradientFrom, fill.gradientFromAlpha)} ${fill.gradientFromStop}%, ${cssColorWithAlpha(fill.gradientTo, fill.gradientToAlpha)} ${fill.gradientToStop}%)`;
	}
	if (fill.kind === 'radial') {
		return `radial-gradient(circle at 50% 45%, ${cssColorWithAlpha(fill.gradientFrom, fill.gradientFromAlpha)} ${fill.gradientFromStop}%, ${cssColorWithAlpha(fill.gradientTo, fill.gradientToAlpha)} ${fill.gradientToStop}%)`;
	}
	return cssColorWithAlpha(fill.color, fill.alpha);
}

/** Shared theme editor helper: fillListToCss. */
export function fillListToCss(fillList) {
	const visibleFills = enabledFills(fillList);
	if (!visibleFills.length) return 'transparent';
	return visibleFills.map((fill) => fillToCss(fill)).join(', ');
}

/** Serializes enabled fills as valid CSS background images, first layer on top. */
export function backgroundImageToCss(background) {
	if (!background?.enabled) return 'none';
	const layers = enabledFills(background.fills || []).map((fill) => {
		const css = fillToCss(fill);
		return fill.kind === 'linear' || fill.kind === 'radial' ? css : `linear-gradient(${css}, ${css})`;
	});
	return layers.join(', ') || 'none';
}

/** Shared theme editor helper: addFillLayer. */
export function addFillLayer(background) {
	background.fills.forEach((fill) => {
		fill.open = false;
	});
	background.fills.unshift(createFill({ kind: 'linear' }));
}

/** Shared theme editor helper: duplicateFillLayer. */
export function duplicateFillLayer(background, index) {
	background.fills.splice(index + 1, 0, createFill({ ...background.fills[index], open: true }));
}

/** Shared theme editor helper: removeFillLayer. */
export function removeFillLayer(background, index) {
	background.fills.splice(index, 1);
}

/** Creates a new fill identity. */
function createId() {
	return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}
