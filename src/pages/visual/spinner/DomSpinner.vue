<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Spinner',
		tag: '<DomSpinner>',
		description: 'A compact loading indicator for buttons, toolbars, inline rows, and pending states.',
		icon: 'M12 4a8 8 0 1 1-8 8',
		playground: {
			initial: { label: 'Saving', size: 'md' },
		},
	},
});

const props = defineProps({
	label: {
		type: String,
		default: 'Loading',
		_edit: { description: 'Screen reader label.' },
	},
	size: {
		type: String,
		default: 'md',
		_edit: {
			options: ['sm', 'md', 'lg'],
			description: 'Spinner size.',
		},
	},
	tone: {
		type: String,
		default: 'primary',
		_edit: {
			options: ['primary', 'neutral', 'success', 'warning', 'danger'],
			description: 'Spinner colour.',
		},
	},
});

const classes = computed(() => [
	'inline-block animate-spin rounded-full border-2 border-current border-r-transparent',
	{
		sm: 'size-4',
		md: 'size-5',
		lg: 'size-7',
	}[props.size] || 'size-5',
	{
		primary: 'text-primary',
		neutral: 'text-muted-fg',
		success: 'text-success',
		warning: 'text-warning-fg',
		danger: 'text-destructive',
	}[props.tone] || 'text-primary',
]);
</script>

<template>
	<span role="status" :aria-label="label" class="inline-flex items-center">
		<span :class="classes" aria-hidden="true"></span>
		<span class="sr-only">{{ label }}</span>
	</span>
</template>
