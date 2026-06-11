<script setup>
import { computed } from 'vue';

defineOptions({
	__doc: {
		name: 'Toolbar',
		tag: '<DomToolbar>',
		description: 'A compact action surface for icon buttons, segmented controls, filters, and overflow menus.',
		slots: [
			{ name: '(default)', description: 'Toolbar controls.' },
		],
	},
});

const props = defineProps({
	as: {
		type: String,
		default: 'div',
		_edit: { description: 'Element to render.' },
	},
	label: {
		type: String,
		default: 'Toolbar',
		_edit: { description: 'Accessible toolbar label.' },
	},
	orientation: {
		type: String,
		default: 'horizontal',
		_edit: { options: ['horizontal', 'vertical'], description: 'Toolbar direction.' },
	},
	align: {
		type: String,
		default: 'start',
		_edit: { options: ['start', 'center', 'end', 'between'], description: 'Control alignment.' },
	},
	wrap: {
		type: Boolean,
		default: true,
		_edit: { description: 'Allow controls to wrap on narrow screens.' },
	},
	inset: {
		type: Boolean,
		default: false,
		_edit: { description: 'Use inset skin instead of control skin.' },
	},
});

const classes = computed(() => [
	props.inset ? 'skin-inset' : 'skin-control',
	'inline-flex gap-1 rounded-2xl p-1',
	props.orientation === 'vertical' ? 'flex-col' : 'flex-row items-center',
	props.wrap && props.orientation !== 'vertical' && 'flex-wrap',
	{
		start: 'justify-start',
		center: 'justify-center',
		end: 'justify-end',
		between: 'justify-between',
	}[props.align] || 'justify-start',
]);
</script>

<template>
	<component :is="as" role="toolbar" :aria-label="label" :aria-orientation="orientation" :class="classes">
		<slot />
	</component>
</template>
