<script setup>
defineOptions({
	name: 'DomMenuLabel',
	__doc: {
		name: 'Menu label',
		tag: '<MenuLabel>',
		description: 'A non-selectable menu row for labels, account summaries, and other static custom content.',
		slots: [
			{ name: '(default)', description: 'Static content shown inside the menu.' },
		],
	},
});
</script>

<template>
	<div role="presentation" class="rounded-xl px-3 py-2 text-sm text-muted-fg">
		<slot />
	</div>
</template>
