<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Card',
		tag: '<DomCard>',
		description: 'A visual-only frame for grouped content, styled by the skin-raised theme recipe.',
		slots: [
			{ name: '(default)', description: 'Card content.' },
		],
	},
});

const props = defineProps({
	as: {
		type: String,
		default: 'div',
		_edit: { description: "The HTML element or component to render. Use 'section', 'article', or a router-link when useful." },
	},
	padding: {
		type: String,
		default: 'md',
		_edit: {
			options: ['none', 'sm', 'md', 'lg'],
			description: 'Internal spacing. Use none when the card owns its own internal layout.',
		},
	},
	interactive: {
		type: Boolean,
		default: false,
		_edit: { description: 'Add a restrained hover lift for clickable cards.' },
	},
});

const paddingClasses = {
	none: '',
	sm: 'p-4',
	md: 'p-6',
	lg: 'p-8',
};

const classes = computed(() => [
	'relative w-full overflow-hidden rounded-2xl skin-raised',
	props.interactive && 'transition duration-200 hover:-translate-y-0.5 hover:border-primary/30',
	paddingClasses[props.padding] ?? paddingClasses.md,
]);
</script>

<template>
	<component :is="as" :class="classes">
		<slot />
	</component>
</template>
