<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Skeleton',
		tag: '<DomSkeleton>',
		description: 'A token-driven loading placeholder for cards, rows, text blocks, and avatars.',
		icon: 'M5 7h14M5 12h10M5 17h7',
		playground: {
			initial: { variant: 'text', lines: 3 },
		},
	},
});

const props = defineProps({
	as: {
		type: String,
		default: 'div',
		_edit: { description: 'Element to render.' },
	},
	variant: {
		type: String,
		default: 'block',
		_edit: {
			options: ['block', 'text', 'circle'],
			description: 'Placeholder shape.',
		},
	},
	lines: {
		type: Number,
		default: 1,
		_edit: { description: 'Number of text lines when variant is text.' },
	},
	width: {
		type: String,
		default: '',
		_edit: { description: 'Optional CSS width.' },
	},
	height: {
		type: String,
		default: '',
		_edit: { description: 'Optional CSS height.' },
	},
	label: {
		type: String,
		default: 'Loading',
		_edit: { description: 'Screen reader label.' },
	},
	animated: {
		type: Boolean,
		default: true,
		_edit: { description: 'Pulse while content is loading.' },
	},
});

const lineCount = computed(() => Math.max(1, Number(props.lines) || 1));
const rootStyle = computed(() => ({
	width: props.width || undefined,
	height: props.height || undefined,
}));
const baseClass = computed(() => [
	'block bg-secondary',
	props.animated && 'animate-pulse',
]);
const blockClass = computed(() => [
	baseClass.value,
	props.variant === 'circle' ? 'size-10 rounded-full' : 'min-h-24 rounded-lg',
]);
const lineClass = computed(() => [
	baseClass.value,
	'h-3 rounded-full',
]);
</script>

<template>
	<component
		:is="as"
		:class="variant === 'text' ? 'grid gap-2' : blockClass"
		:style="rootStyle"
		role="status"
		:aria-label="label"
		aria-busy="true"
	>
		<template v-if="variant === 'text'">
			<span
				v-for="line in lineCount"
				:key="line"
				:class="lineClass"
				:style="{ width: line === lineCount && lineCount > 1 ? '72%' : '100%' }"
				aria-hidden="true"
			></span>
		</template>
		<span v-else class="sr-only">{{ label }}</span>
	</component>
</template>
