<script setup>
defineOptions({
	name: 'DomMenuSeparator',
	__doc: {
		name: 'Menu separator',
		tag: '<MenuSeparator>',
		description: 'A non-focusable divider for separating groups inside DomMenu.',
	},
});
</script>

<template>
	<hr role="separator" class="my-1 border-t border-border" />
</template>
