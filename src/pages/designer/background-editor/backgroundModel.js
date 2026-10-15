import { colorWithAlpha, splitColorAlpha, splitCssList } from '../_shared/cssValue.js';

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
		return `linear-gradient(${fill.gradientAngle}deg, ${colorWithAlpha(fill.gradientFrom, fill.gradientFromAlpha)} ${fill.gradientFromStop}%, ${colorWithAlpha(fill.gradientTo, fill.gradientToAlpha)} ${fill.gradientToStop}%)`;
	}
	if (fill.kind === 'radial') {
		return `radial-gradient(circle at 50% 45%, ${colorWithAlpha(fill.gradientFrom, fill.gradientFromAlpha)} ${fill.gradientFromStop}%, ${colorWithAlpha(fill.gradientTo, fill.gradientToAlpha)} ${fill.gradientToStop}%)`;
	}
	return colorWithAlpha(fill.color, fill.alpha);
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

/**
 * Splits fills into inline CSS properties: a solid bottom fill becomes
 * `background-color`, everything above it `background-image`. Unset
 * properties are empty strings, so callers can remove them.
 *
 * @param {object} background Background record.
 * @returns {{ 'background-color': string, 'background-image': string }}
 */
export function backgroundToCssProperties(background) {
	const fills = background?.enabled ? enabledFills(background.fills || []) : [];
	const bottom = fills.at(-1);
	const solidBottom = bottom?.kind === 'solid';
	const image = backgroundImageToCss({ enabled: true, fills: solidBottom ? fills.slice(0, -1) : fills });
	return {
		'background-color': solidBottom ? fillToCss(bottom) : '',
		'background-image': image === 'none' ? '' : image,
	};
}

/**
 * Reads CSS written by `backgroundToCssProperties` or `backgroundImageToCss`
 * back into a background record. Returns `null` for backgrounds the editor
 * cannot represent, such as images or more than two gradient stops.
 *
 * @param {{ color?: string, image?: string }} css `background-color` and `background-image`.
 * @returns {object|null} Background record.
 */
export function backgroundFromCss({ color = '', image = '' } = {}) {
	const fills = [];
	for (const layer of image && image !== 'none' ? splitCssList(image) : []) {
		const fill = fillFromCss(layer);
		if (!fill) return null;
		fills.push(fill);
	}
	if (color && color !== 'transparent') {
		if (/[;{}]|\burl\s*\(|gradient\(/i.test(color)) return null;
		const { color: base, alpha } = splitColorAlpha(color);
		fills.push(createFill({ kind: 'solid', color: base, alpha }));
	}
	return createBackgroundState({ fills: fills.map((fill) => ({ ...fill })) }, { allowEmpty: true });
}

/** One gradient layer as a fill, or `null`. */
function fillFromCss(layer) {
	const match = layer.match(/^(linear|radial)-gradient\((.*)\)$/is);
	if (!match) return null;
	const args = splitCssList(match[2]);
	if (match[1] === 'linear' && args.length === 2 && args[0] === args[1] && !/\s\d/.test(args[0])) {
		const { color, alpha } = splitColorAlpha(args[0]);
		return createFill({ kind: 'solid', color, alpha });
	}
	let angle = 180;
	if (match[1] === 'linear' && /^-?[\d.]+deg$/i.test(args[0])) angle = Number.parseFloat(args.shift());
	else if (match[1] === 'linear' && /^to\s/i.test(args[0])) return null;
	if (match[1] === 'radial' && /^(circle|ellipse|closest|farthest|at\s)/i.test(args[0])) args.shift();
	if (args.length !== 2) return null;
	const [from, to] = args.map(stopFromCss);
	if (!from || !to) return null;
	return createFill({
		kind: match[1],
		gradientAngle: angle,
		gradientFrom: from.color,
		gradientFromAlpha: from.alpha,
		gradientFromStop: from.stop ?? 0,
		gradientTo: to.color,
		gradientToAlpha: to.alpha,
		gradientToStop: to.stop ?? 100,
	});
}

/** A gradient colour stop: colour, alpha and an optional percentage. */
function stopFromCss(stop) {
	const tokens = splitCssList(stop, ' ');
	const position = tokens.length > 1 && /^-?[\d.]+%$/.test(tokens.at(-1)) ? Number.parseFloat(tokens.pop()) : null;
	if (tokens.length !== 1) return null;
	return { ...splitColorAlpha(tokens[0]), stop: position };
}

/** Shared theme editor helper: addFillLayer. */
export function addFillLayer(background) {
	background.fills.forEach((fill) => {
		fill.open = false;
	});
	// Like Figma, a new fill is a light solid; switch its type in the fill popover.
	background.fills.unshift(createFill({ kind: 'solid', color: '#d4d4d4' }));
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
