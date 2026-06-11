<script setup>
defineProps({
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		default: '',
	},
	statusTone: {
		type: String,
		default: 'neutral',
	},
	actionLabel: {
		type: String,
		required: true,
	},
	destructive: {
		type: Boolean,
		default: false,
	},
});

defineEmits(['action']);

const statusClass = {
	neutral: 'bg-secondary text-muted-fg',
	success: 'bg-success/10 text-success',
	warning: 'bg-warning/10 text-warning',
	destructive: 'bg-destructive/10 text-destructive',
};
</script>

<template>
	<div class="flex flex-col gap-3 border-b border-border py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
		<div class="min-w-0">
			<div class="flex flex-wrap items-center gap-2">
				<h5 class="font-semibold text-fg">{{ title }}</h5>
				<span
					v-if="status"
					class="rounded-full px-2 py-0.5 text-xs font-semibold"
					:class="statusClass[statusTone] || statusClass.neutral"
				>
					{{ status }}
				</span>
			</div>
			<p class="mt-1 text-sm leading-6 text-muted-fg">{{ description }}</p>
		</div>
		<button
			type="button"
			class="inline-flex h-9 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-ring/40"
			:class="destructive ? 'border-destructive/30 text-destructive hover:bg-destructive/10' : 'border-border text-fg hover:border-primary/50 hover:bg-secondary'"
			@click="$emit('action')"
		>
			{{ actionLabel }}
		</button>
	</div>
</template>
