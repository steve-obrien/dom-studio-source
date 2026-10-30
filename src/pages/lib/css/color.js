export function cssColorToHex(value, fallback = '#000000') {
	const color = String(value || '').trim();
	if (!color) return fallback;
	return parseKnownColorToHex(color) || resolveBrowserColorToHex(color) || fallback;
}

export function cssColorWithAlpha(value, alpha = 100) {
	const color = String(value || '#000000').trim();
	const opacity = clamp(Number(alpha), 0, 100);

	if (isHexColor(color)) return hexToRgba(color, opacity);

	const rgb = parseRgbColor(color);
	if (rgb) {
		const [red, green, blue] = rgb.channels;
		return `rgba(${red}, ${green}, ${blue}, ${Number(opacity / 100).toFixed(2)})`;
	}

	if (/^oklch\(/i.test(color)) {
		return setFunctionalColorAlpha(color, opacity);
	}

	if (opacity >= 100) return color;
	return `color-mix(in oklch, ${color} ${opacity}%, transparent)`;
}

export function colorToHexAlpha(value) {
	const color = String(value || '').trim();
	if (color === 'transparent') return { hex: '#000000', alpha: 0, color: '#000000' };

	if (isHexColor(color)) {
		const clean = color.replace('#', '');
		const hasShortAlpha = clean.length === 4;
		const hasAlpha = clean.length === 8 || hasShortAlpha;
		const alphaValue = hasShortAlpha
			? Number.parseInt(clean.at(-1) + clean.at(-1), 16)
			: clean.length === 8
				? Number.parseInt(clean.slice(6, 8), 16)
				: 255;
		const hex = expandHex(color);
		const alpha = hasAlpha ? Math.round((alphaValue / 255) * 100) : 100;
		return { hex, alpha, color: hex };
	}

	if (/^oklch\(/i.test(color)) {
		const hex = oklchToHex(color);
		return { hex, alpha: parseFunctionalAlpha(color), color: stripFunctionalAlpha(color) };
	}

	const rgb = parseRgbColor(color);
	if (rgb) {
		const hex = rgbToHex(rgb.channels.map((channel) => channel / 255));
		return { hex, alpha: rgb.alpha, color: hex };
	}

	return { hex: cssColorToHex(color), alpha: 100, color };
}

export function isHexColor(value) {
	return /^#[0-9a-f]{3,8}$/i.test(String(value || '').trim());
}

export function expandHex(hex) {
	const clean = String(hex || '').replace('#', '').trim();
	if (clean.length === 3 || clean.length === 4) {
		return `#${clean.slice(0, 3).split('').map((part) => part + part).join('').toLowerCase()}`;
	}
	return `#${clean.slice(0, 6).padEnd(6, '0').toLowerCase()}`;
}

export function hexToRgba(hex, alpha = 100) {
	const [red, green, blue] = hexToRgb(hex).map((channel) => Math.round(channel * 255));
	return `rgba(${red}, ${green}, ${blue}, ${Number(clamp(Number(alpha), 0, 100) / 100).toFixed(2)})`;
}

export function hexToOklch(hex) {
	const [red, green, blue] = hexToRgb(hex).map(srgbToLinear);
	const l = 0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue;
	const m = 0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue;
	const s = 0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue;
	const lRoot = Math.cbrt(l);
	const mRoot = Math.cbrt(m);
	const sRoot = Math.cbrt(s);
	const lightness = 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
	const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
	const b = 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
	const chroma = Math.sqrt((a * a) + (b * b));
	const hue = chroma < 0.0005 ? 0 : (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;

	return `oklch(${formatNumber(lightness)} ${formatNumber(chroma)} ${formatNumber(hue)})`;
}

export function oklchToHex(value) {
	const match = String(value || '').match(/oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)/i);
	if (!match) return '#000000';

	const lightness = clamp(match[1].endsWith('%') ? Number.parseFloat(match[1]) / 100 : Number.parseFloat(match[1]), 0, 1);
	const chroma = Number.parseFloat(match[2]);
	const hue = Number.parseFloat(match[3]) * Math.PI / 180;
	const a = Math.cos(hue) * chroma;
	const b = Math.sin(hue) * chroma;
	const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * b;
	const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * b;
	const sRoot = lightness - 0.0894841775 * a - 1.291485548 * b;
	const l = lRoot ** 3;
	const m = mRoot ** 3;
	const s = sRoot ** 3;
	const red = linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
	const green = linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
	const blue = linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);

	return rgbToHex([red, green, blue]);
}

export function hexToRgb(hex) {
	const clean = expandHex(hex).replace('#', '');
	const value = Number.parseInt(clean, 16);

	return [
		((value >> 16) & 255) / 255,
		((value >> 8) & 255) / 255,
		(value & 255) / 255,
	];
}

export function rgbToHex(values) {
	return `#${values
		.map((value) => Math.round(clamp(value, 0, 1) * 255).toString(16).padStart(2, '0'))
		.join('')}`;
}

export function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function parseRgbColor(value) {
	const match = String(value || '').trim().match(/^rgba?\((.+)\)$/i);
	if (!match) return null;

	const body = match[1].trim();
	const [channelPart, alphaPart] = body.includes('/')
		? body.split('/').map((part) => part.trim())
		: [body, null];
	const channelValues = channelPart.includes(',')
		? channelPart.split(',').slice(0, 3)
		: channelPart.split(/\s+/).slice(0, 3);
	const alphaValue = alphaPart ?? (body.includes(',') ? body.split(',')[3] : null);
	const channels = channelValues.map((part) => clamp(Number.parseFloat(part), 0, 255));

	if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) return null;

	return {
		channels: channels.map(Math.round),
		alpha: parseAlpha(alphaValue),
	};
}

function parseKnownColorToHex(color) {
	if (isHexColor(color)) return expandHex(color);
	if (/^oklch\(/i.test(color)) return oklchToHex(color);

	const rgb = parseRgbColor(color);
	if (rgb) return rgbToHex(rgb.channels.map((channel) => channel / 255));

	const srgb = parseSrgbColorFunction(color);
	if (srgb) return rgbToHex(srgb);

	return null;
}

function parseSrgbColorFunction(value) {
	const match = String(value || '').trim().match(/^color\(\s*srgb\s+(.+)\)$/i);
	if (!match) return null;

	const channelPart = match[1].split('/')[0].trim();
	const channels = channelPart.split(/\s+/).slice(0, 3).map((part) => {
		const raw = part.trim();
		if (raw.endsWith('%')) return clamp(Number.parseFloat(raw) / 100, 0, 1);
		return clamp(Number.parseFloat(raw), 0, 1);
	});

	if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) return null;
	return channels;
}

function resolveBrowserColorToHex(value) {
	if (typeof document === 'undefined') return null;
	if (typeof CSS !== 'undefined' && CSS.supports && !CSS.supports('color', value)) return null;

	const swatch = document.createElement('span');
	swatch.style.color = value;
	swatch.style.position = 'fixed';
	swatch.style.pointerEvents = 'none';
	swatch.style.visibility = 'hidden';

	if (!swatch.style.color) return null;

	document.documentElement.append(swatch);
	const computed = getComputedStyle(swatch).color;
	swatch.remove();

	return parseKnownColorToHex(computed);
}

function parseFunctionalAlpha(value) {
	const match = String(value || '').match(/\/\s*([0-9.]+%?)/);
	return parseAlpha(match?.[1]);
}

function parseAlpha(value) {
	if (value === undefined || value === null || value === '') return 100;

	const raw = String(value).trim();
	if (raw.endsWith('%')) return clamp(Number.parseFloat(raw), 0, 100);

	const number = Number.parseFloat(raw);
	if (!Number.isFinite(number)) return 100;
	return number <= 1 ? Math.round(number * 100) : clamp(number, 0, 100);
}

function stripFunctionalAlpha(value) {
	const match = String(value || '').trim().match(/^([a-z]+)\((.*)\)$/i);
	if (!match) return value;

	return `${match[1]}(${match[2].split('/')[0].trim()})`;
}

function setFunctionalColorAlpha(value, alpha) {
	const match = String(value || '').trim().match(/^([a-z]+)\((.*)\)$/i);
	if (!match) return value;

	return `${match[1]}(${match[2].split('/')[0].trim()} / ${alpha}%)`;
}

function srgbToLinear(value) {
	return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value) {
	return value <= 0.0031308 ? 12.92 * value : 1.055 * (value ** (1 / 2.4)) - 0.055;
}

function formatNumber(value) {
	return Number(value.toFixed(3)).toString();
}
