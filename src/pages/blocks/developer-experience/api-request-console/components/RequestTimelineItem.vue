<script setup>
defineProps({
	step: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		default: 'complete',
	},
	time: {
		type: String,
		default: '',
	},
	detail: {
		type: String,
		default: '',
	},
});

const statusClasses = {
	complete: 'bg-success text-success-fg ring-success/20',
	active: 'bg-primary text-primary-fg ring-primary/20',
	warning: 'bg-warning text-warning-fg ring-warning/30',
	waiting: 'bg-secondary text-secondary-fg ring-border',
};
</script>

<template>
	<li class="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
		<span
			class="mt-0.5 flex size-6 items-center justify-center rounded-full text-[11px] font-semibold ring-4"
			:class="statusClasses[status] || statusClasses.waiting"
			aria-hidden="true"
		>
			<svg v-if="status === 'complete'" class="size-3.5" viewBox="0 0 24 24" fill="none">
				<path d="m5 12.5 4 4L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
			<svg v-else-if="status === 'active'" class="size-2" viewBox="0 0 8 8" fill="currentColor">
				<circle cx="4" cy="4" r="3" />
			</svg>
			<span v-else>!</span>
		</span>
		<div class="min-w-0 border-b border-border pb-3">
			<div class="flex items-start justify-between gap-3">
				<p class="text-sm font-medium text-canvas-fg">{{ step }}</p>
				<p v-if="time" class="shrink-0 font-mono text-xs text-muted-fg">{{ time }}</p>
			</div>
			<p v-if="detail" class="mt-1 text-xs leading-5 text-muted-fg">{{ detail }}</p>
		</div>
	</li>
</template>
