<script setup>
import { computed, provide, reactive, watch } from 'vue';
import CssBackdropControl from './CssBackdropControl.vue';
import CssBackgroundControl from './CssBackgroundControl.vue';
import CssBorderControl from './CssBorderControl.vue';
import CssBoxShadowControl from './CssBoxShadowControl.vue';
import CssSurfaceControl from './CssSurfaceControl.vue';
import { cssStyleToVariables } from '../lib/styleModel.js';
import { cssEditorContextKey } from '../lib/cssEditorContext.js';

const props = defineProps({
	framed: { type: Boolean, default: true },
	colorVariables: { type: Object, default: () => ({}) },
	style: {
		type: Object,
		required: true,
	},
	variables: {
		type: Object,
		default: () => ({}),
	},
	title: {
		type: String,
		default: 'CSS component',
	},
	showVariableMap: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['change']);
provide(cssEditorContextKey, {
	framed: computed(() => props.framed),
	colorVariables: computed(() => props.colorVariables),
});

const sectionOpen = reactive({
	surface: true,
	border: true,
	shadows: true,
	backdrop: true,
	background: true,
});

const cssVariables = computed(() => cssStyleToVariables(props.style, props.variables));
const surfaceVariables = computed(() => ({
	bg: props.variables.bg,
	fg: props.variables.fg,
}));
const borderVariables = computed(() => ({
	color: props.variables.border,
	width: props.variables.borderWidth,
	style: props.variables.borderStyle,
}));
const shadowVariables = computed(() => ({
	shadow: props.variables.shadow,
}));
const backdropVariables = computed(() => ({
	backdrop: props.variables.backdrop,
}));
const backgroundVariables = computed(() => ({
	bgImage: props.variables.bgImage,
}));
const variableEntries = computed(() => Object.entries(cssVariables.value));

watch(cssVariables, (value) => {
	emit('change', value);
}, { deep: true, immediate: true });

defineExpose({
	cssVariables,
});
</script>

<template>
	<div class="grid" :class="framed && 'gap-2'">
		<CssSurfaceControl
			v-if="style.surface"
			v-model="sectionOpen.surface"
			:surface="style.surface"
			:variables="surfaceVariables"
			:title="`${title} surface`"
		/>
		<CssBorderControl
			v-if="style.border"
			v-model="sectionOpen.border"
			:border="style.border"
			:variables="borderVariables"
			:title="`${title} border`"
		/>
		<CssBoxShadowControl
			v-if="style.shadows"
			v-model="sectionOpen.shadows"
			:shadows="style.shadows"
			:variables="shadowVariables"
			:title="`${title} shadow layers`"
		/>
		<CssBackdropControl
			v-if="style.backdrop"
			v-model="sectionOpen.backdrop"
			:backdrop="style.backdrop"
			:variables="backdropVariables"
			:title="`${title} backdrop effects`"
		/>
		<CssBackgroundControl
			v-if="style.background"
			v-model="sectionOpen.background"
			:background="style.background"
			:variables="backgroundVariables"
			:title="`${title} background layers`"
		/>
		<div v-if="showVariableMap" class="rounded-lg border border-border skin-card p-3 text-canvas-fg">
			<p class="text-sm font-semibold">CSS variables</p>
			<div class="mt-2 grid gap-1.5">
				<p
					v-for="[name, value] in variableEntries"
					:key="name"
					class="grid gap-1 rounded-md bg-canvas px-2 py-1.5 font-mono text-[11px] leading-5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]"
				>
					<span class="truncate text-muted-fg">{{ name }}</span>
					<span class="truncate">{{ value }}</span>
				</p>
			</div>
		</div>
		<slot name="after" :css-variables="cssVariables" />
	</div>
</template>
