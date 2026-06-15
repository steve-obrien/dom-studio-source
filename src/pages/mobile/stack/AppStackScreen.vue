<script setup>
defineOptions({
	name: 'DomAppStackScreen',
});

defineProps({
	id: {
		type: String,
		required: true,
		_edit: { description: 'Unique screen id used in the stack path.' },
	},
	title: {
		type: String,
		default: '',
		_edit: { description: 'Screen title used in breadcrumbs and generated menu rows.' },
	},
	description: {
		type: String,
		default: '',
		_edit: { description: 'Optional supporting text for generated menu rows.' },
	},
	meta: {
		type: String,
		default: '',
		_edit: { description: 'Small trailing metadata for generated menu rows.' },
	},
	icon: {
		type: String,
		default: '',
		_edit: { description: 'Optional SVG string for generated menu rows.' },
	},
	parent: {
		type: String,
		default: '',
		_edit: { description: 'Parent screen id used to build desktop and breadcrumb paths.' },
	},
	children: {
		type: Array,
		default: () => [],
		_edit: {
			component: 'DomJsonListInput',
			description: 'Child screen ids for generated settings menus.',
		},
	},
	props: {
		type: Object,
		default: () => ({}),
		_edit: { description: 'Props forwarded when this screen is rendered through a component.' },
	},
	disabled: {
		type: Boolean,
		default: false,
		_edit: { description: 'Disable generated menu rows that point to this screen.' },
	},
	loadingTitle: {
		type: String,
		default: '',
		_edit: { description: 'Optional loading title for lazy screen content.' },
	},
});
</script>

<template></template>
