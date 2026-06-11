<script setup>
defineProps({
	label: {
		type: String,
		required: true,
	},
	status: {
		type: String,
		default: 'neutral',
	},
	x: {
		type: Number,
		default: 50,
	},
	y: {
		type: Number,
		default: 50,
	},
	active: {
		type: Boolean,
		default: false,
	},
});

const statusClasses = {
	onTime: 'bg-success text-success-fg ring-success/35',
	warning: 'bg-warning text-warning-fg ring-warning/35',
	late: 'bg-destructive text-destructive-fg ring-destructive/35',
	neutral: 'bg-primary text-primary-fg ring-primary/35',
};
</script>

<template>
	<button
		type="button"
		class="absolute z-20 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-semibold shadow-lg ring-4 transition hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/70"
		:class="[statusClasses[status] || statusClasses.neutral, active && 'scale-110 outline outline-2 outline-offset-2 outline-ring']"
		:style="{ left: `${x}%`, top: `${y}%` }"
		:aria-label="`Select route marker ${label}`"
	>
		{{ label }}
	</button>
</template>
