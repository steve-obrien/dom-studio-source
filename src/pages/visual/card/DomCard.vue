<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Card',
		tag: '<DomCard>',
		description: 'A visual-only frame for grouped content, styled by the skin-card theme recipe.',
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
		default: 'p-4 md:p-6 lg:p-8',
		_edit: {
			component: 'DomTextInput',
			description: 'Internal spacing. Defaults to sm on small screens, md from the md breakpoint, and lg from the lg breakpoint. Use none, sm, md, or lg for a fixed size, or provide Tailwind padding utilities.',
			props: {
				placeholder: 'p-4 md:p-6',
			},
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

/**
 * Assemble the card surface, interaction state, and resolved padding classes.
 *
 * Named padding values use the component scale; any other string is treated as
 * Tailwind utilities so callers can include responsive variants.
 *
 * @returns {Array<string|boolean>} Classes bound to the rendered card element.
 */
const classes = computed(() => [
	'relative w-full overflow-hidden rounded-2xl skin-card',
	props.interactive && 'transition duration-200 hover:-translate-y-0.5 hover:border-primary/30',
	paddingClasses[props.padding] ?? props.padding,
]);
</script>

<template>
	<component :is="as" :class="classes">
		<slot />
	</component>
</template>
