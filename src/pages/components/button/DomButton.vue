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
			options: ['sm', 'md', 'lg'],
			description: 'Three balanced sizes.',
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
const active = 'select-none active:bg-[linear-gradient(rgb(0_0_0/6%)_0_0)] active:border-t-border active:data-disabled:bg-secondary active:data-disabled:border-t-border active:data-disabled:shadow-none active:scale-[0.97] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] focus-visible:outline-2 focus-visible:outline-ring focus-visible:-outline-offset-1 data-disabled:text-muted-fg';
const variants = {
	primary: 'skin-action hover:opacity-90',
	secondary: 'skin-control hover:brightness-[0.98]',
	ghost: 'text-fg hover:bg-secondary hover:text-secondary-fg',
	danger: 'skin-control text-destructive hover:brightness-[0.98]',
};
const sizes = {
	sm: 'h-8 px-3 text-xs',
	md: 'h-10 px-4 text-sm',
	lg: 'h-12 px-6 text-base',
};

const classes = computed(() => [
	active,
	'inline-flex items-center cursor-pointer justify-center gap-2 rounded-full font-medium tracking-tight transition',
	'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
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

function callClickHandler(handler, event) {
	if (Array.isArray(handler)) {
		handler.forEach((item) => callClickHandler(item, event));
		return;
	}
	if (typeof handler === 'function') handler(event);
}

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
