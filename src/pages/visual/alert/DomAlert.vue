<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Alert',
		tag: '<DomAlert>',
		description: 'A persistent inline notice for status messages, policy warnings, empty-flow guidance, and recoverable errors.',
		icon: 'M12 4l9 16H3L12 4Zm0 5v4M12 17h.01',
		playground: {
			initial: {
				tone: 'warning',
				title: 'Review needed',
				description: 'Two records need approval before this change can be published.',
			},
		},
		slots: [
			{ name: 'icon', description: 'Replace the leading status icon.' },
			{ name: 'title', description: 'Replace the title content.' },
			{ name: '(default)', description: 'Alert body. Falls back to the description prop.' },
			{ name: 'actions', description: 'Action buttons or links aligned below the message.' },
		],
	},
});

const props = defineProps({
	as: {
		type: String,
		default: 'div',
		_edit: { description: 'Element to render.' },
	},
	tone: {
		type: String,
		default: 'info',
		_edit: {
			options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info'],
			description: 'Semantic alert tone.',
		},
	},
	variant: {
		type: String,
		default: 'soft',
		_edit: {
			options: ['soft', 'outline'],
			description: 'Visual weight.',
		},
	},
	title: {
		type: String,
		default: 'Notice',
		_edit: { description: 'Fallback title when the title slot is empty.' },
	},
	description: {
		type: String,
		default: '',
		_edit: { description: 'Fallback body copy when the default slot is empty.' },
	},
	icon: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the leading status icon.' },
	},
	role: {
		type: String,
		default: '',
		_edit: { description: 'ARIA role override. Danger and warning default to alert; other tones default to status.' },
	},
});

const toneClasses = {
	neutral: {
		soft: 'border-border bg-secondary/70 text-canvas-fg',
		outline: 'border-border bg-canvas text-canvas-fg',
		icon: 'text-muted-fg',
	},
	primary: {
		soft: 'border-primary/20 bg-primary/10 text-canvas-fg',
		outline: 'border-primary/35 bg-canvas text-canvas-fg',
		icon: 'text-primary',
	},
	success: {
		soft: 'border-success/25 bg-success/10 text-canvas-fg',
		outline: 'border-success/35 bg-canvas text-canvas-fg',
		icon: 'text-success',
	},
	warning: {
		soft: 'border-warning/30 bg-warning/15 text-canvas-fg',
		outline: 'border-warning/40 bg-canvas text-canvas-fg',
		icon: 'text-warning-fg',
	},
	danger: {
		soft: 'border-destructive/25 bg-destructive/10 text-canvas-fg',
		outline: 'border-destructive/40 bg-canvas text-canvas-fg',
		icon: 'text-destructive',
	},
	info: {
		soft: 'border-primary/20 bg-primary/10 text-canvas-fg',
		outline: 'border-primary/30 bg-canvas text-canvas-fg',
		icon: 'text-primary',
	},
};

const classes = computed(() => [
	'rounded-lg border px-4 py-3 text-sm shadow-sm',
	toneClasses[props.tone]?.[props.variant] || toneClasses.info.soft,
]);
const iconClass = computed(() => [
	'mt-0.5 size-5 shrink-0',
	toneClasses[props.tone]?.icon || toneClasses.info.icon,
]);
const resolvedRole = computed(() => props.role || (['danger', 'warning'].includes(props.tone) ? 'alert' : 'status'));
</script>

<template>
	<component :is="as" :class="classes" :role="resolvedRole">
		<div class="flex gap-3">
			<slot v-if="icon" name="icon">
				<svg :class="iconClass" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M12 4l9 16H3L12 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
					<path d="M12 9v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
					<path d="M12 17h.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
				</svg>
			</slot>
			<div class="min-w-0 flex-1">
				<p class="font-semibold leading-6">
					<slot name="title">{{ title }}</slot>
				</p>
				<div v-if="$slots.default || description" class="mt-1 leading-6 text-muted-fg">
					<slot>{{ description }}</slot>
				</div>
				<div v-if="$slots.actions" class="mt-3 flex flex-wrap gap-2">
					<slot name="actions"></slot>
				</div>
			</div>
		</div>
	</component>
</template>
