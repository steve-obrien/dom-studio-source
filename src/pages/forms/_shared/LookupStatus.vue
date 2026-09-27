<script setup>
defineProps({ error: String, count: Number, total: Number });
defineEmits(['retry']);
</script>

<template>
	<p v-if="error" role="alert" class="text-sm text-destructive">{{ error }} <button type="button" class="underline" @click="$emit('retry')">Retry</button></p>
	<p v-else class="text-xs text-muted-fg">{{ count }} of {{ total }} results loaded. Scroll for more; search resets the pages.</p>
</template>
