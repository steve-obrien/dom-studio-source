<script setup>
import { computed, useAttrs } from 'vue';

defineOptions({
	inheritAttrs: false,
	__doc: {
		name: 'Icon button',
		tag: '<DomIconButton>',
		description: 'A compact accessible button for toolbar, row action, and chrome controls.',
		playground: {
			initial: { label: 'Add item', icon: 'M12 5v14M5 12h14' },
		},
		slots: [
			{ name: '(default)', description: 'Icon content. Use an SVG sized to 1em or Tailwind size utilities.' },
		],
	},
});

const props = defineProps({
	as: {
		type: String,
		default: 'button',
		_edit: { description: "Element to render. Use 'a' or 'RouterLink' for navigational icon controls." },
	},
	label: {
		type: String,
		default: 'Action',
		_edit: { description: 'Accessible label for screen readers.' },
	},
	icon: {
		type: String,
		default: 'M12 5v14M5 12h14',
		_edit: { description: 'Fallback SVG path data when no icon slot is provided.' },
	},
	variant: {
		type: String,
		default: 'ghost',
		_edit: { options: ['ghost', 'secondary', 'primary', 'danger'], description: 'Visual role.' },
	},
	size: {
		type: String,
		default: 'md',
		_edit: { options: ['sm', 'md', 'lg'], description: 'Hit area size.' },
	},
	active: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show active/selected state.' },
	},
	loading: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show a loading spinner and block interaction.' },
	},
	disabled: {
		type: Boolean,
		default: false,
		_edit: { description: 'Disable interaction.' },
	},
});
const attrs = useAttrs();

const variants = {
	ghost: 'text-muted-fg hover:bg-secondary hover:text-fg',
	secondary: 'skin-control hover:brightness-[0.98]',
	primary: 'skin-action hover:opacity-90',
	danger: 'text-destructive hover:bg-destructive/10',
};

const activeVariants = {
	ghost: 'bg-secondary text-fg shadow-sm ring-1 ring-border/70',
	secondary: 'bg-background text-fg shadow-sm ring-1 ring-ring/30',
	primary: 'skin-action shadow-sm ring-2 ring-ring/40',
	danger: 'bg-destructive/15 text-destructive shadow-sm ring-1 ring-destructive/20',
};

const sizes = {
	sm: 'size-8 text-sm',
	md: 'size-10 text-base',
	lg: 'size-12 text-lg',
};

const classes = computed(() => [
	'inline-grid shrink-0 place-items-center rounded-full outline-none transition active:scale-95',
	'focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
	props.active
		? activeVariants[props.variant] || activeVariants.ghost
		: variants[props.variant] || variants.ghost,
	sizes[props.size] || sizes.md,
	(props.disabled || props.loading) && 'pointer-events-none opacity-50',
]);

const isNativeButton = computed(() => props.as === 'button');
const disabledState = computed(() => props.disabled || props.loading);
</script>

<template>
	<component
		:is="as"
		v-bind="attrs"
		:class="classes"
		:aria-label="label"
		:aria-pressed="active ? 'true' : undefined"
		:aria-disabled="!isNativeButton && disabledState ? 'true' : undefined"
		:data-active="active ? 'true' : null"
		:disabled="isNativeButton && disabledState ? true : undefined"
		:type="isNativeButton ? 'button' : undefined"
	>
		<svg v-if="loading" class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25" />
			<path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
		</svg>
		<slot v-else />
		<svg v-if="!loading && !$slots.default" viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
			<path :d="icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</component>
</template>
