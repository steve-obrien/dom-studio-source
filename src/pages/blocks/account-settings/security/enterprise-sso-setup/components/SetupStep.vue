<script setup>
defineProps({
	number: {
		type: [Number, String],
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		default: '',
	},
	status: {
		type: String,
		default: 'pending',
	},
});

const statusClasses = {
	complete: 'border-success bg-success/10 text-success',
	current: 'border-primary bg-primary/10 text-primary',
	pending: 'border-border bg-secondary text-muted-fg',
};
</script>

<template>
	<div class="flex gap-3">
		<div
			class="grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold"
			:class="statusClasses[status] || statusClasses.pending"
		>
			<svg v-if="status === 'complete'" viewBox="0 0 16 16" class="size-4" fill="none" aria-hidden="true">
				<path d="M4 8.4 6.5 11 12 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
			<span v-else>{{ number }}</span>
		</div>
		<div class="min-w-0 pb-5">
			<p class="text-sm font-semibold text-canvas-fg">{{ title }}</p>
			<p v-if="description" class="mt-1 text-xs leading-5 text-muted-fg">{{ description }}</p>
		</div>
	</div>
</template>
