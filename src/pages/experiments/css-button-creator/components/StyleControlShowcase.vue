<script setup>
import { computed, reactive } from 'vue';
import CssBackgroundControl from './CssBackgroundControl.vue';
import CssBoxShadowControl from './CssBoxShadowControl.vue';
import CssComponentEditor from './CssComponentEditor.vue';
import CssStylesEditor from './CssStylesEditor.vue';
import CssStyleControls from './CssStyleControls.vue';
import {
	createButtonState,
	createCssComponentStyle,
	createFill,
	createShadow,
	cssStyleToProperties,
	cssStyleToVariables,
	fillListToCss,
	shadowListToCss,
} from '../lib/styleModel.js';

const backgroundOpen = reactive({ control: true });
const shadowOpen = reactive({ control: true });
const backgroundDemo = reactive({
	enabled: true,
	fills: [
		createFill({
			kind: 'linear',
			gradientFrom: 'oklch(0.62 0.18 178)',
			gradientTo: 'oklch(0.51 0.2 262)',
			gradientAngle: 135,
		}),
		createFill({
			kind: 'radial',
			gradientFrom: '#ffffff',
			gradientFromAlpha: 28,
			gradientTo: '#ffffff',
			gradientToAlpha: 0,
			gradientFromStop: 0,
			gradientToStop: 66,
			open: false,
		}),
	],
});
const shadowDemo = reactive([
	createShadow({ kind: 'drop', color: 'oklch(0.38 0.12 252)', alpha: 28, x: 0, y: 18, blur: 42, spread: -16 }),
	createShadow({ kind: 'ring', color: 'oklch(0.74 0.16 180)', alpha: 34, spread: 3, open: false }),
]);
const fullButton = reactive(createButtonState({
	label: 'Preview styles',
	background: {
		fills: [
			{
				kind: 'linear',
				gradientFrom: '#111827',
				gradientTo: 'oklch(0.62 0.18 178)',
				gradientAngle: 135,
			},
		],
	},
	border: { color: 'oklch(0.72 0.12 180)' },
}));
const fullShadows = reactive([
	createShadow({ kind: 'drop', color: '#0f172a', alpha: 24, x: 0, y: 16, blur: 34, spread: -14 }),
	createShadow({ kind: 'ring', color: 'oklch(0.7 0.14 180)', alpha: 26, spread: 2, open: false }),
]);
const componentButtonStyle = reactive(createCssComponentStyle({
	surface: {
		bg: 'oklch(0.21 0.04 252)',
		fg: 'oklch(0.98 0.01 220)',
	},
	border: {
		color: 'oklch(0.72 0.12 180)',
		width: 1,
		style: 'solid',
	},
	background: {
		fills: [
			{
				kind: 'linear',
				gradientFrom: 'oklch(0.3 0.08 250)',
				gradientTo: 'oklch(0.62 0.18 178)',
				gradientAngle: 135,
			},
		],
	},
	shadows: [
		{ kind: 'drop', color: '#0f172a', alpha: 26, x: 0, y: 18, blur: 38, spread: -16 },
		{ kind: 'ring', color: 'oklch(0.7 0.14 180)', alpha: 26, spread: 2 },
	],
}));
const componentButtonVariables = {
	bg: '--button-bg',
	fg: '--button-fg',
	border: '--button-border',
	borderWidth: '--button-border-width',
	borderStyle: '--button-border-style',
	shadow: '--button-shadow',
	backdrop: '--button-backdrop',
	bgImage: '--button-bg-image',
};
let stylesEditorDemo = reactive({});
const stylesEditorInitial = {
	surface: {
		bg: 'oklch(0.18 0.04 250)',
		fg: 'oklch(0.98 0.01 220)',
	},
	border: {
		color: 'oklch(0.72 0.12 180)',
		width: 1,
		style: 'solid',
	},
	background: {
		fills: [
			{
				kind: 'linear',
				gradientFrom: 'oklch(0.26 0.08 250)',
				gradientTo: 'oklch(0.62 0.18 178)',
				gradientAngle: 135,
			},
		],
	},
	shadows: [
		{ kind: 'drop', color: '#0f172a', alpha: 28, x: 0, y: 18, blur: 38, spread: -16 },
	],
};
const stylesEditorVarmap = {
	background: '--my-background',
	color: '--my-color',
	border: '--my-border',
	boxShadow: '--my-shadow',
};

const backgroundPreviewStyle = computed(() => ({
	background: backgroundDemo.enabled ? fillListToCss(backgroundDemo.fills) : 'transparent',
}));
const shadowPreviewStyle = computed(() => ({
	boxShadow: shadowListToCss(shadowDemo),
}));
const fullButtonStyle = computed(() => ({
	padding: `${fullButton.layout.paddingY}px ${fullButton.layout.paddingX}px`,
	borderRadius: `${fullButton.layout.radius}px`,
	border: fullButton.border.enabled ? `${fullButton.border.width}px ${fullButton.border.style || 'solid'} ${fullButton.border.color}` : '0 solid transparent',
	background: fullButton.background.enabled ? fillListToCss(fullButton.background.fills) : 'transparent',
	boxShadow: shadowListToCss(fullShadows),
	color: fullButton.typography.textColor,
	fontSize: `${fullButton.typography.fontSize}px`,
	fontWeight: fullButton.typography.fontWeight,
	lineHeight: 1,
}));
const componentButtonPreviewStyle = computed(() => ({
	...cssStyleToProperties(componentButtonStyle),
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: '12px 22px',
	borderRadius: '999px',
	fontSize: '15px',
	fontWeight: 650,
	lineHeight: 1,
}));
const componentButtonCssVariables = computed(() => cssStyleToVariables(componentButtonStyle, componentButtonVariables));
const componentApiCode = `<CssComponentEditor
\t:style="buttonStyle"
\t:variables="{
\t\tbg: '--button-bg',
\t\tfg: '--button-fg',
\t\tborder: '--button-border',
\t\tborderWidth: '--button-border-width',
\t\tborderStyle: '--button-border-style',
\t\tshadow: '--button-shadow',
\t\tbackdrop: '--button-backdrop',
\t\tbgImage: '--button-bg-image',
\t}"
/>`;
const stylesEditorApiCode = `<script setup>
import { reactive } from 'vue';

let styles = reactive({})
<\/script>

<template>
\t<div :style="styles.styles">Results</div>
\t<pre>{{ styles.styles }}</pre>
\t<pre>{{ styles.vars }}</pre>
\t<CssStylesEditor
\t\tv-model="styles"
\t\t:varmap="{
\t\t\tbackground: '--my-background',
\t\t\tcolor: '--my-color',
\t\t\tborder: '--my-border',
\t\t\tboxShadow: '--my-shadow',
\t\t}"
\t/>
</template>`;

function formatCssVariableBlock(variables) {
	return `:root {\n${Object.entries(variables).map(([name, value]) => `\t${name}: ${value};`).join('\n')}\n}`;
}

function formatObject(value) {
	return JSON.stringify(value || {}, null, 2);
}
</script>

<template>
	<div class="grid gap-4 2xl:grid-cols-2">
		<section class="rounded-lg border border-border skin-card p-3 text-canvas-fg 2xl:col-span-2">
			<div class="mb-3 grid min-h-36 place-items-center rounded-lg border border-border bg-[linear-gradient(135deg,var(--canvas),var(--secondary))] p-6">
				<div class="button-preview" :style="stylesEditorDemo.styles">Results</div>
			</div>
			<div class="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
				<CssStylesEditor
					v-model="stylesEditorDemo"
					:initial-style="stylesEditorInitial"
					:varmap="stylesEditorVarmap"
					title="Mapped result"
				/>
				<div class="grid content-start gap-3">
					<div class="rounded-lg border border-border bg-canvas p-3">
						<p class="text-sm font-semibold">v-model API</p>
						<pre class="mt-2 max-h-60 overflow-auto whitespace-pre-wrap text-[11px] leading-5"><code>{{ stylesEditorApiCode }}</code></pre>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-3">
						<p class="text-sm font-semibold">Useable styles</p>
						<pre class="mt-2 max-h-44 overflow-auto whitespace-pre-wrap text-[11px] leading-5"><code>{{ formatObject(stylesEditorDemo.styles) }}</code></pre>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-3">
						<p class="text-sm font-semibold">Resulting variables</p>
						<pre class="mt-2 max-h-44 overflow-auto whitespace-pre-wrap text-[11px] leading-5"><code>{{ formatObject(stylesEditorDemo.vars) }}</code></pre>
					</div>
				</div>
			</div>
		</section>

		<section class="rounded-lg border border-border skin-card p-3 text-canvas-fg 2xl:col-span-2">
			<div class="mb-3 grid min-h-36 place-items-center rounded-lg border border-border bg-[linear-gradient(135deg,var(--canvas),var(--secondary))] p-6">
				<button type="button" class="button-preview" :style="componentButtonPreviewStyle">Button component</button>
			</div>
			<div class="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
				<CssComponentEditor
					:style="componentButtonStyle"
					:variables="componentButtonVariables"
					title="Button"
				/>
				<div class="grid content-start gap-3">
					<div class="rounded-lg border border-border bg-canvas p-3">
						<p class="text-sm font-semibold">Component API</p>
						<pre class="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-[11px] leading-5"><code>{{ componentApiCode }}</code></pre>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-3">
						<p class="text-sm font-semibold">Variable output</p>
						<pre class="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-[11px] leading-5"><code>{{ formatCssVariableBlock(componentButtonCssVariables) }}</code></pre>
					</div>
				</div>
			</div>
		</section>

		<section class="rounded-lg border border-border skin-card p-3 text-canvas-fg">
			<div class="mb-3 h-28 rounded-lg border border-border" :style="backgroundPreviewStyle"></div>
			<CssBackgroundControl v-model="backgroundOpen.control" :background="backgroundDemo" title="Background" />
		</section>

		<section class="rounded-lg border border-border skin-card p-3 text-canvas-fg">
			<div class="mb-3 grid h-28 place-items-center rounded-lg border border-border bg-canvas">
				<div class="h-14 w-28 rounded-lg bg-secondary" :style="shadowPreviewStyle"></div>
			</div>
			<CssBoxShadowControl v-model="shadowOpen.control" :shadows="shadowDemo" title="Box shadows" />
		</section>

		<section class="rounded-lg border border-border skin-card p-3 text-canvas-fg 2xl:col-span-2">
			<div class="mb-3 grid min-h-36 place-items-center rounded-lg border border-border bg-[linear-gradient(135deg,var(--canvas),var(--secondary))] p-6">
				<button type="button" class="button-preview" :style="fullButtonStyle">{{ fullButton.label }}</button>
			</div>
			<div class="grid gap-3 xl:grid-cols-2">
				<CssStyleControls :button="fullButton" :shadows="fullShadows" state-label="All controls" />
			</div>
		</section>
	</div>
</template>

<style scoped>
.button-preview {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition:
		background 160ms ease,
		border-color 160ms ease,
		color 160ms ease,
		box-shadow 160ms ease,
		transform 120ms ease;
}
</style>
