<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Badge',
		tag: '<DomBadge>',
		description: 'A compact visual label for counts, roles, plans, tags, and metadata.',
		playground: {
			initial: { label: 'Scale', tone: 'success', variant: 'soft', size: 'md' },
		},
		slots: [
			{ name: '(default)', description: 'Badge text or compact inline content.' },
		],
	},
});

const props = defineProps({
	as: {
		type: String,
		default: 'span',
		_edit: { description: "Element to render. Use 'RouterLink' or 'button' through wrappers when interaction is needed." },
	},
	label: {
		type: String,
		default: 'Badge',
		_edit: { description: 'Fallback text when no default slot is provided.' },
	},
	tone: {
		type: String,
		default: 'neutral',
		_edit: {
			options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info'],
			description: 'Semantic colour treatment.',
		},
	},
	variant: {
		type: String,
		default: 'soft',
		_edit: {
			options: ['soft', 'solid', 'outline'],
			description: 'Visual weight.',
		},
	},
	size: {
		type: String,
		default: 'md',
		_edit: {
			options: ['sm', 'md', 'lg'],
			description: 'Badge density.',
		},
	},
});

const toneClasses = {
	neutral: {
		soft: 'bg-secondary text-secondary-fg ring-border',
		solid: 'bg-canvas-fg text-canvas ring-transparent',
		outline: 'bg-canvas text-canvas-fg ring-border',
	},
	primary: {
		soft: 'bg-primary/10 text-primary ring-primary/15',
		solid: 'bg-primary text-primary-fg ring-transparent',
		outline: 'bg-canvas text-primary ring-primary/30',
	},
	success: {
		soft: 'bg-success/15 text-success ring-success/20',
		solid: 'bg-success text-success-fg ring-transparent',
		outline: 'bg-canvas text-success ring-success/30',
	},
	warning: {
		soft: 'bg-warning/20 text-warning-fg ring-warning/30',
		solid: 'bg-warning text-warning-fg ring-transparent',
		outline: 'bg-canvas text-warning-fg ring-warning/40',
	},
	danger: {
		soft: 'bg-destructive/15 text-destructive ring-destructive/20',
		solid: 'bg-destructive text-destructive-fg ring-transparent',
		outline: 'bg-canvas text-destructive ring-destructive/30',
	},
	info: {
		soft: 'bg-primary/10 text-canvas-fg ring-primary/15',
		solid: 'bg-primary text-primary-fg ring-transparent',
		outline: 'bg-canvas text-canvas-fg ring-primary/30',
	},
};

const sizeClasses = {
	sm: 'px-2 py-0.5 text-[11px]',
	md: 'px-2.5 py-1 text-xs',
	lg: 'px-3 py-1.5 text-sm',
};

const classes = computed(() => [
	'inline-flex w-fit shrink-0 items-center gap-1 rounded-full font-medium ring-1 ring-inset',
	toneClasses[props.tone]?.[props.variant] || toneClasses.neutral.soft,
	sizeClasses[props.size] || sizeClasses.md,
]);
</script>

<template>
	<component :is="as" :class="classes">
		<slot>{{ label }}</slot>
	</component>
</template>
