<script setup>
import { computed, useAttrs } from 'vue';

defineOptions({
	inheritAttrs: false,
	__doc: {
		name: 'Button',
		tag: '<DomButton>',
		description: 'The atomic call to action — variants, sizes, loading state, and any underlying element.',
		slots: [
			{ name: '(default)', description: 'Button label and/or icons.' },
		],
	},
});

const props = defineProps({
	as: {
		type: String,
		default: 'button',
		_edit: { description: "The HTML element or component to render. Use 'router-link' or 'a' to render a link." },
	},
	variant: {
		type: String,
		default: 'primary',
		_edit: {
			options: ['primary', 'secondary', 'ghost', 'danger'],
			description: 'Visual style — pick the role this button plays in the layout.',
		},
	},
	size: {
		type: String,
		default: 'md',
		_edit: {
			options: ['xs', 'sm', 'md', 'lg', 'xl'],
			description: 'Five balanced sizes.',
		},
	},
	loading: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show a spinner and block interaction.' },
	},
	disabled: {
		type: Boolean,
		default: false,
		_edit: { description: 'Disable the button — non-interactive, lowered opacity.' },
	},
});
const attrs = useAttrs();
const interaction = 'select-none active:bg-[linear-gradient(rgb(0_0_0/6%)_0_0)] active:scale-[0.97] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] motion-reduce:active:scale-100';
const variants = {
	primary: 'skin-action hover:opacity-90',
	secondary: 'skin-control hover:brightness-[0.98]',
	// Reserve the border so variant changes fade from transparent without a currentColor flash or width shift.
	ghost: 'border border-transparent text-canvas-fg hover:bg-secondary hover:text-secondary-fg',
	danger: 'skin-control text-destructive hover:brightness-[0.98]',
};
const sizes = {
	xs: 'h-7 px-2.5 text-xs',
	sm: 'h-8 px-3 text-xs',
	md: 'h-10 px-4 text-sm',
	lg: 'h-12 px-6 text-base',
	xl: 'h-14 px-8 text-lg',
};

const classes = computed(() => [
	interaction,
	'inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-tight transition',
	'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
	variants[props.variant] || variants.primary,
	sizes[props.size] || sizes.md,
	(props.disabled || props.loading) && 'opacity-50 pointer-events-none',
]);
const disabledState = computed(() => props.disabled || props.loading);
const isNativeButton = computed(() => props.as === 'button');
const componentAttrs = computed(() => {
	const { disabled, tabindex, onClick, ...rest } = attrs;
	const dataDisabled = disabledState.value ? '' : rest['data-disabled'];
	if (isNativeButton.value) {
		return {
			...rest,
			'data-disabled': dataDisabled,
			disabled: disabledState.value || undefined,
		};
	}
	return {
		...rest,
		'data-disabled': dataDisabled,
		'aria-disabled': disabledState.value ? 'true' : undefined,
		tabindex: disabledState.value ? -1 : tabindex,
	};
});

/**
 * Invokes one or more click handlers forwarded through component attributes.
 *
 * @param {Function | Function[] | undefined} handler Forwarded click handler or handler collection.
 * @param {MouseEvent} event Native click event.
 * @returns {void}
 */
function callClickHandler(handler, event) {
	if (Array.isArray(handler)) {
		handler.forEach((item) => callClickHandler(item, event));
		return;
	}
	if (typeof handler === 'function') handler(event);
}

/**
 * Blocks disabled interactions or forwards an enabled click to the consumer.
 *
 * @param {MouseEvent} event Native click event.
 * @returns {void}
 */
function onClick(event) {
	if (disabledState.value) {
		event.preventDefault();
		event.stopPropagation();
		return;
	}
	callClickHandler(attrs.onClick, event);
}
</script>

<template>
	<component :is="as" v-bind="componentAttrs" :class="classes" @click="onClick">
		<svg v-if="loading" class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25" />
			<path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
		</svg>
		<slot />
	</component>
</template>
