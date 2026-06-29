<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Empty state',
		tag: '<DomEmptyState>',
		description: 'A reusable empty, zero-data, or setup state with icon, copy, and actions.',
		slots: [
			{ name: 'icon', description: 'Custom icon or illustration.' },
			{ name: 'title', description: 'Custom title markup.' },
			{ name: 'description', description: 'Custom helper text.' },
			{ name: 'actions', description: 'Primary and secondary actions.' },
		],
	},
});

const props = defineProps({
	title: {
		type: String,
		default: 'Nothing here yet',
		_edit: { description: 'Primary empty-state message.' },
	},
	description: {
		type: String,
		default: 'Create something new or adjust your filters to continue.',
		_edit: { description: 'Supporting copy.' },
	},
	icon: {
		type: String,
		default: 'M5 12h14M12 5v14',
		_edit: {
			component: 'DomIconSelector',
			description: 'SVG path data for the default 24x24 line icon.',
			props: {
				kind: 'icons',
				clearable: false,
				placeholder: 'Search icons',
			},
		},
	},
	align: {
		type: String,
		default: 'center',
		_edit: { options: ['left', 'center'], description: 'Content alignment.' },
	},
	size: {
		type: String,
		default: 'md',
		_edit: { options: ['sm', 'md', 'lg'], description: 'Spacing scale.' },
	},
});

const classes = computed(() => [
	'rounded-2xl border border-dashed border-border bg-secondary/30',
	props.align === 'left' ? 'text-left' : 'text-center',
	{
		sm: 'p-5',
		md: 'p-8',
		lg: 'p-10',
	}[props.size] || 'p-8',
]);
</script>

<template>
	<div :class="classes">
		<div :class="align === 'left' ? 'items-start' : 'items-center'" class="flex flex-col">
			<slot name="icon">
				<div class="grid size-11 place-items-center rounded-2xl bg-canvas text-muted-fg ring-1 ring-border">
					<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
						<path :d="icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>
			</slot>
			<div class="mt-4 max-w-md">
				<slot name="title">
					<h3 class="text-base font-semibold tracking-tight text-canvas-fg">{{ title }}</h3>
				</slot>
				<slot name="description">
					<p class="mt-2 text-sm leading-6 text-muted-fg">{{ description }}</p>
				</slot>
			</div>
			<div v-if="$slots.actions" class="mt-5 flex flex-wrap gap-2" :class="align === 'left' ? 'justify-start' : 'justify-center'">
				<slot name="actions" />
			</div>
		</div>
	</div>
</template>
