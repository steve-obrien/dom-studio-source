<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import DomToggleButtonGroup from '../../forms/toggle-button-group/DomToggleButtonGroup.vue';
import { normalizeThemeMode, useTheme } from '../../lib/vue/useTheme.js';

defineOptions({
	__doc: {
		name: 'Theme switcher',
		tag: '<DomThemeSwitcher>',
		description: 'A DOM Studio light, dark, and system theme preference control.',
		events: [
			{ name: 'update:modelValue', payload: '(mode: "light" | "dark" | "system")', description: 'Emitted when the stored theme mode changes.' },
			{ name: 'change', payload: '({ mode, theme })', description: 'Emitted with the selected preference mode and resolved light or dark theme.' },
		],
		playground: {
			initial: {
				showLabel: true,
				size: 'icon-sm',
			},
		},
	},
});

const compactThemeModeOptions = [
	{
		value: 'dark',
		label: 'Dark',
		tooltip: 'dark mode theme',
		paths: ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'],
	},
	{
		value: 'light',
		label: 'Light',
		tooltip: 'light mode theme',
		paths: [
			'M12 2v2',
			'M12 20v2',
			'M4.93 4.93l1.41 1.41',
			'M17.66 17.66l1.41 1.41',
			'M2 12h2',
			'M20 12h2',
			'M4.93 19.07l1.41-1.41',
			'M17.66 6.34l1.41-1.41',
			'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
		],
	},
	{
		value: 'system',
		label: 'System',
		tooltip: 'Auto: use the theme of the system',
		paths: [
			'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z',
			'M8 21h8',
			'M12 17v4',
		],
	},
];
const appearanceThemeModeOptions = [
	compactThemeModeOptions[1],
	compactThemeModeOptions[0],
	compactThemeModeOptions[2],
];

const props = defineProps({
	modelValue: {
		type: String,
		default: null,
		_edit: { options: ['light', 'dark', 'system'], description: 'Optional controlled theme mode. Omit this to use the stored DOM Studio preference.' },
	},
	label: {
		type: String,
		default: 'Theme mode',
		_edit: { description: 'Accessible label for the segmented control.' },
	},
	showLabel: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the current preference label beside the segmented control.' },
	},
	size: {
		type: String,
		default: 'icon-sm',
		_edit: { options: ['icon-sm', 'icon-md', 'sm', 'md', 'lg'], description: 'Button size for the segmented control.' },
	},
	variant: {
		type: String,
		default: 'default',
		_edit: { options: ['default', 'appearance'], description: 'Use appearance for a larger account-settings presentation.' },
	},
	title: {
		type: String,
		default: 'Appearance settings',
		_edit: { description: 'Heading shown by the appearance variant. Pass an empty string to hide it.' },
	},
	description: {
		type: String,
		default: 'Update the appearance settings for your account',
		_edit: { description: 'Supporting text shown by the appearance variant. Pass an empty string to hide it.' },
	},
});

const emit = defineEmits(['update:modelValue', 'change']);
const { mode, resolvedTheme, setMode, initTheme } = useTheme();
const mounted = ref(false);

const isAppearanceVariant = computed(() => props.variant === 'appearance');
const hasControlledMode = computed(() => props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '');
const themeModeOptions = computed(() => isAppearanceVariant.value ? appearanceThemeModeOptions : compactThemeModeOptions);
const selectedMode = computed({
	get() {
		return mode.value;
	},
	set(value) {
		commitMode(value);
	},
});
const currentLabel = computed(() => {
	return compactThemeModeOptions.find((option) => option.value === mode.value)?.label || 'System';
});
const displayLabel = computed(() => mounted.value ? currentLabel.value : 'System');
const controlSize = computed(() => isAppearanceVariant.value && props.size === 'icon-sm' ? 'md' : props.size);
const placeholderSizeClass = computed(() => ({
	sm: 'min-h-8 px-3 py-1.5 text-xs',
	md: 'min-h-10 px-4 py-2 text-sm',
	lg: 'min-h-11 px-5 py-2.5 text-base',
	'icon-sm': 'size-8 p-0 text-xs',
	'icon-md': 'size-10 p-0 text-sm',
}[controlSize.value] || 'size-8 p-0 text-xs'));

onMounted(() => {
	initTheme();
	if (hasControlledMode.value) setMode(props.modelValue);
	mounted.value = true;
});

watch(() => props.modelValue, (value) => {
	if (!mounted.value || !hasControlledMode.value) return;
	setMode(value);
});

/**
 * Persists the selected theme mode and emits the public change events.
 *
 * @param {unknown} value Requested theme mode.
 */
function commitMode(value) {
	const next = normalizeThemeMode(value);
	const theme = setMode(next);
	emit('update:modelValue', next);
	emit('change', { mode: next, theme });
}
</script>

<template>
	<div
		:class="isAppearanceVariant ? 'grid w-full max-w-lg gap-4' : (showLabel ? 'flex w-full items-center justify-between gap-3' : 'flex w-fit items-center gap-3')"
	>
		<div v-if="isAppearanceVariant && (title || description)" class="grid gap-1">
			<h2 v-if="title" class="text-2xl font-semibold leading-tight text-canvas-fg">
				{{ title }}
			</h2>
			<p v-if="description" class="text-sm leading-6 text-muted-fg">
				{{ description }}
			</p>
		</div>

		<span v-if="!isAppearanceVariant && showLabel" class="min-w-0 truncate text-sm font-medium text-canvas-fg">
			{{ displayLabel }} theme
		</span>

		<DomToggleButtonGroup
			v-if="mounted"
			:key="selectedMode"
			v-model="selectedMode"
			:options="themeModeOptions"
			:label="label"
			:size="controlSize"
			:variant="isAppearanceVariant ? 'switch' : 'default'"
			:chrome="false"
		>
			<template #option="{ option }">
				<svg
					viewBox="0 0 24 24"
					class="size-4"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path v-for="path in option.paths" :key="path" :d="path" />
				</svg>
				<span v-if="isAppearanceVariant">{{ option.label }}</span>
				<span v-else class="sr-only">{{ option.label }}</span>
			</template>
		</DomToggleButtonGroup>

		<div
			v-else
			class="inline-flex w-fit overflow-hidden rounded-xl"
			:class="isAppearanceVariant ? 'items-center gap-0.5 bg-secondary/80 p-0.5 shadow-inner ring-1 ring-border/30' : 'skin-control p-0'"
			aria-hidden="true"
		>
			<span
				v-for="option in themeModeOptions"
				:key="option.value"
				class="relative inline-flex items-center justify-center gap-2 text-muted-fg first:border-l-0 first:rounded-l-xl last:rounded-r-xl"
				:class="[isAppearanceVariant ? 'rounded-lg' : 'border-l border-border/80', placeholderSizeClass]"
			>
				<svg
					viewBox="0 0 24 24"
					class="size-4"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path v-for="path in option.paths" :key="path" :d="path" />
				</svg>
				<span v-if="isAppearanceVariant">{{ option.label }}</span>
			</span>
		</div>
	</div>
</template>
