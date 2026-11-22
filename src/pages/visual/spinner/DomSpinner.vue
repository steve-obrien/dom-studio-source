<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Spinner',
		tag: '<DomSpinner>',
		description: 'A compact loading indicator for buttons, toolbars, inline rows, and pending states.',
		icon: 'M12 4a8 8 0 1 1-8 8',
		playground: {
			initial: {
				label: 'Saving',
				size: 'md',
				variant: 'tail',
			},
		},
	},
});

const props = defineProps({
	label: {
		type: String,
		default: 'Loading',
		_edit: { description: 'Screen reader label.' },
	},
	size: {
		type: String,
		default: 'md',
		_edit: {
			options: ['sm', 'md', 'lg'],
			description: 'Spinner size.',
		},
	},
	variant: {
		type: String,
		default: 'arc',
		_edit: {
			options: ['arc', 'tail'],
			description: 'Use a solid arc or a highlight with a fading tail.',
		},
	},
	tone: {
		type: String,
		default: 'primary',
		_edit: {
			options: ['primary', 'neutral', 'success', 'warning', 'danger'],
			description: 'Spinner foreground colour when no custom foreground is provided.',
			overriddenBy: 'foreground',
		},
	},
	background: {
		type: String,
		default: '',
		_edit: { description: 'CSS color for the stationary donut track. Defaults to a tint of the foreground.' },
	},
	foreground: {
		type: String,
		default: '',
		_edit: { description: 'CSS color for the spinning arc. Overrides tone when provided.' },
	},
});

const classes = computed(getClasses);
const spinnerStyle = computed(getSpinnerStyle);

/**
 * Builds the spinner class list for the selected size and semantic tone.
 *
 * @returns {Array<string>} Vue class list.
 */
function getClasses() {
	return [
		'dom-spinner inline-block rounded-full border-2',
		{
			sm: 'size-4',
			md: 'size-5',
			lg: 'size-7',
		}[props.size] || 'size-5',
		{
			primary: 'text-primary',
			neutral: 'text-muted-fg',
			success: 'text-success',
			warning: 'text-warning-fg',
			danger: 'text-destructive',
		}[props.tone] || 'text-primary',
	];
}

/**
 * Maps optional custom colors to the spinner's CSS variables.
 *
 * @returns {Record<string, string|undefined>} Inline CSS custom properties.
 */
function getSpinnerStyle() {
	return {
		'--dom-spinner-background': props.background || undefined,
		'--dom-spinner-foreground': props.foreground || undefined,
	};
}
</script>

<template>
	<span role="status" :aria-label="label" class="inline-flex items-center">
		<span :class="classes" :data-variant="variant" :style="spinnerStyle" aria-hidden="true"></span>
		<span class="sr-only">{{ label }}</span>
	</span>
</template>

<style scoped>
.dom-spinner {
	--dom-spinner-color: var(--dom-spinner-foreground, currentColor);
	--dom-spinner-track: var(--dom-spinner-background, color-mix(in oklab, var(--dom-spinner-color) 20%, transparent));

	animation: dom-spinner-spin 0.7s linear infinite;
	border-color: var(--dom-spinner-track);
	border-top-color: var(--dom-spinner-color);
}

@supports (background: conic-gradient(transparent, currentColor)) and (mask: radial-gradient(black, transparent)) {
	@media (forced-colors: none) {
		.dom-spinner[data-variant='tail'] {
			border-color: transparent;
			background: conic-gradient(from 20deg, transparent 0deg 225deg, var(--dom-spinner-color) 360deg)
				border-box var(--dom-spinner-track);
			mask: radial-gradient(closest-side, transparent calc(100% - 2.5px), black calc(100% - 1.5px));
		}
	}
}

@media (forced-colors: active) {
	.dom-spinner[data-variant='tail'] {
		forced-color-adjust: none;
		border-color: GrayText;
		border-top-color: CanvasText;
	}
}

@keyframes dom-spinner-spin {
	to {
		transform: rotate(360deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.dom-spinner {
		animation: none;
	}
}
</style>
