import { createBackdrop, backdropToCss, parseBackdropValue } from '../../../designer/backdrop-editor/backdropModel.js';
export { createBackdrop, backdropToCss, parseBackdropValue } from '../../../designer/backdrop-editor/backdropModel.js';
import { fillTypeOptions, createFillLayers, createBackgroundState, createFill, enabledFills, fillToCss, fillListToCss, backgroundImageToCss, addFillLayer, duplicateFillLayer, removeFillLayer } from '../../../designer/background-editor/backgroundModel.js';
export { fillTypeOptions, createFillLayers, createBackgroundState, createFill, enabledFills, fillToCss, fillListToCss, backgroundImageToCss, addFillLayer, duplicateFillLayer, removeFillLayer } from '../../../designer/background-editor/backgroundModel.js';
import { createShadow, enabledShadows, shadowToCss, shadowListToCss, addShadowLayer, duplicateShadowLayer, removeShadowLayer, shadowTitle, shadowKindOptions } from '../../../designer/shadow-editor/shadowModel.js';
export { createShadow, enabledShadows, shadowToCss, shadowListToCss, addShadowLayer, duplicateShadowLayer, removeShadowLayer, shadowTitle, shadowKindOptions } from '../../../designer/shadow-editor/shadowModel.js';

export { borderStyleOptions } from '../../../designer/border-editor/borderModel.js';
import { typographyToCssProperties, typographyToStyle } from '../../../designer/typography-editor/typographyModel.js';

/**
 * The button's text style for DomTypographyEditor. The button keeps its own
 * `textColor`, `fontSize` and `fontWeight`; the other keys are unset ('') until
 * chosen, so the button inherits them.
 */
export function buttonTypography(typography) {
	return {
		fontFamily: typography.fontFamily || '',
		fontWeight: String(typography.fontWeight ?? ''),
		fontSize: typography.fontSize ?? '',
		lineHeight: typography.lineHeight ?? '',
		letterSpacing: typography.letterSpacing ?? '',
		color: typography.textColor || '',
		textAlign: '',
		fontStyle: typography.fontStyle || '',
		textDecoration: typography.textDecoration || '',
		textTransform: typography.textTransform || '',
	};
}

/** Writes an edited typography record back onto the button's typography state. */
export function setButtonTypography(typography, record) {
	const { color, textAlign, ...rest } = record;
	Object.assign(typography, rest, { textColor: color });
}

/** The text styles beyond size, weight and colour that are set, as a camel-case style object. */
export function typographyExtraStyle(typography) {
	const { fontFamily, lineHeight, letterSpacing, fontStyle, textDecoration, textTransform } = buttonTypography(typography);
	return typographyToStyle({ fontFamily, lineHeight, letterSpacing, fontStyle, textDecoration, textTransform });
}

/** The same, as CSS declarations (kebab-case). */
export function typographyExtraCss(typography) {
	const { fontFamily, lineHeight, letterSpacing, fontStyle, textDecoration, textTransform } = buttonTypography(typography);
	return Object.entries(typographyToCssProperties({ fontFamily, lineHeight, letterSpacing, fontStyle, textDecoration, textTransform })).filter(([, value]) => value);
}

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

function formatCssNumber(value) {
	return Number(Number.parseFloat(value || 0).toFixed(3)).toString();
}

function normalizeCssVariableName(value) {
	const name = String(value || '').trim();
	return /^--[a-zA-Z0-9-_]+$/.test(name) ? name : '';
}
