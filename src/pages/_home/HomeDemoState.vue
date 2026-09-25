<script setup>
defineProps({ error: { type: Error, default: null } });
</script>

<template>
	<div class="grid min-h-80 place-content-center gap-3 p-8 text-center" role="status">
		<p class="font-medium text-canvas-fg">{{ error ? 'This demo couldn’t load.' : 'Preparing your playground…' }}</p>
		<p class="text-sm text-muted-fg">{{ error ? 'Reload the page to try again, or explore the example using the link above.' : 'Loading the real DOM Studio components.' }}</p>
	</div>
</template>
