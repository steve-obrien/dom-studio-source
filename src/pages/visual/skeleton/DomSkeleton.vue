<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Skeleton',
		tag: '<DomSkeleton>',
		description: 'A token-driven loading placeholder for cards, rows, text blocks, and avatars.',
		icon: 'M5 7h14M5 12h10M5 17h7',
		playground: {
			initial: { variant: 'text', lines: 3, width: '100%' },
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

const lineCount = computed(getLineCount);
const rootStyle = computed(getRootStyle);
const baseClass = computed(getBaseClass);
const blockClass = computed(getBlockClass);
const lineClass = computed(getLineClass);

/**
 * Resolves the number of rendered text skeleton lines.
 *
 * @returns {number} Text line count.
 */
function getLineCount() {
	return Math.max(1, Number(props.lines) || 1);
}

/**
 * Builds optional inline dimensions.
 *
 * @returns {Record<string, string|undefined>} Inline style object.
 */
function getRootStyle() {
	return {
		width: props.width || undefined,
		height: props.height || undefined,
	};
}

/**
 * Builds the shared skeleton class list.
 *
 * @returns {Array<string|boolean>} Vue class list.
 */
function getBaseClass() {
	return [
		'dom-skeleton block bg-secondary ring-1 ring-border/40',
		props.animated && 'dom-skeleton-animated',
	];
}

/**
 * Builds the block or circle skeleton class list.
 *
 * @returns {Array<unknown>} Vue class list.
 */
function getBlockClass() {
	return [
		baseClass.value,
		props.variant === 'circle' ? 'size-10 rounded-full' : 'min-h-24 rounded-lg',
	];
}

/**
 * Builds the text line skeleton class list.
 *
 * @returns {Array<unknown>} Vue class list.
 */
function getLineClass() {
	return [
		baseClass.value,
		'h-3 rounded-full',
	];
}
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
				class="animate-pulse"
				:style="{ width: line === lineCount && lineCount > 1 ? '72%' : '100%' }"
				aria-hidden="true"
			></span>
		</template>
		<span v-else class="sr-only">{{ label }}</span>
	</component>
</template>

<style scoped>
.dom-skeleton {
	background-image: linear-gradient(
		110deg,
		var(--color-secondary) 0%,
		color-mix(in oklab, var(--color-secondary) 58%, var(--color-canvas) 42%) 18%,
		var(--color-secondary)
	);
	background-size: 220% 100%;
}

.dom-skeleton-animated {
	animation: dom-skeleton-shimmer 1.1s ease-in-out infinite;
}

@keyframes dom-skeleton-shimmer {
	0% {
		background-position: 120% 0;
		opacity: 0.50;
	}

	50% {
		opacity: 1;
	}

	100% {
		background-position: -120% 0;
		opacity: 0.5;
	}
}
</style>
