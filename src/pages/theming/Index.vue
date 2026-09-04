<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import CodeBlock from '../_layout/CodeBlock.vue';
import { DomPopover } from '../lib/vue';
import CssComponentEditor from '../experiments/css-button-creator/components/CssComponentEditor.vue';
import {
	createCssComponentStyle,
	cssStyleValues,
	parseBackdropValue,
	replaceCssComponentStyle,
} from '../experiments/css-button-creator/lib/styleModel.js';

const tokenPairs = [
	{
		name: 'Background',
		bg: '--canvas',
		fg: '--canvas-fg',
		utilities: 'bg-canvas text-canvas-fg',
		use: 'The app canvas and ordinary page text.',
	},
	{
		name: 'Primary',
		bg: '--primary',
		fg: '--primary-fg',
		utilities: 'bg-primary text-primary-fg',
		use: 'Primary actions and high emphasis selected states.',
	},
	{
		name: 'Secondary',
		bg: '--secondary',
		fg: '--secondary-fg',
		utilities: 'bg-secondary text-secondary-fg',
		use: 'Quiet buttons, subtle panels, inactive controls, and helper UI.',
	},
	{
		name: 'Muted',
		bg: '--muted',
		fg: '--muted-fg',
		utilities: 'bg-muted text-muted-fg',
		use: 'Low-emphasis backgrounds and supporting copy.',
	},
	{
		name: 'Accent',
		bg: '--accent',
		fg: '--accent-fg',
		utilities: 'bg-accent text-accent-fg',
		use: 'Hover, focus, active rows, and soft selected states.',
	},
	{
		name: 'Destructive',
		bg: '--destructive',
		fg: '--destructive-fg',
		utilities: 'bg-destructive text-destructive-fg',
		use: 'Delete, remove, error, and irreversible actions.',
	},
	{
		name: 'Success',
		bg: '--success',
		fg: '--success-fg',
		utilities: 'bg-success text-success-fg',
		use: 'Saved, complete, connected, and positive confirmation states.',
	},
	{
		name: 'Warning',
		bg: '--warning',
		fg: '--warning-fg',
		utilities: 'bg-warning text-warning-fg',
		use: 'Attention, pending review, expiring, and recoverable risk states.',
	},
];

const fgByBg = Object.fromEntries(tokenPairs.map((pair) => [pair.bg, pair.fg]));
const bgByFg = Object.fromEntries(tokenPairs.map((pair) => [pair.fg, pair.bg]));

const utilityTokens = [
	{
		name: 'Border',
		token: '--border',
		utility: 'border-border ring-border divide-border',
		use: 'Edges, separators, low-emphasis rings, and component outlines.',
	},
	{
		name: 'Input',
		token: '--input',
		utility: 'border-input bg-canvas',
		use: 'Input borders and control tracks that should read as editable.',
	},
	{
		name: 'Ring',
		token: '--ring',
		utility: 'focus-visible:ring-ring outline-ring',
		use: 'Keyboard focus, inspector selection, and strong focus affordances.',
	},
];

const themeModes = [
	{ label: 'Light', value: 'light', selector: ':root' },
	{ label: 'Dark', value: 'dark', selector: '[data-theme="dark"]' },
];

const themeTokenDefaults = {
	light: {
		'--canvas': 'oklch(1 0 0)',
		'--canvas-fg': 'oklch(0.145 0 0)',
		'--primary': 'oklch(0.205 0 0)',
		'--primary-fg': 'oklch(0.985 0 0)',
		'--secondary': 'oklch(0.97 0 0)',
		'--secondary-fg': 'oklch(0.205 0 0)',
		'--muted': 'oklch(0.97 0 0)',
		'--muted-fg': 'oklch(0.5 0 0)',
		'--accent': 'oklch(0.97 0 0)',
		'--accent-fg': 'oklch(0.205 0 0)',
		'--destructive': 'oklch(0.577 0.245 27.325)',
		'--destructive-fg': 'oklch(0.985 0 0)',
		'--success': 'oklch(0.627 0.194 149.214)',
		'--success-fg': 'oklch(0.985 0 0)',
		'--warning': 'oklch(0.84 0.16 84)',
		'--warning-fg': 'oklch(0.28 0.07 46)',
		'--border': 'oklch(0.922 0 0)',
		'--input': 'oklch(0.922 0 0)',
		'--ring': 'oklch(0.708 0 0)',
	},
	dark: {
		'--canvas': 'oklch(0.145 0 0)',
		'--canvas-fg': 'oklch(0.985 0 0)',
		'--primary': 'oklch(0.922 0 0)',
		'--primary-fg': 'oklch(0.205 0 0)',
		'--secondary': 'oklch(0.269 0 0)',
		'--secondary-fg': 'oklch(0.985 0 0)',
		'--muted': 'oklch(0.269 0 0)',
		'--muted-fg': 'oklch(0.708 0 0)',
		'--accent': 'oklch(0.269 0 0)',
		'--accent-fg': 'oklch(0.985 0 0)',
		'--destructive': 'oklch(0.704 0.191 22.216)',
		'--destructive-fg': 'oklch(0.985 0 0)',
		'--success': 'oklch(0.696 0.17 162.48)',
		'--success-fg': 'oklch(0.145 0 0)',
		'--warning': 'oklch(0.769 0.188 70.08)',
		'--warning-fg': 'oklch(0.145 0 0)',
		'--border': 'oklch(0.269 0 0)',
		'--input': 'oklch(0.32 0 0)',
		'--ring': 'oklch(0.556 0 0)',
	},
};

const appearanceTokenDefaults = {
	'--radius': '0.625rem',
};

const appearanceTokenGroups = [
	{
		label: 'Corners',
		description: 'The base radius that feeds the rounded scale.',
		tokens: [
			{
				label: 'Corner radius',
				name: '--radius',
				type: 'range',
				min: 0,
				max: 1.25,
				step: 0.025,
				unit: 'rem',
				use: 'Controls rounded-sm through rounded-4xl.',
			},
		],
	},
];

const editableAppearanceTokens = appearanceTokenGroups.flatMap((group) => group.tokens);

const skinLevels = [
	{
		name: 'card',
		label: 'Card',
		className: 'skin-card',
		use: 'Cards, panels, calendars, and grouped content.',
	},
	{
		name: 'popover',
		label: 'Popover',
		className: 'skin-popover',
		use: 'Dropdowns, popovers, combobox menus, and context menus.',
	},
	{
		name: 'overlay',
		label: 'Overlay',
		className: 'skin-overlay',
		use: 'Dialogs, drawers, command palettes, and action sheets.',
	},
	{
		name: 'input',
		label: 'Input',
		className: 'skin-input',
		use: 'Inputs, textareas, selects, and editable controls.',
	},
	{
		name: 'control',
		label: 'Control',
		className: 'skin-control',
		use: 'Secondary buttons, quiet triggers, and neutral controls.',
	},
	{
		name: 'action',
		label: 'Action',
		className: 'skin-action',
		use: 'Primary actions and high-emphasis commands.',
	},
];

const skinPropertyDefinitions = [
	{
		key: 'bg',
		suffix: 'bg',
		label: 'Bg',
		use: 'CSS colour, color-mix(), or a semantic colour variable.',
		maxLength: 160,
	},
	{
		key: 'fg',
		suffix: 'fg',
		label: 'Fg',
		use: 'Text and icon colour for this skin.',
		maxLength: 160,
	},
	{
		key: 'border',
		suffix: 'border',
		label: 'Border',
		use: 'Border colour or transparent.',
		maxLength: 160,
	},
	{
		key: 'borderWidth',
		suffix: 'border-width',
		label: 'Border width',
		use: 'Usually 0px, 1px, or 2px.',
		maxLength: 12,
	},
	{
		key: 'borderStyle',
		suffix: 'border-style',
		label: 'Border style',
		use: 'Solid for most themes; dashed or dotted for expressive themes.',
		options: ['solid', 'none', 'dashed', 'dotted', 'double'],
		maxLength: 12,
	},
	{
		key: 'shadow',
		suffix: 'shadow',
		label: 'Shadow',
		use: 'One or more box-shadow layers, or none.',
		multiline: true,
		maxLength: 360,
	},
	{
		key: 'backdrop',
		suffix: 'backdrop',
		label: 'Backdrop',
		use: 'Backdrop filter such as blur(16px) saturate(1.1), or none.',
		maxLength: 160,
	},
	{
		key: 'bgImage',
		suffix: 'bg-image',
		label: 'Gradient',
		use: 'Linear/radial gradients for top-light, sheen, or material texture.',
		multiline: true,
		maxLength: 360,
	},
];

const skinTokenDefaults = {
	card: {
		bg: 'var(--canvas)',
		fg: 'var(--canvas-fg)',
		border: 'var(--border)',
		borderWidth: '1px',
		borderStyle: 'solid',
		shadow: 'var(--shadow-xs)',
		backdrop: 'none',
		bgImage: 'none',
	},
	popover: {
		bg: 'var(--canvas)',
		fg: 'var(--canvas-fg)',
		border: 'var(--border)',
		borderWidth: '1px',
		borderStyle: 'solid',
		shadow: 'var(--shadow-lg)',
		backdrop: 'none',
		bgImage: 'none',
	},
	overlay: {
		bg: 'var(--canvas)',
		fg: 'var(--canvas-fg)',
		border: 'var(--border)',
		borderWidth: '1px',
		borderStyle: 'solid',
		shadow: 'var(--shadow-2xl)',
		backdrop: 'blur(20px) saturate(1.12)',
		bgImage: 'none',
	},
	input: {
		bg: 'var(--canvas)',
		fg: 'var(--canvas-fg)',
		border: 'var(--input)',
		borderWidth: '1px',
		borderStyle: 'solid',
		shadow: 'inset 0 1px 2px rgb(15 23 42 / 0.04)',
		backdrop: 'none',
		bgImage: 'none',
	},
	control: {
		bg: 'var(--secondary)',
		fg: 'var(--secondary-fg)',
		border: 'var(--border)',
		borderWidth: '1px',
		borderStyle: 'solid',
		shadow: 'var(--shadow-xs)',
		backdrop: 'none',
		bgImage: 'none',
	},
	action: {
		bg: 'var(--primary)',
		fg: 'var(--primary-fg)',
		border: 'color-mix(in oklch, var(--primary) 80%, var(--border))',
		borderWidth: '1px',
		borderStyle: 'solid',
		shadow: 'var(--shadow-sm)',
		backdrop: 'none',
		bgImage: 'linear-gradient(to bottom, color-mix(in oklch, white 10%, transparent), transparent)',
	},
};

const editableSkinTokens = skinLevels.flatMap((level) => skinPropertyDefinitions.map((property) => ({
	level: level.name,
	levelLabel: level.label,
	property,
	name: skinTokenName(level.name, property),
})));

const skinBorderStyleOptions = ['none', 'solid', 'dashed', 'dotted', 'double'];

const skinShadowLayerDefaults = {
	card: [
		{ kind: 'drop', color: 'rgb(15 23 42)', alpha: 4, x: 0, y: 1, blur: 1, spread: 0 },
	],
	popover: [
		{ kind: 'drop', color: 'rgb(15 23 42)', alpha: 16, x: 0, y: 8, blur: 20, spread: -6 },
		{ kind: 'drop', color: 'rgb(15 23 42)', alpha: 8, x: 0, y: 2, blur: 6, spread: -2 },
	],
	overlay: [
		{ kind: 'drop', color: 'rgb(15 23 42)', alpha: 24, x: 0, y: 24, blur: 60, spread: -18 },
		{ kind: 'drop', color: 'rgb(15 23 42)', alpha: 14, x: 0, y: 8, blur: 20, spread: -10 },
	],
	input: [
		{ kind: 'inset', color: 'rgb(15 23 42)', alpha: 4, x: 0, y: 1, blur: 2, spread: 0 },
	],
	control: [
		{ kind: 'drop', color: 'rgb(15 23 42)', alpha: 4, x: 0, y: 1, blur: 1, spread: 0 },
	],
	action: [
		{ kind: 'drop', color: 'rgb(15 23 42)', alpha: 6, x: 0, y: 1, blur: 2, spread: 0 },
	],
};

const skinBackgroundFillDefaults = {
	card: [],
	popover: [],
	overlay: [],
	input: [],
	control: [],
	action: [
		{
			kind: 'linear',
			gradientAngle: 180,
			gradientFrom: 'color-mix(in oklch, white 10%, transparent)',
			gradientTo: 'transparent',
		},
	],
};

const editorTokenGroups = [
	{
		label: 'Canvas',
		description: 'Page background and ordinary text.',
		tokens: [
			{ label: 'Background', role: 'Bg', name: '--canvas' },
			{ label: 'Fg', role: 'Fg', name: '--canvas-fg' },
		],
	},
	...tokenPairs.slice(1).map((pair) => ({
		label: pair.name,
		description: pair.use,
		tokens: [
			{ label: pair.name, role: 'Bg', name: pair.bg },
			{ label: `${pair.name} fg`, role: 'Fg', name: pair.fg },
		],
	})),
	{
		label: 'Edges and focus',
		description: 'Borders, input chrome, and keyboard focus rings.',
		tokens: utilityTokens.map((token) => ({
			label: token.name,
			role: 'Utility',
			name: token.token,
		})),
	},
];

const editableColorTokens = Array.from(new Map(
	editorTokenGroups.flatMap((group) => group.tokens).map((token) => [token.name, token]),
).values());

function createThemeEditorState() {
	return {
		appearance: { ...appearanceTokenDefaults },
		skins: createSkinDefaults(),
		colors: Object.fromEntries(themeModes.map((mode) => [
			mode.value,
			Object.fromEntries(editableColorTokens.map((token) => [token.name, oklchToHex(themeTokenDefaults[mode.value][token.name])])),
		])),
	};
}

function createSkinDefaults() {
	return Object.fromEntries(skinLevels.map((level) => [
		level.name,
		{ ...skinTokenDefaults[level.name] },
	]));
}

function createSkinStyleStates(skins = createSkinDefaults()) {
	return Object.fromEntries(skinLevels.map((level) => [
		level.name,
		createSkinStyleState(level.name, skins[level.name]),
	]));
}

function createSkinStyleState(levelName, values = {}) {
	const defaults = skinTokenDefaults[levelName];
	const borderWidth = Number.parseFloat(values.borderWidth ?? defaults.borderWidth);
	return createCssComponentStyle({
		surface: {
			bg: values.bg ?? defaults.bg,
			fg: values.fg ?? defaults.fg,
		},
		border: {
			enabled: (values.borderStyle ?? defaults.borderStyle) !== 'none' && borderWidth > 0,
			color: values.border ?? defaults.border,
			width: Number.isFinite(borderWidth) ? borderWidth : 0,
			style: values.borderStyle ?? defaults.borderStyle,
		},
		backdrop: parseBackdropValue(values.backdrop ?? defaults.backdrop),
		background: {
			enabled: (values.bgImage ?? defaults.bgImage) !== 'none',
			fills: skinBackgroundFillDefaults[levelName],
		},
		shadows: skinShadowLayerDefaults[levelName],
	});
}

const defaultSkinStyleValues = Object.fromEntries(skinLevels.map((level) => [
	level.name,
	cssStyleValues(createSkinStyleState(level.name, skinTokenDefaults[level.name])),
]));

function getThemeEditorState() {
	const state = typeof window === 'undefined'
		? createThemeEditorState()
		: window.__domStudioThemeEditorState ||= createThemeEditorState();

	for (const token of editableAppearanceTokens) {
		state.appearance[token.name] ??= appearanceTokenDefaults[token.name];
	}
	state.skins ??= createSkinDefaults();
	for (const level of skinLevels) {
		state.skins[level.name] ??= {};
		for (const property of skinPropertyDefinitions) {
			state.skins[level.name][property.key] ??= skinTokenDefaults[level.name][property.key];
		}
	}
	for (const mode of themeModes) {
		state.colors[mode.value] ??= {};
		for (const token of editableColorTokens) {
			state.colors[mode.value][token.name] ??= oklchToHex(themeTokenDefaults[mode.value][token.name]);
		}
	}

	return state;
}

const decisionRows = [
	['Page canvas', 'bg-canvas text-canvas-fg', 'Use for the actual app canvas; it is driven directly by --canvas and --canvas-fg.'],
	['Card or panel', 'skin-card', 'Use for grouped content that needs the standard card material.'],
	['Popover or menu', 'skin-popover', 'Use for layers attached to a trigger.'],
	['Dialog or drawer', 'skin-overlay', 'Use for modal and app-level overlay panels.'],
	['Input chrome', 'skin-input', 'Use for editable controls and select-like triggers.'],
	['Primary button', 'skin-action', 'Use for high-emphasis commands.'],
	['Secondary button', 'skin-control', 'Use for quiet controls and neutral triggers.'],
	['Menu item hover', 'hover:bg-accent hover:text-accent-fg', 'Use accent for temporary interaction states.'],
	['Helper copy', 'text-muted-fg', 'Use for hints, captions, placeholders, and metadata.'],
	['Danger action', 'text-destructive or bg-destructive text-destructive-fg', 'Text-only for subtle danger, filled for destructive confirmation.'],
	['Success status', 'bg-success text-success-fg', 'Use for positive, completed, or saved states.'],
	['Warning status', 'bg-warning text-warning-fg', 'Use when attention is needed but the action is recoverable.'],
	['Focus state', 'focus-visible:ring-ring', 'Use for keyboard focus, usually with a transparent offset.'],
];

const themeCode = `:root {
\t--radius: 0.625rem;
\t--canvas: oklch(0.984 0.003 247);
\t--canvas-fg: oklch(0.145 0 0);
\t--primary: oklch(0.205 0 0);
\t--primary-fg: oklch(0.985 0 0);
\t--secondary: oklch(0.97 0 0);
\t--secondary-fg: oklch(0.205 0 0);
\t--success: oklch(0.57 0.794 149.350);
\t--success-fg: oklch(0.985 0 0);
\t--warning: oklch(0.7 0.2 84);
\t--warning-fg: oklch(0.28 0.07 46);
}

:root {
\t--skin-popover-bg: color-mix(in oklch, var(--canvas) 88%, transparent);
}`;

const usageCode = `<button class="skin-action rounded-full px-4 py-2">
\tSave changes
</button>

<div class="skin-card rounded-2xl p-4">
\t<p class="text-sm text-muted-fg">Use secondary text inside a card.</p>
</div>

<div class="skin-popover rounded-2xl p-2">
\t<button class="rounded-xl px-3 py-2 hover:bg-accent hover:text-accent-fg">
\t\tOpen project
\t</button>
</div>`;

const themeEditorState = getThemeEditorState();
const tokenHexValues = reactive(themeEditorState.colors);
const appearanceValues = reactive(themeEditorState.appearance);
const skinValues = reactive(themeEditorState.skins);
const skinStyleStates = reactive(createSkinStyleStates(themeEditorState.skins));
const activeMode = ref('light');
const activeTokenName = ref('--primary');
const aiThemePrompt = ref('');
const aiThemeStatus = ref('');
const isGeneratingTheme = ref(false);
const hasGeneratedTheme = ref(false);
const generatedThemeName = ref('dom-studio-theme');
let originalTheme = 'light';
let themeObserver = null;
const themeAiEndpoint = import.meta.env.VITE_THEME_AI_ENDPOINT || '/api/ai/theme';
const themeAiPublicToken = import.meta.env.VITE_THEME_AI_PUBLIC_TOKEN || '';

const activeToken = computed(() => editableColorTokens.find((token) => token.name === activeTokenName.value) || editableColorTokens[0]);
const activeTokenValue = computed(() => hexToOklch(tokenHexValues[activeMode.value][activeTokenName.value]));
const appearanceCode = computed(() => editableAppearanceTokens
	.map((token) => `\t${token.name}: ${appearanceCssValue(token.name)};`)
	.join('\n'));
const skinCode = computed(() => skinLevels.map((level) => skinPropertyDefinitions
	.filter((property) => isSkinTokenOverride(level.name, property))
	.map((property) => `\t${skinTokenName(level.name, property)}: ${skinCssValue(level.name, property)};`)
	.join('\n')).filter(Boolean).join('\n'));
const themeEditorCode = computed(() => [
	`:root {\n${appearanceCode.value}\n${skinCode.value ? `\n${skinCode.value}` : ''}\n}`,
	...themeModes.map((mode) => `${mode.selector} {\n${editableColorTokens
		.map((token) => `\t${token.name}: ${hexToOklch(tokenHexValues[mode.value][token.name])};`)
		.join('\n')}\n}`),
]
	.join('\n\n'));

function swatchStyle(pair) {
	return {
		background: `var(${pair.bg})`,
		color: `var(${pair.fg})`,
	};
}

function utilitySwatchStyle(token) {
	return {
		background: `var(${token.token})`,
	};
}

function variableSwatchStyle(name) {
	return {
		background: `var(${name})`,
	};
}

function skinTokenName(levelName, property) {
	return `--skin-${levelName}-${property.suffix}`;
}

function skinCssVariables(levelName) {
	return Object.fromEntries(skinPropertyDefinitions.map((property) => [
		property.key,
		skinTokenName(levelName, property),
	]));
}

function skinValue(levelName, property) {
	return skinValues[levelName]?.[property.key] ?? skinTokenDefaults[levelName][property.key];
}

function skinCssValue(levelName, property) {
	return normalizeSkinValue(property, skinValue(levelName, property)) || skinTokenDefaults[levelName][property.key];
}

function isSkinTokenOverride(levelName, property) {
	const value = skinCssValue(levelName, property);
	return value !== skinTokenDefaults[levelName][property.key]
		&& value !== defaultSkinStyleValues[levelName]?.[property.key];
}

function syncSkinStyleBuilders() {
	for (const level of skinLevels) {
		Object.assign(skinValues[level.name], cssStyleValues(skinStyleStates[level.name]));
	}
	applyActiveTheme();
}

function resetSkinStyleBuilders() {
	for (const level of skinLevels) {
		replaceCssComponentStyle(skinStyleStates[level.name], createSkinStyleState(level.name, skinTokenDefaults[level.name]));
		Object.assign(skinValues[level.name], skinTokenDefaults[level.name]);
	}
	applyActiveTheme();
}

function updateSkinStyleStateFromValues(levelName, values = {}) {
	const style = skinStyleStates[levelName];
	const defaults = skinTokenDefaults[levelName];
	if ('bg' in values) style.surface.bg = values.bg || defaults.bg;
	if ('fg' in values) style.surface.fg = values.fg || defaults.fg;
	if ('border' in values || 'borderWidth' in values || 'borderStyle' in values) {
		const borderWidth = Number.parseFloat(values.borderWidth ?? style.border.width);
		style.border.color = values.border || style.border.color;
		style.border.width = Number.isFinite(borderWidth) ? borderWidth : style.border.width;
		style.border.style = values.borderStyle || style.border.style;
		style.border.enabled = style.border.style !== 'none' && style.border.width > 0;
	}
	if ('backdrop' in values) {
		Object.assign(style.backdrop, parseBackdropValue(values.backdrop || defaults.backdrop));
	}
}

function skinPreviewStyle(level) {
	return Object.fromEntries(skinPropertyDefinitions.filter((property) => isSkinTokenOverride(level.name, property)).map((property) => [
		skinTokenName(level.name, property),
		skinCssValue(level.name, property),
	]));
}

function updateSkinToken(levelName, property, value) {
	skinValues[levelName][property.key] = normalizeSkinValue(property, value) || skinTokenDefaults[levelName][property.key];
	applyActiveTheme();
}

function updateColorToken(mode, name, value) {
	tokenHexValues[mode][name] = value;
	activeMode.value = mode;
	activeTokenName.value = name;
	if (typeof document !== 'undefined') {
		document.documentElement.dataset.theme = mode;
	}
	applyActiveTheme();
}

function setEditorMode(mode) {
	activeMode.value = mode;
	if (typeof document !== 'undefined') {
		document.documentElement.dataset.theme = mode;
	}
	applyActiveTheme();
}

function resetColorTokens() {
	for (const mode of themeModes) {
		for (const token of editableColorTokens) {
			tokenHexValues[mode.value][token.name] = oklchToHex(themeTokenDefaults[mode.value][token.name]);
		}
	}
	for (const token of editableAppearanceTokens) {
		appearanceValues[token.name] = appearanceTokenDefaults[token.name];
	}
	for (const level of skinLevels) {
		for (const property of skinPropertyDefinitions) {
			skinValues[level.name][property.key] = skinTokenDefaults[level.name][property.key];
		}
	}
	resetSkinStyleBuilders();
	activeTokenName.value = '--primary';
	activeMode.value = originalTheme;
	clearAppliedTheme();
	if (typeof document !== 'undefined') {
		document.documentElement.dataset.theme = originalTheme;
	}
}

function applyActiveTheme() {
	if (typeof document === 'undefined') return;
	for (const token of editableAppearanceTokens) {
		document.documentElement.style.setProperty(token.name, appearanceCssValue(token.name));
	}
	for (const token of editableSkinTokens) {
		if (isSkinTokenOverride(token.level, token.property)) {
			document.documentElement.style.setProperty(token.name, skinCssValue(token.level, token.property));
		} else {
			document.documentElement.style.removeProperty(token.name);
		}
	}
	for (const token of editableColorTokens) {
		document.documentElement.style.setProperty(token.name, hexToOklch(tokenHexValues[activeMode.value][token.name]));
	}
}

function clearAppliedTheme() {
	if (typeof document === 'undefined') return;
	for (const token of editableAppearanceTokens) {
		document.documentElement.style.removeProperty(token.name);
	}
	for (const token of editableSkinTokens) {
		document.documentElement.style.removeProperty(token.name);
	}
	for (const token of editableColorTokens) {
		document.documentElement.style.removeProperty(token.name);
	}
}

watch(skinStyleStates, syncSkinStyleBuilders, { deep: true });

function hydrateAppearanceFromDocument() {
	if (typeof document === 'undefined') return;
	const styles = getComputedStyle(document.documentElement);
	for (const token of editableAppearanceTokens) {
		const value = styles.getPropertyValue(token.name).trim();
		if (!value) continue;
		appearanceValues[token.name] = normalizeAppearanceValue(token, value);
	}
	for (const token of editableSkinTokens) {
		if (isBuilderOwnedSkinToken(token.property)) continue;
		const value = styles.getPropertyValue(token.name).trim();
		if (!value) continue;
		updateSkinStyleStateFromValues(token.level, {
			[token.property.key]: normalizeSkinValue(token.property, value) || skinTokenDefaults[token.level][token.property.key],
		});
	}
}

function tokenHex(mode, name) {
	return tokenHexValues[mode][name];
}

function tokenOklch(mode, name) {
	return hexToOklch(tokenHex(mode, name));
}

function tokenSwatchStyle(mode, name) {
	return {
		backgroundColor: tokenHex(mode, name),
	};
}

function pairedTokenSwatchStyle(mode, name) {
	const fg = fgByBg[name];
	const bg = bgByFg[name];
	if (fg) {
		return {
			backgroundColor: tokenHex(mode, name),
			color: tokenHex(mode, fg),
		};
	}
	if (bg) {
		return {
			backgroundColor: tokenHex(mode, bg),
			color: tokenHex(mode, name),
		};
	}
	return tokenSwatchStyle(mode, name);
}

function tokenSwatchLabel(name) {
	return fgByBg[name] || bgByFg[name] ? 'Aa' : '';
}

function groupPairPreviewStyle(mode, group) {
	const bg = groupBgToken(group);
	if (!bg) return {};
	return {
		backgroundColor: tokenHex(mode, bg.name),
		color: tokenHex(mode, fgByBg[bg.name]),
	};
}

function hasGroupPairPreview(group) {
	return Boolean(groupBgToken(group));
}

function groupBgToken(group) {
	return group.tokens.find((token) => fgByBg[token.name]);
}

function groupFgToken(group) {
	const bg = groupBgToken(group);
	if (!bg) return null;
	return group.tokens.find((token) => token.name === fgByBg[bg.name]);
}

function groupPairTokens(group) {
	return [groupBgToken(group), groupFgToken(group)].filter(Boolean);
}

function isActiveGroup(group) {
	return group.tokens.some((token) => isActiveToken(token.name));
}

function updateAppearanceToken(token, value) {
	appearanceValues[token.name] = formatAppearanceInputValue(token, value);
	applyActiveTheme();
}

function appearanceInputValue(token) {
	const value = appearanceValues[token.name];
	if (token.type === 'color') return value;
	return Number.parseFloat(value) || 0;
}

function appearanceDisplayValue(token) {
	if (token.type === 'color') return appearanceCssValue(token.name);
	return appearanceValues[token.name];
}

function appearanceCssValue(name) {
	const value = appearanceValues[name];
	return value;
}

function appearancePreviewStyle() {
	return {
		borderRadius: 'calc(var(--radius) * 2.2)',
	};
}

function isActiveToken(name) {
	return activeTokenName.value === name;
}

function themeColumnStyle(mode) {
	return {
		...Object.fromEntries(editableColorTokens.map((token) => [token.name, hexToOklch(tokenHexValues[mode][token.name])])),
	};
}

function themeSnapshot() {
	return {
		appearance: Object.fromEntries(editableAppearanceTokens.map((token) => [token.name, appearanceValues[token.name]])),
		skins: Object.fromEntries(skinLevels.map((level) => [
			level.name,
			Object.fromEntries(skinPropertyDefinitions.map((property) => [property.key, skinValue(level.name, property)])),
		])),
		...Object.fromEntries(themeModes.map((mode) => [
			mode.value,
			Object.fromEntries(editableColorTokens.map((token) => [token.name, tokenHexValues[mode.value][token.name]])),
		])),
	};
}

async function generateThemeWithAi() {
	if (!themeAiEndpoint) {
		aiThemeStatus.value = 'AI theme generation needs a secure API endpoint. Use the randomizer here, or point VITE_THEME_AI_ENDPOINT at a server route.';
		return;
	}

	isGeneratingTheme.value = true;
	aiThemeStatus.value = 'Asking AI for a theme...';

	try {
		const response = await fetch(themeAiEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(themeAiPublicToken ? { 'Authorization': `Bearer ${themeAiPublicToken}` } : {}),
			},
			body: JSON.stringify({
				prompt: aiThemePrompt.value,
				tokens: themeSnapshot(),
			}),
		});

		const payload = await response.json();
		if (!response.ok) throw new Error(payload.error || 'Theme request failed.');
		const theme = payload.theme || payload;
		applyThemePayload(theme);
		rememberGeneratedTheme(theme);
		aiThemeStatus.value = theme.name ? `Applied ${theme.name}.` : 'Applied AI theme.';
	} catch (error) {
		aiThemeStatus.value = error.message || 'AI theme request failed.';
	} finally {
		isGeneratingTheme.value = false;
	}
}

function generateRandomTheme() {
	const theme = createLocalTheme(aiThemePrompt.value);
	applyThemePayload(theme);
	rememberGeneratedTheme(theme);
	aiThemeStatus.value = theme.name;
}

function rememberGeneratedTheme(theme) {
	generatedThemeName.value = theme?.name || 'dom-studio-theme';
	hasGeneratedTheme.value = true;
}

function downloadThemeCss() {
	if (typeof document === 'undefined') return;
	const blob = new Blob([`${themeEditorCode.value}\n`], { type: 'text/css' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `${slugifyThemeName(generatedThemeName.value)}.css`;
	document.body.append(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

function slugifyThemeName(value) {
	const slug = String(value || '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return slug || 'dom-studio-theme';
}

function applyThemePayload(theme) {
	const appearance = theme.appearance || {};
	for (const token of editableAppearanceTokens) {
		const value = appearance[token.name];
		if (value == null) continue;
		appearanceValues[token.name] = normalizeAppearanceValue(token, value);
	}
	const skins = theme.skins || {};
	for (const level of skinLevels) {
		const source = skins[level.name] || {};
		const values = {};
		for (const property of skinPropertyDefinitions) {
			if (isBuilderOwnedSkinToken(property)) continue;
			const value = source[property.key];
			if (value == null) continue;
			values[property.key] = normalizeSkinValue(property, value) || skinTokenDefaults[level.name][property.key];
		}
		updateSkinStyleStateFromValues(level.name, values);
	}
	for (const mode of themeModes) {
		const source = theme[mode.value] || {};
		for (const token of editableColorTokens) {
			const value = source[token.name];
			if (!value) continue;
			tokenHexValues[mode.value][token.name] = normalizeThemeColor(value);
		}
	}
	applyActiveTheme();
}

function isBuilderOwnedSkinToken(property) {
	return property.key === 'shadow' || property.key === 'bgImage';
}

function normalizeAppearanceValue(token, value) {
	if (token.type === 'color') return normalizeThemeColor(value);
	return formatAppearanceInputValue(token, Number.parseFloat(value));
}

function normalizeSkinValue(property, value) {
	const raw = String(value ?? '').trim();
	if (!raw || raw.length > property.maxLength || /[;{}@]/.test(raw) || /\burl\s*\(/i.test(raw)) return '';
	if (property.key === 'borderWidth') {
		return /^(0|[0-4](?:\.\d+)?px)$/i.test(raw) ? raw : '';
	}
	if (property.key === 'borderStyle') {
		return skinBorderStyleOptions.includes(raw) ? raw : '';
	}
	return raw;
}

function formatAppearanceInputValue(token, value) {
	if (token.type === 'color') return normalizeThemeColor(value);
	const number = clamp(Number.parseFloat(value) || 0, token.min, token.max);
	const rounded = Number(number.toFixed(3)).toString();
	return `${rounded}${token.unit}`;
}

function normalizeThemeColor(value) {
	const color = String(value).trim();
	if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) return expandHex(color);
	if (color.startsWith('oklch(')) return oklchToHex(color);
	return '#000000';
}

function createLocalTheme(prompt = '') {
	const hue = promptHue(prompt);
	const accentHue = (hue + 34) % 360;
	const dangerHue = 16;
	const successHue = 154;
	const warningHue = prompt.toLowerCase().includes('yellow') ? hue : 48;
	const bold = /\b(big|bold|loud|strong|vivid|punchy)\b/i.test(prompt);
	const primaryLightness = bold ? 39 : 44;
	const primarySaturation = bold ? 88 : 74;

	return {
		name: 'Applied a local theme mix.',
		appearance: createLocalAppearance(prompt),
		skins: createLocalSkins(prompt),
		light: {
			'--canvas': hslToHex(hue, 34, 98),
			'--canvas-fg': hslToHex(hue, 26, 10),
			'--primary': hslToHex(hue, primarySaturation, primaryLightness),
			'--primary-fg': contrastText(hue, primarySaturation, primaryLightness),
			'--secondary': hslToHex(hue, 38, 93),
			'--secondary-fg': hslToHex(hue, 32, 18),
			'--muted': hslToHex(hue, 28, 94),
			'--muted-fg': hslToHex(hue, 12, 42),
			'--accent': hslToHex(accentHue, 54, 90),
			'--accent-fg': hslToHex(accentHue, 52, 18),
			'--destructive': hslToHex(dangerHue, 76, 48),
			'--destructive-fg': '#ffffff',
			'--success': hslToHex(successHue, 62, 38),
			'--success-fg': '#ffffff',
			'--warning': hslToHex(warningHue, 88, 62),
			'--warning-fg': hslToHex(warningHue, 70, 16),
			'--border': hslToHex(hue, 24, 86),
			'--input': hslToHex(hue, 24, 86),
			'--ring': hslToHex(hue, primarySaturation, Math.min(primaryLightness + 12, 58)),
		},
		dark: {
			'--canvas': hslToHex(hue, 26, 8),
			'--canvas-fg': hslToHex(hue, 20, 96),
			'--primary': hslToHex(hue, primarySaturation, bold ? 68 : 72),
			'--primary-fg': hslToHex(hue, 28, 9),
			'--secondary': hslToHex(hue, 22, 18),
			'--secondary-fg': hslToHex(hue, 18, 94),
			'--muted': hslToHex(hue, 20, 18),
			'--muted-fg': hslToHex(hue, 13, 68),
			'--accent': hslToHex(accentHue, 36, 24),
			'--accent-fg': hslToHex(accentHue, 48, 92),
			'--destructive': hslToHex(dangerHue, 70, 64),
			'--destructive-fg': hslToHex(dangerHue, 36, 9),
			'--success': hslToHex(successHue, 54, 62),
			'--success-fg': hslToHex(successHue, 34, 9),
			'--warning': hslToHex(warningHue, 76, 66),
			'--warning-fg': hslToHex(warningHue, 48, 10),
			'--border': hslToHex(hue, 18, 24),
			'--input': hslToHex(hue, 18, 28),
			'--ring': hslToHex(hue, primarySaturation, 62),
		},
	};
}

function createLocalAppearance(prompt = '') {
	const lower = prompt.toLowerCase();
	const sharp = /\b(sharp|square|brutalist|flat corners)\b/i.test(lower);
	const round = /\b(round|rounded|soft|pill|friendly)\b/i.test(lower);

	return {
		'--radius': `${sharp ? 0.125 : round ? 0.95 : 0.625}rem`,
	};
}

function createLocalSkins(prompt = '') {
	const lower = prompt.toLowerCase();
	const flat = /\b(flat|minimal|quiet|plain|low shadow|no shadow|shadcn)\b/i.test(lower);
	const glass = /\b(glass|glassmorphism|frost|frosted|apple|liquid)\b/i.test(lower);
	const whacky = /\b(whacky|wild|weird|playful|neon|cyber|loud)\b/i.test(lower);
	const warm = /\b(warm|amber|gold|sunset)\b/i.test(lower);
	const shadowColor = warm ? '120 53 15' : whacky ? '88 28 135' : '15 23 42';
	const softBorder = glass ? 'color-mix(in oklch, white 34%, var(--border))' : 'var(--border)';
	const softGradient = glass
		? 'linear-gradient(to bottom, color-mix(in oklch, white 26%, transparent), transparent 52%, color-mix(in oklch, black 7%, transparent))'
		: whacky
			? 'linear-gradient(135deg, color-mix(in oklch, var(--primary) 18%, transparent), color-mix(in oklch, var(--accent) 22%, transparent))'
			: 'none';
	const liftedShadow = flat
		? 'none'
		: glass
			? `0 1px 0 color-mix(in oklch, white 45%, transparent) inset, 0 -1px 0 color-mix(in oklch, black 10%, transparent) inset, 0 18px 44px -24px rgb(${shadowColor} / 0.34)`
			: whacky
				? `0 0 0 1px color-mix(in oklch, var(--primary) 24%, transparent), 0 18px 50px -20px rgb(${shadowColor} / 0.38)`
				: 'var(--shadow-sm)';
	const popoverShadow = flat
		? 'var(--shadow-sm)'
		: glass
			? `0 1px 0 color-mix(in oklch, white 55%, transparent) inset, 0 -1px 0 color-mix(in oklch, black 12%, transparent) inset, 0 24px 64px -26px rgb(${shadowColor} / 0.42)`
			: whacky
				? `0 0 0 1px color-mix(in oklch, var(--primary) 32%, transparent), 0 24px 72px -24px rgb(${shadowColor} / 0.46)`
				: 'var(--shadow-xl)';

	return {
		card: {
			...skinTokenDefaults.card,
			bg: glass
				? 'color-mix(in oklch, var(--canvas) 76%, transparent)'
				: skinTokenDefaults.card.bg,
			border: softBorder,
			shadow: liftedShadow,
			backdrop: glass ? 'blur(18px) saturate(1.16)' : 'none',
			bgImage: softGradient,
		},
		popover: {
			...skinTokenDefaults.popover,
			bg: glass
				? 'color-mix(in oklch, var(--canvas) 72%, transparent)'
				: skinTokenDefaults.popover.bg,
			border: softBorder,
			shadow: popoverShadow,
			backdrop: glass ? 'blur(22px) saturate(1.2)' : skinTokenDefaults.popover.backdrop,
			bgImage: softGradient,
		},
		overlay: {
			...skinTokenDefaults.overlay,
			bg: glass
				? 'color-mix(in oklch, var(--canvas) 74%, transparent)'
				: skinTokenDefaults.overlay.bg,
			border: softBorder,
			shadow: flat ? 'var(--shadow-md)' : popoverShadow,
			backdrop: glass ? 'blur(26px) saturate(1.22)' : skinTokenDefaults.overlay.backdrop,
			bgImage: softGradient,
		},
		input: {
			...skinTokenDefaults.input,
			shadow: flat ? 'none' : skinTokenDefaults.input.shadow,
		},
		control: {
			...skinTokenDefaults.control,
			bg: glass ? 'color-mix(in oklch, var(--secondary) 70%, transparent)' : 'var(--secondary)',
			border: softBorder,
			shadow: flat ? 'none' : 'var(--shadow-xs)',
			backdrop: glass ? 'blur(12px) saturate(1.1)' : 'none',
			bgImage: glass ? 'linear-gradient(to bottom, color-mix(in oklch, white 14%, transparent), transparent)' : 'none',
		},
		action: {
			...skinTokenDefaults.action,
			shadow: flat ? 'none' : whacky ? `0 0 0 1px color-mix(in oklch, white 18%, transparent) inset, 0 14px 36px -18px rgb(${shadowColor} / 0.44)` : 'var(--shadow-sm)',
			bgImage: whacky
				? 'linear-gradient(135deg, color-mix(in oklch, white 24%, transparent), transparent 42%, color-mix(in oklch, black 16%, transparent))'
				: skinTokenDefaults.action.bgImage,
		},
	};
}

function promptHue(prompt) {
	const lower = prompt.toLowerCase();
	const namedHues = [
		['yellow', 52],
		['gold', 44],
		['orange', 28],
		['red', 8],
		['rose', 344],
		['pink', 326],
		['purple', 272],
		['violet', 264],
		['blue', 218],
		['cyan', 190],
		['teal', 174],
		['green', 146],
		['lime', 92],
	];
	const match = namedHues.find(([name]) => lower.includes(name));
	if (match) return match[1];
	return Math.floor(Math.random() * 360);
}

function contrastText(hue, saturation, lightness) {
	return lightness > 56 ? hslToHex(hue, saturation, 10) : '#ffffff';
}

function hslToHex(hue, saturation, lightness) {
	const s = saturation / 100;
	const l = lightness / 100;
	const chroma = (1 - Math.abs((2 * l) - 1)) * s;
	const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = l - (chroma / 2);
	const [r, g, b] = hue < 60 ? [chroma, x, 0]
		: hue < 120 ? [x, chroma, 0]
			: hue < 180 ? [0, chroma, x]
				: hue < 240 ? [0, x, chroma]
					: hue < 300 ? [x, 0, chroma]
						: [chroma, 0, x];

	return rgbToHex([r + m, g + m, b + m]);
}

function expandHex(hex) {
	const clean = hex.replace('#', '');
	if (clean.length === 6) return `#${clean.toLowerCase()}`;
	return `#${clean.split('').map((part) => part + part).join('').toLowerCase()}`;
}

function hexToOklch(hex) {
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

function oklchToHex(value) {
	const match = value.match(/oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)/i);
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

function hexToRgb(hex) {
	const clean = hex.replace('#', '');
	const value = clean.length === 3
		? clean.split('').map((part) => part + part).join('')
		: clean.padEnd(6, '0').slice(0, 6);

	return [
		Number.parseInt(value.slice(0, 2), 16) / 255,
		Number.parseInt(value.slice(2, 4), 16) / 255,
		Number.parseInt(value.slice(4, 6), 16) / 255,
	];
}

function rgbToHex(values) {
	return `#${values
		.map((value) => Math.round(clamp(value, 0, 1) * 255).toString(16).padStart(2, '0'))
		.join('')}`;
}

function srgbToLinear(value) {
	return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value) {
	return value <= 0.0031308 ? 12.92 * value : 1.055 * (value ** (1 / 2.4)) - 0.055;
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function formatNumber(value) {
	return Number(value.toFixed(3)).toString();
}

onMounted(() => {
	originalTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
	activeMode.value = originalTheme;
	hydrateAppearanceFromDocument();
	applyActiveTheme();
	themeObserver = new MutationObserver(() => {
		const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
		if (nextTheme !== activeMode.value) {
			activeMode.value = nextTheme;
			applyActiveTheme();
		}
	});
	themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});

onBeforeUnmount(() => {
	themeObserver?.disconnect();
});
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Theming"
			tagline="DOM Studio uses css variable design tokens: base tokens paint skins, and matching -fg tokens keep text readable."
			tag="style.css"
			eyebrow="Foundation"
		>
			<DocSection eyebrow="Model" title="Colour and fg pairs">
				<div class="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
					<div class="rounded-3xl border border-border skin-card p-6 text-canvas-fg shadow-xl shadow-black/5">
						<p class="text-sm leading-6 text-muted-fg">
							Use the base token when you are painting a background. Use the matching
							<code class="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">*-fg</code>
							token when text or icons need to sit on it.
						</p>
						<div class="mt-6 grid gap-3 sm:grid-cols-2">
							<div class="rounded-2xl bg-primary p-4 text-primary-fg">
								<p class="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">Filled action</p>
								<p class="mt-2 text-lg font-semibold">bg-primary</p>
								<p class="mt-1 text-sm opacity-80">text-primary-fg</p>
							</div>
							<div class="rounded-2xl border border-border bg-secondary p-4 text-canvas-fg">
								<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Quiet panel</p>
								<p class="mt-2 text-lg font-semibold">bg-secondary</p>
								<p class="mt-1 text-sm text-muted-fg">text-secondary-fg or text-canvas-fg</p>
							</div>
						</div>
					</div>
					<div class="rounded-3xl border border-border bg-secondary/50 p-6">
						<p class="text-sm font-semibold text-canvas-fg">Token naming convention</p>
						<dl class="mt-4 space-y-3 text-sm">
							<div class="rounded-2xl border border-border bg-canvas p-3">
								<dt class="font-mono text-xs text-muted-fg">Bg token</dt>
								<dd class="mt-1 font-mono text-canvas-fg">DOM Studio --primary</dd>
							</div>
							<div class="rounded-2xl border border-border bg-canvas p-3">
								<dt class="font-mono text-xs text-muted-fg">Fg token</dt>
								<dd class="mt-1 font-mono text-canvas-fg">DOM Studio --primary-fg</dd>
							</div>
							<div class="rounded-2xl border border-border bg-canvas p-3">
								<dt class="font-mono text-xs text-muted-fg">Added pairs</dt>
								<dd class="mt-1 font-mono text-canvas-fg">primary, secondary, muted, accent, status</dd>
							</div>
						</dl>
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="At a glance" title="Read the theme as product UI">
				<div class="overflow-hidden rounded-3xl border border-border bg-canvas shadow-2xl shadow-black/5">
					<div class="border-b border-border skin-card px-5 py-4">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p class="text-sm font-semibold text-canvas-fg">Project dashboard</p>
								<p class="text-xs text-muted-fg">Example composition using only semantic tokens.</p>
							</div>
							<div class="flex items-center gap-2">
								<span class="rounded-full bg-success px-2.5 py-1 text-xs font-medium text-success-fg">Saved</span>
								<button class="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-fg shadow-sm">Publish</button>
							</div>
						</div>
					</div>
					<div class="grid gap-4 p-5 lg:grid-cols-[1fr_18rem]">
						<div class="space-y-4">
							<div class="rounded-2xl border border-border skin-card p-4 text-canvas-fg">
								<div class="flex items-start justify-between gap-4">
									<div>
										<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Revenue</p>
										<p class="mt-2 text-3xl font-semibold tracking-tight">GBP 42,860</p>
									</div>
									<span class="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">+12.4%</span>
								</div>
								<div class="mt-5 grid h-20 grid-cols-6 items-end gap-1 border-b border-border">
									<span v-for="height in [32, 48, 38, 64, 52, 78]" :key="height" class="rounded-t-lg bg-primary/80" :style="{ height: `${height}px` }"></span>
								</div>
							</div>
							<div class="grid gap-4 sm:grid-cols-2">
								<div class="rounded-2xl border border-border bg-secondary/70 p-4">
									<p class="text-sm font-medium text-canvas-fg">Quiet panel</p>
									<p class="mt-1 text-sm text-muted-fg">Secondary skins group nearby controls without demanding attention.</p>
								</div>
								<div class="rounded-2xl border border-warning/40 bg-warning/15 p-4 text-warning">
									<p class="text-sm font-semibold">Review needed</p>
									<p class="mt-1 text-sm opacity-80">Warning tokens should feel noticeable, not alarming.</p>
								</div>
							</div>
						</div>
						<div class="space-y-3 rounded-2xl border border-border skin-popover p-3 text-canvas-fg shadow-xl shadow-black/10">
							<p class="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Command menu</p>
							<button class="block w-full rounded-xl bg-accent px-3 py-2 text-left text-sm font-medium text-accent-fg">Open project</button>
							<button class="block w-full rounded-xl px-3 py-2 text-left text-sm text-muted-fg hover:bg-accent hover:text-accent-fg">Invite teammate</button>
							<button class="block w-full rounded-xl px-3 py-2 text-left text-sm text-destructive hover:bg-destructive hover:text-destructive-fg">Delete project</button>
						</div>
					</div>
				</div>
			</DocSection>

			<DocSection id="theme-builder" eyebrow="Editor" title="Tune CSS variable colours">
				<div class="space-y-4 rounded-2xl border border-border skin-card p-4 text-canvas-fg">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-canvas-fg">{{ activeToken.label }} - {{ activeMode }}</p>
							<p class="font-mono text-xs text-muted-fg">{{ activeToken.name }}: {{ activeTokenValue }}</p>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<div class="inline-flex rounded-full border border-border bg-canvas p-1">
								<button
									v-for="mode in themeModes"
									:key="mode.value"
									type="button"
									class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
									:class="activeMode === mode.value ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted-fg hover:text-canvas-fg'"
									@click="setEditorMode(mode.value)"
								>
									Preview {{ mode.label }}
								</button>
							</div>
							<button
								type="button"
								class="rounded-full border border-border bg-canvas px-4 py-2 text-sm font-medium text-canvas-fg transition-colors hover:bg-secondary"
								@click="resetColorTokens"
							>
								Reset
							</button>
						</div>
					</div>
					<div>
						<label class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg" for="theme-ai-prompt">AI theme direction</label>
						<div class="mt-2 grid gap-2 lg:grid-cols-[1fr_auto_auto_auto]">
							<input
								id="theme-ai-prompt"
								v-model="aiThemePrompt"
								type="text"
								class="h-10 min-w-0 rounded-lg border border-input bg-canvas px-3 text-sm text-canvas-fg outline-none transition-colors focus:border-ring"
								placeholder="brand color is yellow and big and bold"
							>
							<button
								type="button"
								class="rounded-lg border border-border bg-canvas px-4 py-2 text-sm font-medium text-canvas-fg transition-colors hover:bg-secondary"
								@click="generateRandomTheme"
							>
								Random mix
							</button>
							<button
								type="button"
								class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-fg transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
								:disabled="isGeneratingTheme"
								@click="generateThemeWithAi"
							>
								{{ isGeneratingTheme ? 'Asking AI' : 'Ask AI' }}
							</button>
							<button
								type="button"
								class="rounded-lg border border-border bg-canvas px-4 py-2 text-sm font-medium text-canvas-fg transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
								:disabled="!hasGeneratedTheme"
								@click="downloadThemeCss"
							>
								Download CSS
							</button>
						</div>
						<p v-if="aiThemeStatus" class="mt-2 text-sm text-muted-fg">{{ aiThemeStatus }}</p>
					</div>
				</div>

				<div class="grid gap-4">
					<div class="grid gap-4 lg:grid-cols-2">
						<section
							v-for="group in appearanceTokenGroups"
							:key="group.label"
							class="rounded-2xl border border-border skin-card p-4 text-canvas-fg"
						>
							<div>
								<p class="text-sm font-semibold text-canvas-fg">{{ group.label }}</p>
								<p class="mt-1 text-sm text-muted-fg">{{ group.description }}</p>
							</div>
							<div class="mt-4 space-y-4">
								<label
									v-for="token in group.tokens"
									:key="token.name"
									class="block rounded-xl border border-border bg-canvas p-3"
								>
									<span class="flex items-start justify-between gap-3">
										<span class="min-w-0">
											<span class="block text-sm font-medium text-canvas-fg">{{ token.label }}</span>
											<span class="mt-0.5 block font-mono text-xs text-muted-fg">{{ token.name }}: {{ appearanceDisplayValue(token) }}</span>
										</span>
										<span
											v-if="token.type === 'color'"
											class="size-9 shrink-0 rounded-lg border border-border shadow-sm"
											:style="{ backgroundColor: appearanceValues[token.name] }"
										></span>
									</span>
									<input
										v-if="token.type === 'range'"
										type="range"
										class="mt-3 w-full accent-primary"
										:min="token.min"
										:max="token.max"
										:step="token.step"
										:value="appearanceInputValue(token)"
										:aria-label="token.label"
										@input="updateAppearanceToken(token, $event.target.value)"
									>
									<input
										v-else
										type="color"
										class="mt-3 h-10 w-full cursor-pointer rounded-lg border border-border bg-canvas p-1"
										:value="appearanceValues[token.name]"
										:aria-label="token.label"
										@input="updateAppearanceToken(token, $event.target.value)"
									>
									<span class="mt-2 block text-xs text-muted-fg">{{ token.use }}</span>
								</label>
							</div>
						</section>
						<div class="rounded-2xl border border-border skin-card p-4 text-canvas-fg">
							<div>
								<p class="text-sm font-semibold text-canvas-fg">Shape preview</p>
								<p class="mt-1 text-sm text-muted-fg">Radius is still global because it affects every rounded utility.</p>
							</div>
							<div class="mt-4 space-y-4">
								<div class="border border-border bg-canvas p-4" :style="appearancePreviewStyle()">
									<p class="text-sm font-semibold text-canvas-fg">Rounded frame</p>
									<p class="mt-1 text-sm text-muted-fg">Uses the same radius scale as components.</p>
								</div>
								<div class="grid grid-cols-3 gap-2">
									<span class="h-12 rounded-sm border border-border bg-secondary"></span>
									<span class="h-12 rounded-lg border border-border bg-secondary"></span>
									<span class="h-12 rounded-3xl border border-border bg-secondary"></span>
								</div>
							</div>
						</div>
					</div>
					<section class="rounded-2xl border border-border skin-card p-4 text-canvas-fg">
						<div>
							<p class="text-sm font-semibold text-canvas-fg">Skin recipes</p>
							<p class="mt-1 text-sm text-muted-fg">These Tailwind-like utilities carry material, border, shadow, blur, and gradient from variables.</p>
						</div>
						<div class="mt-4 grid gap-4 2xl:grid-cols-2">
							<article
								v-for="level in skinLevels"
								:key="level.name"
								class="rounded-xl border border-border bg-canvas p-3"
							>
								<div
									class="min-h-24 rounded-xl p-4"
									:class="level.className"
									:style="skinPreviewStyle(level)"
								>
									<p class="text-sm font-semibold">{{ level.label }}</p>
									<p class="mt-1 text-xs opacity-75">{{ level.className }}</p>
								</div>
								<p class="mt-3 text-xs leading-5 text-muted-fg">{{ level.use }}</p>
								<CssComponentEditor
									class="mt-3"
									:style="skinStyleStates[level.name]"
									:variables="skinCssVariables(level.name)"
									:title="level.label"
								/>
							</article>
						</div>
					</section>
				</div>

				<div class="grid gap-4 xl:grid-cols-2">
					<div
						v-for="mode in themeModes"
						:key="mode.value"
						class="relative rounded-2xl border border-border skin-card text-canvas-fg"
						:data-theme="mode.value"
						:style="themeColumnStyle(mode.value)"
					>
						<div class="flex items-center justify-between gap-3 border-b border-border bg-secondary/45 px-4 py-3">
							<div>
								<p class="text-sm font-semibold text-canvas-fg">{{ mode.label }} mode</p>
								<p class="text-xs text-muted-fg">{{ mode.selector }}</p>
							</div>
							<button
								type="button"
								class="rounded-full border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-canvas-fg transition-colors hover:bg-secondary"
								@click="setEditorMode(mode.value)"
							>
								Preview
							</button>
						</div>
						<div class="divide-y divide-border">
							<section v-for="group in editorTokenGroups" :key="group.label">
								<div class="bg-secondary/30 px-4 py-3">
									<div class="flex items-center justify-between gap-3">
										<div class="min-w-0">
											<p class="truncate text-sm font-semibold text-canvas-fg">{{ group.label }}</p>
											<p class="mt-0.5 line-clamp-2 text-xs text-muted-fg">{{ group.description }}</p>
										</div>
										<DomPopover
											v-if="hasGroupPairPreview(group)"
											position="bottom-end"
											width="w-64"
											padding="p-3"
											:collision-padding="12"
											:aria-label="`Edit ${group.label} ${mode.value} colors`"
										>
											<template #trigger>
												<button
													type="button"
													class="grid h-10 w-16 shrink-0 place-items-center rounded-lg border border-border text-sm font-semibold shadow-sm transition-shadow hover:ring-2 hover:ring-ring/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
													:style="groupPairPreviewStyle(mode.value, group)"
													:title="`${group.label} bg and fg preview`"
													:aria-label="`Edit ${group.label} ${mode.value} colors`"
												>
													Aa
												</button>
											</template>
											<div>
												<div>
													<p class="text-sm font-semibold">{{ group.label }}</p>
													<p class="mt-0.5 line-clamp-2 text-xs text-muted-fg">{{ group.description }}</p>
												</div>
												<div class="mt-3 grid gap-2">
													<label
														v-for="token in groupPairTokens(group)"
														:key="token.name"
														class="relative grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg border border-border bg-canvas px-2.5 py-2 transition-colors hover:border-ring"
													>
														<span
															class="size-6 rounded-md border border-border shadow-sm"
															:style="tokenSwatchStyle(mode.value, token.name)"
														></span>
														<span class="block truncate font-mono text-xs">{{ token.name }}</span>
														<input
															type="color"
															class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
															:value="tokenHex(mode.value, token.name)"
															:aria-label="`${token.label} ${mode.value} color`"
															@focus="activeTokenName = token.name"
															@input="updateColorToken(mode.value, token.name, $event.target.value)"
														/>
													</label>
												</div>
											</div>
										</DomPopover>
										<div v-else class="flex shrink-0 overflow-hidden rounded-lg border border-border">
											<span
												v-for="token in group.tokens"
												:key="token.name"
												class="size-6 border-l border-border first:border-l-0"
												:style="tokenSwatchStyle(mode.value, token.name)"
											></span>
										</div>
									</div>
								</div>
								<div v-if="!hasGroupPairPreview(group)" class="divide-y divide-border">
									<label
										v-for="token in group.tokens"
										:key="token.name"
										class="relative flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/60"
										:class="isActiveToken(token.name) && 'bg-accent text-accent-fg hover:bg-accent'"
									>
										<span
											class="grid size-10 shrink-0 place-items-center rounded-lg border border-border text-[11px] font-semibold shadow-sm"
											:style="pairedTokenSwatchStyle(mode.value, token.name)"
										>
											{{ tokenSwatchLabel(token.name) }}
										</span>
										<span class="min-w-0 flex-1">
											<span class="flex flex-wrap items-center gap-2">
												<span class="truncate text-sm font-medium">{{ token.label }}</span>
												<span class="rounded-full bg-canvas/70 px-2 py-0.5 text-[11px] font-medium text-muted-fg ring-1 ring-border">{{ token.role }}</span>
											</span>
											<span class="mt-0.5 block truncate font-mono text-xs opacity-70">{{ token.name }}: {{ tokenOklch(mode.value, token.name) }}</span>
										</span>
										<span class="font-mono text-xs opacity-70">{{ tokenHex(mode.value, token.name) }}</span>
										<input
											type="color"
											class="absolute inset-y-0 left-4 my-auto size-10 cursor-pointer opacity-0"
											:value="tokenHex(mode.value, token.name)"
											:aria-label="`${token.label} ${mode.value} color`"
											@focus="activeTokenName = token.name"
											@input="updateColorToken(mode.value, token.name, $event.target.value)"
										/>
									</label>
								</div>
							</section>
						</div>
					</div>
				</div>

				<CodeBlock lang="css" :code="themeEditorCode" :default-open="false" />
			</DocSection>

			<DocSection eyebrow="Tokens" title="Palette and pairs">
				<div class="grid gap-4 md:grid-cols-2">
					<article
						v-for="pair in tokenPairs"
						:key="pair.name"
						class="overflow-hidden rounded-2xl border border-border skin-card text-canvas-fg"
					>
						<div class="flex min-h-28 items-end p-4" :style="swatchStyle(pair)">
							<div>
								<p class="text-lg font-semibold">{{ pair.name }}</p>
								<p class="font-mono text-xs opacity-80">{{ pair.utilities }}</p>
							</div>
						</div>
						<div class="space-y-3 p-4">
							<p class="text-sm text-muted-fg">{{ pair.use }}</p>
							<div class="grid gap-2 text-xs">
								<div class="flex items-center justify-between gap-3">
									<span class="text-muted-fg">Bg</span>
									<label class="relative flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-secondary">
										<code class="font-mono text-canvas-fg">{{ pair.bg }}</code>
										<span
											class="size-3 rounded-full ring-1 ring-border"
											:style="variableSwatchStyle(pair.bg)"
										></span>
										<input
											type="color"
											class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
											:value="tokenHex(activeMode, pair.bg)"
											:aria-label="`Edit ${pair.name} bg ${activeMode} color`"
											@focus="activeTokenName = pair.bg"
											@input="updateColorToken(activeMode, pair.bg, $event.target.value)"
										/>
									</label>
								</div>
								<div class="flex items-center justify-between gap-3">
									<span class="text-muted-fg">Fg</span>
									<label class="relative flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-secondary">
										<code class="font-mono text-canvas-fg">{{ pair.fg }}</code>
										<span
											class="size-3 rounded-full ring-1 ring-border"
											:style="variableSwatchStyle(pair.fg)"
										></span>
										<input
											type="color"
											class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
											:value="tokenHex(activeMode, pair.fg)"
											:aria-label="`Edit ${pair.name} fg ${activeMode} color`"
											@focus="activeTokenName = pair.fg"
											@input="updateColorToken(activeMode, pair.fg, $event.target.value)"
										/>
									</label>
								</div>
							</div>
						</div>
					</article>
				</div>

				<div class="mt-4 grid gap-4 md:grid-cols-3">
					<article
						v-for="token in utilityTokens"
						:key="token.name"
						class="rounded-2xl border border-border skin-card p-4 text-canvas-fg"
					>
						<div class="flex items-center gap-3">
							<span class="size-10 rounded-xl ring-1 ring-border" :style="utilitySwatchStyle(token)"></span>
							<div>
								<p class="font-semibold">{{ token.name }}</p>
								<code class="font-mono text-xs text-muted-fg">{{ token.token }}</code>
							</div>
						</div>
						<p class="mt-3 text-sm text-muted-fg">{{ token.use }}</p>
						<p class="mt-3 rounded-lg bg-secondary px-2 py-1 font-mono text-xs text-muted-fg">{{ token.utility }}</p>
					</article>
				</div>
			</DocSection>

			<DocSection eyebrow="Decision guide" title="Which token should I use?">
				<div class="overflow-x-auto overflow-y-hidden rounded-2xl border border-border">
					<table class="w-full min-w-[42rem] text-left text-sm">
						<thead class="bg-secondary text-xs uppercase tracking-[0.14em] text-muted-fg">
							<tr>
								<th class="px-4 py-3 font-semibold">Intent</th>
								<th class="px-4 py-3 font-semibold">Utility</th>
								<th class="px-4 py-3 font-semibold">Rule of thumb</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border bg-canvas">
							<tr v-for="row in decisionRows" :key="row[0]">
								<td class="px-4 py-3 font-medium text-canvas-fg">{{ row[0] }}</td>
								<td class="px-4 py-3"><code class="font-mono text-xs text-muted-fg">{{ row[1] }}</code></td>
								<td class="px-4 py-3 text-muted-fg">{{ row[2] }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</DocSection>

			<DocSection eyebrow="Code" title="Define and consume tokens">
				<div class="grid gap-4 lg:grid-cols-2">
					<CodeBlock lang="css" :code="themeCode" />
					<CodeBlock lang="html" :code="usageCode" />
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
