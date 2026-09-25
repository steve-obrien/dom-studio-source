<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import InspectorLayout from '../_layout/InspectorLayout.vue';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import ThemeStage from './ThemeStage.vue';
import { serializeThemeCss } from './lib/themeExport.js';
import { clamp, expandHex, hexToOklch, oklchToHex, rgbToHex } from '../lib/css/color.js';
import DocSection from '../_layout/DocSection.vue';
import CodeBlock from '../_layout/CodeBlock.vue';
import { DomButton } from '../lib/vue';
import CssComponentEditor from '../experiments/css-button-creator/components/CssComponentEditor.vue';
import {
	createCssComponentStyle,
	cssStyleValues,
	parseBackdropValue,
	replaceCssComponentStyle,
} from '../experiments/css-button-creator/lib/styleModel.js';

const route = useRoute();
const isThemeEditor = computed(() => route.path === '/theming/editor');
const quickThemeInstall = `import '@getdom/studio/style.css';`;
const ownedThemeInstall = `/* src/app.css */
@import "tailwindcss";
@import "@getdom/studio/tailwind.css";

/* Add your light and dark semantic theme variables below these imports. */`;
const themeUsage = `<script setup>
import { DomButton, DomCard } from '@getdom/studio/vue';
<\/script>

<template>
	<DomCard class="space-y-4 p-6">
		<p class="text-muted-fg">Components consume your semantic theme tokens.</p>
		<DomButton>Continue</DomButton>
	</DomCard>
</template>`;

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
		bg: 'var(--canvas)',
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

/**
 * Creates independent palettes and material defaults for a fresh theme draft.
 *
 * @returns {object}
 */
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

/**
 * Clones the default values for every shared skin.
 *
 * @returns {object}
 */
function createSkinDefaults() {
	return Object.fromEntries(skinLevels.map((level) => [
		level.name,
		{ ...skinTokenDefaults[level.name] },
	]));
}

/**
 * Creates editable material-layer models for each skin.
 *
 * @param {object} skins Initial skin values.
 * @returns {object}
 */
function createSkinStyleStates(skins = createSkinDefaults()) {
	return Object.fromEntries(skinLevels.map((level) => [
		level.name,
		createSkinStyleState(level.name, skins[level.name]),
	]));
}

/**
 * Translates a skin recipe into the surface, border, effect and layer editor model.
 *
 * @param {string} levelName Known skin name.
 * @param {object} values Initial CSS values.
 * @returns {object}
 */
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

/**
 * Restores the browser-session draft and fills any newly introduced defaults.
 *
 * @returns {object}
 */
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

	// Migrate the previous shared draft once, keeping the two layer models independent.
	state.skinStylesByMode ??= Object.fromEntries(themeModes.map((mode) => [
		mode.value,
		createSkinStyleStates(state.skins),
	]));

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
const skinStyleStatesByMode = reactive(themeEditorState.skinStylesByMode);
const activeMode = ref('light');
const skinStyleStates = computed(() => skinStyleStatesByMode[activeMode.value]);
const skinValues = computed(() => Object.fromEntries(themeModes.map((mode) => [
	mode.value,
	Object.fromEntries(skinLevels.map((level) => [level.name, cssStyleValues(skinStyleStatesByMode[mode.value][level.name])])),
])));
const inspectorTab = ref('theme');
const selectedSkin = ref('card');
const workspaceView = ref('canvas');
const mobilePanel = ref('canvas');
const previewWidth = ref('desktop');
const zoom = ref('100');
const copyStatus = ref('');
const activePreset = ref('neutral');
const selectedSkinLevel = computed(() => skinLevels.find((level) => level.name === selectedSkin.value));
const presets = [
	{ name: 'Neutral', value: 'neutral', color: '#171717' },
	{ name: 'Ocean', value: 'blue', color: '#1d5ed2' },
	{ name: 'Forest', value: 'green', color: '#258246' },
	{ name: 'Rose', value: 'rose', color: '#c63a70' },
];
const aiThemePrompt = ref('');
const aiThemeStatus = ref('');
const isGeneratingTheme = ref(false);
const generatedThemeName = ref('dom-studio-theme');
const themeAiEndpoint = import.meta.env.VITE_THEME_AI_ENDPOINT || '/api/ai/theme';
const themeAiPublicToken = import.meta.env.VITE_THEME_AI_PUBLIC_TOKEN || '';

const themeEditorCode = computed(getThemeEditorCode);

/**
 * Collects the normalized variables for one skin mode.
 *
 * @param {'light'|'dark'} mode Palette and material mode.
 * @returns {Record<string, string>} Flat CSS custom-property map.
 */
function skinVariablesForMode(mode) {
	return Object.fromEntries(editableSkinTokens.map((token) => [token.name, skinCssValue(token.level, token.property, mode)]));
}

/**
 * Produces matching preview/export values with dark overrides scoped explicitly.
 *
 * @returns {string} Complete light and dark CSS source.
 */
function getThemeEditorCode() {
	return serializeThemeCss({
		appearance: Object.fromEntries(editableAppearanceTokens.map((token) => [token.name, appearanceCssValue(token.name)])),
		colors: Object.fromEntries(themeModes.map((mode) => [
			mode.value,
			Object.fromEntries(editableColorTokens.map((token) => [token.name, hexToOklch(tokenHexValues[mode.value][token.name])])),
		])),
		skins: Object.fromEntries(themeModes.map((mode) => [mode.value, skinVariablesForMode(mode.value)])),
		skinDefaults: Object.fromEntries(editableSkinTokens.map((token) => [token.name, skinTokenDefaults[token.level][token.property.key]])),
	});
}

/**
 * Resolves a material property to its public CSS custom-property name.
 *
 * @param {string} levelName Skin name.
 * @param {object} property Skin property definition.
 * @returns {string}
 */
function skinTokenName(levelName, property) {
	return `--skin-${levelName}-${property.suffix}`;
}

/**
 * Maps material-editor properties to their corresponding CSS variables.
 *
 * @param {string} levelName Skin name.
 * @returns {object}
 */
function skinCssVariables(levelName) {
	return Object.fromEntries(skinPropertyDefinitions.map((property) => [
		property.key,
		skinTokenName(levelName, property),
	]));
}

/**
 * Reads a draft skin value with the default recipe as fallback.
 *
 * @param {string} levelName Skin name.
 * @param {object} property Skin property definition.
 * @param {'light'|'dark'} mode Material mode, defaulting to the active preview.
 * @returns {string}
 */
function skinValue(levelName, property, mode = activeMode.value) {
	return skinValues.value[mode][levelName]?.[property.key] ?? skinTokenDefaults[levelName][property.key];
}

/**
 * Normalizes a draft skin value for safe preview and CSS export.
 *
 * @param {string} levelName Skin name.
 * @param {object} property Skin property definition.
 * @param {'light'|'dark'} mode Material mode, defaulting to the active preview.
 * @returns {string}
 */
function skinCssValue(levelName, property, mode = activeMode.value) {
	const value = normalizeSkinValue(property, skinValue(levelName, property, mode));
	// Keep default recipes as variable references so dark shadow tokens still resolve locally.
	if (!value || value === defaultSkinStyleValues[levelName]?.[property.key]) return skinTokenDefaults[levelName][property.key];
	return value;
}



/**
 * Restores every material editor to its default recipe.
 *
 * @returns {void}
 */
function resetSkinStyleBuilders() {
	for (const mode of themeModes) {
		for (const level of skinLevels) {
			replaceCssComponentStyle(skinStyleStatesByMode[mode.value][level.name], createSkinStyleState(level.name, skinTokenDefaults[level.name]));
		}
	}
}

/**
 * Applies supported surface, border and backdrop values to a material editor.
 *
 * @param {string} levelName Skin name.
 * @param {object} values Incoming CSS values.
 * @param {'light'|'dark'} mode Material mode to update.
 * @returns {void}
 */
function updateSkinStyleStateFromValues(levelName, values = {}, mode = activeMode.value) {
	const style = skinStyleStatesByMode[mode][levelName];
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

/**
 * Commits a valid hex colour to the selected preview mode without changing the site theme.
 *
 * @param {string} mode Light or dark palette.
 * @param {string} name Semantic CSS custom property.
 * @param {string} value User-entered hex colour.
 * @returns {void}
 */
function updateColorToken(mode, name, value) {
	if (!/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value)) return;
	tokenHexValues[mode][name] = expandHex(value);
	activePreset.value = '';
}

/**
 * Previews a complete hex entry immediately while allowing partial typing.
 *
 * @param {string} mode Palette being edited.
 * @param {string} name Semantic token name.
 * @param {Event} event Native input event.
 * @returns {void}
 */
function previewHexInput(mode, name, event) {
	const value = event.target.value.trim().replace(/^#/, '');
	if (/^[0-9a-f]{6}$/i.test(value)) updateColorToken(mode, name, `#${value}`);
}

/**
 * Commits a text colour entry and restores the canonical value if it is invalid.
 *
 * @param {string} mode Palette being edited.
 * @param {string} name Semantic token name.
 * @param {Event} event Native text-field change event.
 * @returns {void}
 */
function commitHexInput(mode, name, event) {
	const value = event.target.value.trim();
	updateColorToken(mode, name, value.startsWith('#') ? value : `#${value}`);
	event.target.value = tokenHex(mode, name).slice(1).toUpperCase();
}

/**
 * Changes the mode being previewed and edited, preserving both palettes.
 *
 * @param {string} mode The requested light or dark mode.
 * @returns {void}
 */
function setEditorMode(mode) {
	activeMode.value = mode;
}

/**
 * Restores both palettes, shared corners and materials without changing preview mode.
 *
 * @returns {void}
 */
function resetColorTokens() {
	for (const mode of themeModes) {
		for (const token of editableColorTokens) {
			tokenHexValues[mode.value][token.name] = oklchToHex(themeTokenDefaults[mode.value][token.name]);
		}
	}
	for (const token of editableAppearanceTokens) {
		appearanceValues[token.name] = appearanceTokenDefaults[token.name];
	}
	resetSkinStyleBuilders();
	activePreset.value = 'neutral';
	generatedThemeName.value = 'dom-studio-theme';
	aiThemeStatus.value = '';
}


/**
 * Reads the initial host radius and material variables without mutating the document.
 *
 * @returns {void}
 */
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
		for (const mode of themeModes) {
			updateSkinStyleStateFromValues(token.level, {
				[token.property.key]: normalizeSkinValue(token.property, value) || skinTokenDefaults[token.level][token.property.key],
			}, mode.value);
		}
	}
}

/**
 * Reads the hex colour for a semantic token in one palette.
 *
 * @param {string} mode Palette name.
 * @param {string} name CSS custom property.
 * @returns {string}
 */
function tokenHex(mode, name) {
	return tokenHexValues[mode][name];
}

/**
 * Normalizes and stores a shared appearance control value.
 *
 * @param {object} token Appearance definition.
 * @param {string|number} value Input value.
 * @returns {void}
 */
function updateAppearanceToken(token, value) {
	appearanceValues[token.name] = formatAppearanceInputValue(token, value);
}

/**
 * Converts an appearance value into the native control representation.
 *
 * @param {object} token Appearance definition.
 * @returns {string|number}
 */
function appearanceInputValue(token) {
	const value = appearanceValues[token.name];
	if (token.type === 'color') return value;
	return Number.parseFloat(value) || 0;
}

/**
 * Reads a normalized appearance CSS value.
 *
 * @param {string} name CSS custom property.
 * @returns {string}
 */
function appearanceCssValue(name) {
	const value = appearanceValues[name];
	return value;
}

/**
 * Serializes the current draft for the existing theme-generation endpoint.
 *
 * @returns {object}
 */
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

/**
 * Requests a theme from the configured endpoint and reports loading or failure state.
 *
 * @returns {Promise<void>}
 */
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

/**
 * Applies a local theme mix from the optional direction prompt.
 *
 * @returns {void}
 */
function generateRandomTheme() {
	const theme = createLocalTheme(aiThemePrompt.value);
	applyThemePayload(theme);
	rememberGeneratedTheme(theme);
	aiThemeStatus.value = theme.name;
}

/**
 * Updates the draft title after applying a generated theme.
 *
 * @param {object} theme Applied theme payload.
 * @returns {void}
 */
function rememberGeneratedTheme(theme) {
	generatedThemeName.value = theme?.name || 'dom-studio-theme';
	activePreset.value = '';
}

/**
 * Downloads the current manual or generated draft as a CSS file.
 *
 * @returns {void}
 */
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

/**
 * Converts a draft title into a safe, nonempty download filename.
 *
 * @param {string} value Draft title.
 * @returns {string}
 */
function slugifyThemeName(value) {
	const slug = String(value || '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return slug || 'dom-studio-theme';
}

/**
 * Applies supported generated tokens while preserving editor-owned shadow and fill layers.
 *
 * @param {object} theme Incoming theme payload.
 * @returns {void}
 */
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
		for (const mode of themeModes) updateSkinStyleStateFromValues(level.name, values, mode.value);
	}
	for (const mode of themeModes) {
		const source = theme[mode.value] || {};
		for (const token of editableColorTokens) {
			const value = source[token.name];
			if (!value) continue;
			tokenHexValues[mode.value][token.name] = normalizeThemeColor(value);
		}
	}
}

/**
 * Identifies material values maintained by the dedicated layer editors.
 *
 * @param {object} property Skin property definition.
 * @returns {boolean}
 */
function isBuilderOwnedSkinToken(property) {
	return property.key === 'shadow' || property.key === 'bgImage';
}

/**
 * Converts an incoming appearance value into its bounded CSS representation.
 *
 * @param {object} token Appearance definition.
 * @param {string|number} value Incoming value.
 * @returns {string}
 */
function normalizeAppearanceValue(token, value) {
	if (token.type === 'color') return normalizeThemeColor(value);
	return formatAppearanceInputValue(token, Number.parseFloat(value));
}

/**
 * Validates a supported CSS material value and rejects malformed or external-resource input.
 *
 * @param {object} property Skin property definition.
 * @param {unknown} value Incoming CSS value.
 * @returns {string}
 */
function normalizeSkinValue(property, value) {
	const raw = String(value ?? '').trim();
	if (!raw || raw.length > property.maxLength || /[;{}@]/.test(raw) || /\burl\s*\(/i.test(raw)) return '';
	if (property.key === 'borderWidth') {
		return /^(0|[0-5](?:\.\d+)?px|6(?:\.0+)?px)$/i.test(raw) ? raw : '';
	}
	if (property.key === 'borderStyle') {
		return skinBorderStyleOptions.includes(raw) ? raw : '';
	}
	return raw;
}

/**
 * Clamps and formats an appearance control value with the expected CSS unit.
 *
 * @param {object} token Appearance definition.
 * @param {string|number} value Input value.
 * @returns {string}
 */
function formatAppearanceInputValue(token, value) {
	if (token.type === 'color') return normalizeThemeColor(value);
	const number = clamp(Number.parseFloat(value) || 0, token.min, token.max);
	const rounded = Number(number.toFixed(3)).toString();
	return `${rounded}${token.unit}`;
}

/**
 * Converts supported hex or OKLCH colours to the editor hex format.
 *
 * @param {unknown} value Incoming colour value.
 * @returns {string}
 */
function normalizeThemeColor(value) {
	const color = String(value).trim();
	if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) return expandHex(color);
	if (color.startsWith('oklch(')) return oklchToHex(color);
	return '#000000';
}

/**
 * Builds complementary light and dark palettes from a named or random hue.
 *
 * @param {string} prompt Optional theme direction.
 * @returns {object}
 */
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
		name: 'Custom theme',
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

/**
 * Selects a shared corner radius from the local theme direction.
 *
 * @param {string} prompt Optional theme direction.
 * @returns {object}
 */
function createLocalAppearance(prompt = '') {
	const lower = prompt.toLowerCase();
	const sharp = /\b(sharp|square|brutalist|flat corners)\b/i.test(lower);
	const round = /\b(round|rounded|soft|pill|friendly)\b/i.test(lower);

	return {
		'--radius': `${sharp ? 0.125 : round ? 0.95 : 0.625}rem`,
	};
}

/**
 * Builds material recipes from the local theme direction.
 *
 * @param {string} prompt Optional theme direction.
 * @returns {object}
 */
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
			bg: glass ? 'color-mix(in oklch, var(--canvas) 70%, transparent)' : skinTokenDefaults.control.bg,
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

/**
 * Resolves a named hue from the prompt, falling back to a random hue.
 *
 * @param {string} prompt Optional theme direction.
 * @returns {number}
 */
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

/**
 * Chooses a light or dark foreground for a locally generated colour.
 *
 * @param {number} hue Hue in degrees.
 * @param {number} saturation Saturation percentage.
 * @param {number} lightness Lightness percentage.
 * @returns {string}
 */
function contrastText(hue, saturation, lightness) {
	return lightness > 56 ? hslToHex(hue, saturation, 10) : '#ffffff';
}

/**
 * Converts an HSL colour to a six-digit hex value.
 *
 * @param {number} hue Hue in degrees.
 * @param {number} saturation Saturation percentage.
 * @param {number} lightness Lightness percentage.
 * @returns {string}
 */
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

/**
 * Builds the complete token scope for the preview. Skin references are declared
 * alongside their palette so inherited var() values resolve inside the stage.
 *
 * @returns {Record<string, string>} Preview-only CSS custom properties.
 */
function getPreviewStyle() {
	return {
		colorScheme: activeMode.value,
		...Object.fromEntries(editableColorTokens.map((token) => [token.name, tokenHexValues[activeMode.value][token.name]])),
		...Object.fromEntries(editableAppearanceTokens.map((token) => [token.name, appearanceCssValue(token.name)])),
		...skinVariablesForMode(activeMode.value),
	};
}

const previewStyle = computed(getPreviewStyle);

/**
 * Applies a named starting palette, resetting previous material overrides first.
 *
 * @param {{name: string, value: string}} preset Selected starting theme.
 * @returns {void}
 */
function applyPreset(preset) {
	resetColorTokens();
	if (preset.value !== 'neutral') applyThemePayload(createLocalTheme(preset.value));
	activePreset.value = preset.value;
	generatedThemeName.value = preset.value === 'neutral' ? 'dom-studio-theme' : `${preset.name} theme`;
}

/**
 * Connects a selected stage specimen to its matching skin inspector.
 *
 * @param {string} name Existing skin name.
 * @returns {void}
 */
function inspectSkin(name) {
	selectedSkin.value = name;
	inspectorTab.value = 'skins';
	mobilePanel.value = 'theme';
}

/**
 * Copies the current light/dark CSS with explicit success and failure feedback.
 *
 * @returns {Promise<void>} Resolves after the clipboard request finishes.
 */
async function copyThemeCss() {
	try {
		await navigator.clipboard.writeText(`${themeEditorCode.value}\n`);
		copyStatus.value = 'Copied CSS';
	} catch {
		copyStatus.value = 'Copy unavailable. Select the CSS below or download it.';
	}
}

/**
 * Initializes material defaults from the host stylesheet on the first visit.
 * Existing drafts remain intact when navigating back to the workspace.
 *
 * @returns {void}
 */
function initializeEditor() {
	if (!isThemeEditor.value) return;
	if (themeEditorState.initialized) return;
	hydrateAppearanceFromDocument();
	themeEditorState.initialized = true;
}

onMounted(initializeEditor);
</script>

<template>
	<DomStudioLayout v-if="!isThemeEditor">
		<DocPage
			name="Theming"
			eyebrow="Documentation"
			tag="CSS variables"
			tagline="Install a default theme in one import, or own the semantic tokens that style every DOM Studio component."
		>
			<DocSection eyebrow="Quick start" title="Install the default theme">
				<p class="mb-4 max-w-2xl text-sm leading-6 text-muted-fg">
					For the fastest working render, import the complete stylesheet once in your Vue application entry file. It includes Tailwind, component integration, and DOM Studio's default light and dark themes.
				</p>
				<CodeBlock lang="js" :code="quickThemeInstall" />
			</DocSection>

			<DocSection eyebrow="Production setup" title="Move the theme into your app">
				<p class="mb-4 max-w-2xl text-sm leading-6 text-muted-fg">
					Import the Tailwind integration from your application stylesheet, then define the semantic theme variables underneath it. Your app owns those values while DOM Studio components consume them.
				</p>
				<CodeBlock filename="src/app.css" lang="css" :code="ownedThemeInstall" />
			</DocSection>

			<DocSection eyebrow="How it works" title="Semantic tokens, not component overrides">
				<div class="mb-6 max-w-3xl text-sm leading-6 text-muted-fg">
					<p>
						Prefer shared variables such as <code>--primary</code>, <code>--canvas</code>, <code>--radius</code>, and the surface tokens when you want a consistent theme across the library. This keeps components aligned and makes light and dark modes easier to maintain.
					</p>
					<p class="mt-2">
						For a deliberate one-off, copy the component into your project and edit its Tailwind utilities directly. Component source remains yours to change when its structure or styling should differ from the wider system.
					</p>
				</div>
				<div class="grid gap-4 md:grid-cols-3">
					<div class="rounded-xl border border-border p-4">
						<p class="font-semibold text-canvas-fg">Colour roles</p>
						<p class="mt-1 text-sm leading-6 text-muted-fg">Tokens such as <code>--canvas</code>, <code>--primary</code>, <code>--muted</code>, and their foreground pairs keep contrast and meaning consistent.</p>
					</div>
					<div class="rounded-xl border border-border p-4">
						<p class="font-semibold text-canvas-fg">Light and dark modes</p>
						<p class="mt-1 text-sm leading-6 text-muted-fg">Define light values on <code>:root</code> and dark values on <code>[data-theme="dark"]</code>. Components switch without per-component changes.</p>
					</div>
					<div class="rounded-xl border border-border p-4">
						<p class="font-semibold text-canvas-fg">Shared surfaces</p>
						<p class="mt-1 text-sm leading-6 text-muted-fg">Radius, shadows, borders, inputs, controls, and overlays use the same theme contract throughout the library.</p>
					</div>
				</div>
				<CodeBlock class="mt-5" lang="vue" :code="themeUsage" />
			</DocSection>

			<DocSection eyebrow="Theme editor" title="Generate a theme against live components">
				<div class="max-w-2xl rounded-xl border border-primary/20 bg-primary/5 p-5">
					<p class="text-sm leading-6 text-muted-fg">
						Use the full-width editor to choose light and dark colours, adjust component surfaces, preview the result, and export the finished CSS. The editor keeps documentation navigation available from its collapsed sidebar button.
					</p>
					<RouterLink to="/theming/editor" class="mt-4 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg transition hover:opacity-90">
						Open theme editor
					</RouterLink>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>

	<InspectorLayout v-else>
		<div class="flex min-h-0 flex-1 flex-col [--editor-selection:var(--chart-1)]">
			<div class="flex shrink-0 border-b border-border p-1 lg:hidden" aria-label="Workspace panel">
				<button
					v-for="panel in ['canvas', 'theme']"
					:key="panel"
					type="button"
					class="flex-1 rounded-md px-3 py-2 text-xs font-medium capitalize focus-visible:outline-2 focus-visible:outline-ring"
					:class="mobilePanel === panel ? 'bg-secondary text-canvas-fg' : 'text-muted-fg'"
					:aria-pressed="mobilePanel === panel"
					@click="mobilePanel = panel"
				>
					{{ panel }}
				</button>
			</div>

			<div class="flex min-h-0 flex-1">
				<section
					class="min-h-0 min-w-0 flex-1 flex-col lg:flex"
					:class="mobilePanel === 'canvas' ? 'flex' : 'hidden'"
					aria-label="Component stage"
				>
					<div
						class="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border bg-canvas px-4"
					>
						<div class="flex gap-1" aria-label="Stage view">
							<button
								v-for="view in ['canvas', 'guide', 'css']"
								:key="view"
								type="button"
								class="rounded-md px-2.5 py-1.5 text-xs font-medium capitalize focus-visible:outline-2 focus-visible:outline-ring"
								:class="
									workspaceView === view
										? 'bg-secondary text-canvas-fg'
										: 'text-muted-fg hover:text-canvas-fg'
								"
								:aria-pressed="workspaceView === view"
								@click="workspaceView = view"
							>
								{{ view === 'canvas' ? 'Components' : view === 'css' ? 'CSS' : view }}
							</button>
						</div>
						<div class="flex items-center gap-2">
							<DomButton variant="ghost" size="sm" @click="resetColorTokens">Reset</DomButton>
							<DomButton size="sm" @click="downloadThemeCss">Export CSS</DomButton>
							<template v-if="workspaceView === 'canvas'">
								<select
									v-model="previewWidth"
									aria-label="Preview width"
									class="hidden max-w-28 rounded-md bg-transparent p-1.5 text-xs text-muted-fg focus-visible:outline-2 focus-visible:outline-ring sm:block"
								>
									<option value="desktop">Responsive</option>
									<option value="mobile">Mobile</option>
								</select>
								<select
									v-model="zoom"
									aria-label="Canvas zoom"
									class="rounded-md bg-transparent p-1.5 text-xs text-muted-fg focus-visible:outline-2 focus-visible:outline-ring"
								>
									<option value="75">75%</option>
									<option value="100">100%</option>
									<option value="125">125%</option>
								</select>
							</template>
						</div>
					</div>

					<div
						v-show="workspaceView === 'canvas'"
						class="min-h-0 flex-1 overflow-auto bg-secondary/70 bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-size-[16px_16px] p-4 sm:p-8 lg:p-10"
						tabindex="0"
						aria-label="Scrollable component canvas"
					>
						<div
							class="mx-auto transition-[max-width] duration-200"
							:class="previewWidth === 'mobile' ? 'max-w-95' : 'max-w-200'"
							:style="{ zoom: Number(zoom) / 100 }"
						>
							<div class="mb-3 flex items-center justify-between text-[11px] text-muted-fg">
								<span>
									Components
									<span class="mx-1 opacity-50">/</span>
									{{ activeMode === 'light' ? 'Light' : 'Dark' }}
								</span>
								<span>{{ previewWidth === 'mobile' ? 'Mobile' : 'Responsive' }}</span>
							</div>
							<ThemeStage
								:style="previewStyle"
								:data-theme="activeMode"
								class="border border-border shadow-md"
								:selected-skin="inspectorTab === 'skins' ? selectedSkin : ''"
								@inspect="inspectSkin"
							/>
						</div>
					</div>

					<div
						v-if="workspaceView === 'css'"
						class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5 sm:p-8"
					>
						<div class="flex items-start justify-between gap-4">
							<div>
								<h2 class="text-lg font-semibold">Your theme CSS</h2>
								<p class="mt-1 text-xs leading-5 text-muted-fg">
									Light and dark colours and skins, with shared corners. Add this after DOM Studio's
									styles.
								</p>
							</div>
							<DomButton variant="secondary" size="sm" @click="copyThemeCss">Copy CSS</DomButton>
						</div>
						<p v-if="copyStatus" role="status" class="text-xs text-muted-fg">{{ copyStatus }}</p>
						<CodeBlock
							:code="themeEditorCode"
							lang="css"
							filename="theme.css"
							aria-label="Exported theme CSS"
							tabindex="0"
							class="min-h-80 flex-1 focus-visible:outline-2 focus-visible:outline-ring"
						/>
					</div>

					<div v-if="workspaceView === 'guide'" class="min-h-0 flex-1 overflow-auto p-5 sm:p-8">
						<div class="mx-auto max-w-2xl space-y-8">
							<div>
								<h2 class="text-xl font-semibold">A small set of tokens. A whole interface.</h2>
								<p class="mt-3 text-sm leading-6 text-muted-fg">
									Choose a starting palette, edit its colours, then fine-tune component styles. Every
									change appears on the canvas.
								</p>
							</div>
							<DocSection title="Colours come in pairs">
								<p class="text-sm leading-6 text-muted-fg">
									Each background has a matching text colour. For example, primary buttons use
									<code>--primary</code>
									for the background and
									<code>--primary-fg</code>
									for text. Check both Light and Dark before exporting.
								</p>
							</DocSection>
							<DocSection title="Shared component styles">
								<p class="text-sm leading-6 text-muted-fg">
									Skins define the surface, border, shadow and effects for each component family.
									Select a component on the canvas to edit its skin. Corners and skins are shared by
									both colour modes.
								</p>
							</DocSection>
							<DocSection title="Which token should I use?">
								<dl class="divide-y divide-border">
									<div v-for="row in decisionRows" :key="row[0]" class="py-3">
										<dt class="text-xs font-semibold">{{ row[0] }}</dt>
										<dd class="mt-1 break-words font-mono text-xs text-muted-fg">{{ row[1] }}</dd>
										<dd class="mt-1 text-xs leading-5 text-muted-fg">{{ row[2] }}</dd>
									</div>
								</dl>
							</DocSection>
							<CodeBlock lang="html" :code="usageCode" />
						</div>
					</div>
					<div
						class="flex h-9 shrink-0 items-center justify-between gap-2 border-t border-border bg-canvas px-4 text-[10px] text-muted-fg"
					>
						<span>Click a component label to inspect its style</span>
						<span class="hidden sm:inline">Changes apply to the preview</span>
					</div>
				</section>

				<aside
					class="min-h-0 w-full shrink-0 flex-col bg-canvas lg:flex lg:w-80 lg:border-l lg:border-border xl:w-84"
					:class="mobilePanel === 'theme' ? 'flex' : 'hidden'"
					aria-label="Theme inspector"
				>
					<div
						class="flex h-12 shrink-0 items-center gap-4 border-b border-border px-4"
						aria-label="Inspector view"
					>
						<button
							v-for="tab in ['theme', 'skins']"
							:key="tab"
							type="button"
							class="h-full border-b-2 px-1 text-xs font-semibold capitalize focus-visible:outline-2 focus-visible:outline-ring"
							:class="
								inspectorTab === tab
									? 'border-canvas-fg text-canvas-fg'
									: 'border-transparent text-muted-fg'
							"
							:aria-pressed="inspectorTab === tab"
							@click="inspectorTab = tab"
						>
							{{ tab }}
						</button>
					</div>
					<div class="shrink-0 border-b border-border p-4">
						<div class="mb-3 flex items-center justify-between">
							<h2 class="text-xs font-semibold">Appearance</h2>
							<span class="text-[10px] text-muted-fg">Editing {{ activeMode }}</span>
						</div>
						<div class="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1" aria-label="Theme mode">
							<button
								v-for="mode in themeModes"
								:key="mode.value"
								type="button"
								class="rounded-md px-3 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-ring"
								:class="
									activeMode === mode.value
										? 'bg-canvas text-canvas-fg shadow-xs'
										: 'text-muted-fg'
								"
								:aria-pressed="activeMode === mode.value"
								@click="setEditorMode(mode.value)"
							>
								{{ mode.label }}
							</button>
						</div>
					</div>
					<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
						<template v-if="inspectorTab === 'theme'">
							<section class="border-b border-border p-4">
								<h3 class="mb-3 text-xs font-semibold">Starting point</h3>
								<div class="grid grid-cols-4 gap-2">
									<button
										v-for="preset in presets"
										:key="preset.value"
										type="button"
										class="flex flex-col items-center gap-2 rounded-lg border px-1 py-2.5 text-[10px] focus-visible:outline-2 focus-visible:outline-ring"
										:class="
											activePreset === preset.value
												? 'border-canvas-fg bg-secondary/50'
												: 'border-border hover:bg-secondary'
										"
										:aria-pressed="activePreset === preset.value"
										@click="applyPreset(preset)"
									>
										<span
											class="size-5 rounded-full border border-border/20"
											:style="{ backgroundColor: preset.color }"
										></span>
										{{ preset.name }}
									</button>
								</div>
							</section>

							<section class="border-b border-border p-4">
								<div class="mb-3 flex items-center justify-between">
									<h3 class="text-xs font-semibold">Colours</h3>
									<div class="grid w-39 grid-cols-2 gap-2 text-center text-[10px] text-muted-fg">
										<span>Fill</span>
										<span>Text</span>
									</div>
								</div>
								<div class="space-y-2">
									<div
										v-for="pair in tokenPairs"
										:key="pair.bg"
										class="flex items-center justify-between gap-2"
									>
										<span class="text-xs" :title="pair.use">
											{{ pair.name === 'Background' ? 'Canvas' : pair.name }}
										</span>
										<div class="grid w-39 shrink-0 grid-cols-2 gap-2">
											<div
												v-for="(name, index) in [pair.bg, pair.fg]"
												:key="name"
												class="flex h-8 min-w-0 items-center gap-1 rounded-md border border-border px-1.5 focus-within:ring-1 focus-within:ring-ring"
											>
												<label
													class="relative size-4 shrink-0 overflow-hidden rounded-sm border border-border/50"
													:style="{ backgroundColor: tokenHex(activeMode, name) }"
												>
													<input
														type="color"
														:value="tokenHex(activeMode, name)"
														:aria-label="`${pair.name} ${index ? 'text' : 'fill'} colour`"
														class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
														@input="updateColorToken(activeMode, name, $event.target.value)"
													/>
												</label>
												<input
													:value="tokenHex(activeMode, name).slice(1).toUpperCase()"
													:aria-label="`${pair.name} ${index ? 'text' : 'fill'} hex`"
													maxlength="7"
													spellcheck="false"
													class="min-w-0 w-full bg-transparent font-mono text-[10px] uppercase outline-none"
													@input="previewHexInput(activeMode, name, $event)"
													@blur="commitHexInput(activeMode, name, $event)"
												/>
											</div>
										</div>
									</div>
								</div>
								<details class="mt-4 border-t border-border pt-3">
									<summary class="cursor-pointer text-xs font-medium">Borders & focus</summary>
									<div class="mt-3 space-y-2">
										<label
											v-for="token in utilityTokens"
											:key="token.token"
											class="flex items-center justify-between text-xs"
										>
											{{ token.name }}
											<input
												type="color"
												:value="tokenHex(activeMode, token.token)"
												:aria-label="`${token.name} colour`"
												class="h-7 w-16 cursor-pointer rounded border border-border bg-transparent"
												@input="updateColorToken(activeMode, token.token, $event.target.value)"
											/>
										</label>
									</div>
								</details>
							</section>

							<section class="border-b border-border p-4">
								<div class="mb-3 flex items-center justify-between">
									<h3 class="text-xs font-semibold">Corners</h3>
									<span class="text-[10px] text-muted-fg">Shared across modes</span>
								</div>
								<label
									v-for="token in editableAppearanceTokens"
									:key="token.name"
									class="flex items-center gap-4"
								>
									<input
										type="range"
										:min="token.min"
										:max="token.max"
										:step="token.step"
										:value="appearanceInputValue(token)"
										:aria-label="token.label"
										class="min-w-0 flex-1 accent-canvas-fg"
										@input="updateAppearanceToken(token, $event.target.value)"
									/>
									<span
										class="w-16 rounded-md border border-border px-2 py-1.5 text-right font-mono text-[10px]"
									>
										{{ appearanceValues[token.name] }}
									</span>
								</label>
							</section>

							<details class="p-4">
								<summary class="cursor-pointer text-xs font-semibold">Generate with AI</summary>
								<form class="mt-3 space-y-3" @submit.prevent="generateThemeWithAi">
									<label for="theme-ai-prompt" class="block text-xs text-muted-fg">
										Describe a direction
									</label>
									<textarea
										id="theme-ai-prompt"
										v-model="aiThemePrompt"
										rows="3"
										placeholder="Warm neutrals with a forest green accent…"
										class="w-full resize-y rounded-lg border border-input bg-canvas p-3 text-xs leading-5 focus-visible:outline-2 focus-visible:outline-ring"
									></textarea>
									<div class="flex gap-2">
										<DomButton type="submit" size="sm" :loading="isGeneratingTheme">
											Generate theme
										</DomButton>
										<DomButton
											type="button"
											variant="secondary"
											size="sm"
											:disabled="isGeneratingTheme"
											@click="generateRandomTheme"
										>
											Randomise
										</DomButton>
									</div>
									<p v-if="aiThemeStatus" role="status" class="text-xs leading-5 text-muted-fg">
										{{ aiThemeStatus }}
									</p>
								</form>
							</details>
						</template>

						<template v-else>
							<div class="border-b border-border p-4">
								<h3 class="mb-3 text-xs font-semibold">Component style</h3>
								<div class="grid grid-cols-3 gap-1.5">
									<button
										v-for="level in skinLevels"
										:key="level.name"
										type="button"
										class="rounded-md border px-2 py-2 text-[11px] focus-visible:outline-2 focus-visible:outline-ring"
										:class="
											selectedSkin === level.name
												? 'border-canvas-fg bg-secondary font-semibold'
												: 'border-border text-muted-fg hover:bg-secondary'
										"
										:aria-pressed="selectedSkin === level.name"
										@click="selectedSkin = level.name"
									>
										{{ level.label }}
									</button>
								</div>
								<p class="mt-3 text-xs leading-5 text-muted-fg">{{ selectedSkinLevel.use }}</p>
								<p class="mt-2 text-[10px] text-muted-fg">
									Editing {{ activeMode }} styles. The other mode stays unchanged.
								</p>
							</div>
							<CssComponentEditor
								:key="`${selectedSkin}-${activeMode}`"
								:framed="false"
								:color-variables="previewStyle"
								:style="skinStyleStates[selectedSkin]"
								:variables="skinCssVariables(selectedSkin)"
								:title="selectedSkinLevel.label"
							/>
						</template>
					</div>
					<div
						class="flex min-h-9 shrink-0 items-center border-t border-border px-4 py-2 text-[10px] text-muted-fg"
					>
						Export includes both light and dark themes
					</div>
				</aside>
			</div>
		</div>
	</InspectorLayout>
</template>
