const DEFAULT_BORDER_RATIO = 0.07;
const DEFAULT_LIGHTNESS = 50;
const DEFAULT_ALPHA = 0.93;
const DEFAULT_EDGE_BLUR = 11;

/**
 * Clamp a numeric value to a finite range.
 *
 * @param {number} value Value to clamp.
 * @param {number} min Minimum accepted value.
 * @param {number} max Maximum accepted value.
 * @returns {number} Clamped finite value.
 */
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

/**
 * Normalize an observed CSS dimension for safe SVG interpolation.
 *
 * @param {number} value Observed element dimension in CSS pixels.
 * @returns {number} Positive whole-pixel dimension.
 */
function normalizeDimension(value) {
	return Math.max(1, Math.round(Number(value) || 0));
}

/**
 * Determine whether the current engine can render SVG displacement filters as
 * backdrop filters. WebKit accepts the syntax but currently does not render
 * the SVG filter, so it must remain on the CSS-only fallback.
 *
 * @returns {boolean} True when enhanced backdrop refraction should be enabled.
 */
export function supportsLiquidGlassRefraction() {
	if (typeof window === 'undefined' || typeof CSS === 'undefined') return false;
	if (window.matchMedia?.('(prefers-reduced-transparency: reduce)').matches) return false;

	const filter = 'url("#dom-liquid-glass-probe") blur(1px)';
	const supportsSyntax = CSS.supports('backdrop-filter', filter)
		|| CSS.supports('-webkit-backdrop-filter', filter);
	if (!supportsSyntax) return false;

	const userAgent = window.navigator?.userAgent || '';
	const usesWebKit = /AppleWebKit/i.test(userAgent)
		&& !/(Chrome|Chromium|Edg|OPR|SamsungBrowser)/i.test(userAgent);

	return !usesWebKit;
}

/**
 * Build a pill or rounded-rectangle displacement map for one glass surface.
 * Red encodes horizontal displacement, blue encodes vertical displacement,
 * and the blurred neutral interior keeps the centre comparatively stable.
 *
 * @param {object} options Map generation options.
 * @param {number} options.width Surface width in CSS pixels.
 * @param {number} options.height Surface height in CSS pixels.
 * @param {number} [options.radius] Uniform surface radius in CSS pixels.
 * @param {number} [options.borderRatio] Proportion of the shortest edge used for the refractive rim.
 * @param {number} [options.lightness] Neutral interior lightness percentage.
 * @param {number} [options.alpha] Neutral interior opacity.
 * @param {number} [options.edgeBlur] Blur applied to the neutral interior edge.
 * @returns {string} Encoded SVG data URI suitable for an SVG feImage href.
 */
export function buildLiquidGlassMap({
	width,
	height,
	radius,
	borderRatio = DEFAULT_BORDER_RATIO,
	lightness = DEFAULT_LIGHTNESS,
	alpha = DEFAULT_ALPHA,
	edgeBlur = DEFAULT_EDGE_BLUR,
}) {
	const resolvedWidth = normalizeDimension(width);
	const resolvedHeight = normalizeDimension(height);
	const shortestEdge = Math.min(resolvedWidth, resolvedHeight);
	const requestedRadius = Number(radius);
	const resolvedRadius = clamp(
		Number.isFinite(requestedRadius) ? requestedRadius : shortestEdge / 2,
		0,
		shortestEdge / 2,
	);
	const resolvedBorderRatio = clamp(Number(borderRatio), 0, 0.5);
	const resolvedLightness = clamp(Number(lightness), 0, 100);
	const resolvedAlpha = clamp(Number(alpha), 0, 1);
	const resolvedEdgeBlur = clamp(Number(edgeBlur), 0, shortestEdge / 2);
	const inset = shortestEdge * resolvedBorderRatio;
	const innerWidth = Math.max(1, resolvedWidth - (inset * 2));
	const innerHeight = Math.max(1, resolvedHeight - (inset * 2));
	const innerRadius = Math.max(0, resolvedRadius - inset);
	const svg = [
		`<svg viewBox="0 0 ${resolvedWidth} ${resolvedHeight}" xmlns="http://www.w3.org/2000/svg">`,
		'<defs>',
		'<linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">',
		'<stop offset="0%" stop-color="#000"/>',
		'<stop offset="100%" stop-color="red"/>',
		'</linearGradient>',
		'<linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">',
		'<stop offset="0%" stop-color="#000"/>',
		'<stop offset="100%" stop-color="blue"/>',
		'</linearGradient>',
		'</defs>',
		`<rect width="${resolvedWidth}" height="${resolvedHeight}" fill="black"/>`,
		`<rect width="${resolvedWidth}" height="${resolvedHeight}" rx="${resolvedRadius}" fill="url(#red)"/>`,
		`<rect width="${resolvedWidth}" height="${resolvedHeight}" rx="${resolvedRadius}" fill="url(#blue)" style="mix-blend-mode:difference"/>`,
		`<rect x="${inset}" y="${inset}" width="${innerWidth}" height="${innerHeight}" rx="${innerRadius}" fill="hsl(0 0% ${resolvedLightness}% / ${resolvedAlpha})" style="filter:blur(${resolvedEdgeBlur}px)"/>`,
		'</svg>',
	].join('');

	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
