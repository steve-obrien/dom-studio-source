<script setup>
defineProps({
	as: { type: String, default: 'div' },
	loading: Boolean,
	hasMore: Boolean,
	empty: Boolean,
	emptyText: { type: String, default: 'No options found' },
});
defineEmits(['load-more']);
</script>

<template>
	<component :is="as" v-if="loading || hasMore || empty" role="presentation" class="px-3 py-3 text-center text-sm text-muted-fg">
		<span v-if="loading" role="status">Loading options…</span>
		<button v-else-if="hasMore" type="button" class="rounded-lg px-3 py-1 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring" @mousedown.prevent @click.stop="$emit('load-more')">Load more options</button>
		<span v-else role="status">{{ emptyText }}</span>
	</component>
</template>
