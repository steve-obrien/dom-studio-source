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

const themeModeOptions = [
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
});

const emit = defineEmits(['update:modelValue', 'change']);
const { mode, resolvedTheme, setMode, initTheme } = useTheme();
const mounted = ref(false);

const hasControlledMode = computed(() => props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '');
const selectedMode = computed({
	get() {
		return mode.value;
	},
	set(value) {
		commitMode(value);
	},
});
const currentLabel = computed(() => {
	return themeModeOptions.find((option) => option.value === mode.value)?.label || 'System';
});
const displayLabel = computed(() => mounted.value ? currentLabel.value : 'System');
const placeholderSizeClass = computed(() => ({
	sm: 'min-h-8 px-3 py-1.5 text-xs',
	md: 'min-h-10 px-4 py-2 text-sm',
	lg: 'min-h-11 px-5 py-2.5 text-base',
	'icon-sm': 'size-8 p-0 text-xs',
	'icon-md': 'size-10 p-0 text-sm',
}[props.size] || 'size-8 p-0 text-xs'));

onMounted(() => {
	initTheme();
	if (hasControlledMode.value) setMode(props.modelValue);
	mounted.value = true;
});

watch(() => props.modelValue, (value) => {
	if (!mounted.value || !hasControlledMode.value) return;
	setMode(value);
});

function commitMode(value) {
	const next = normalizeThemeMode(value);
	const theme = setMode(next);
	emit('update:modelValue', next);
	emit('change', { mode: next, theme });
}
</script>

<template>
	<div
		class="flex items-center gap-3"
		:class="showLabel ? 'w-full justify-between' : 'w-fit'"
	>
		<span v-if="showLabel" class="min-w-0 truncate text-sm font-medium text-canvas-fg">
			{{ displayLabel }} theme
		</span>

		<DomToggleButtonGroup
			v-if="mounted"
			:key="selectedMode"
			v-model="selectedMode"
			:options="themeModeOptions"
			:label="label"
			:size="size"
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
				<span class="sr-only">{{ option.label }}</span>
			</template>
		</DomToggleButtonGroup>

		<div
			v-else
			class="skin-control inline-flex w-fit overflow-hidden rounded-xl p-0"
			aria-hidden="true"
		>
			<span
				v-for="option in themeModeOptions"
				:key="option.value"
				class="relative inline-flex items-center justify-center border-l border-border/80 text-muted-fg first:border-l-0 first:rounded-l-xl last:rounded-r-xl"
				:class="placeholderSizeClass"
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
			</span>
		</div>
	</div>
</template>
