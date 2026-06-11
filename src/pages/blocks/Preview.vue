<script setup>
import { computed, defineAsyncComponent, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTheme } from '../../composable/useTheme';
import { getBlockRecordByPath } from './blockRegistry.js';

const exampleModules = import.meta.glob('./**/examples/*.vue');
const route = useRoute();
const { initTheme } = useTheme();

const previewComponent = computed(() => {
	const record = getBlockRecordByPath(route.params.blockPath);
	const example = String(route.params.example || '');
	const loader = record ? exampleModules[`./${record.blockPath}/examples/${example}.vue`] : null;
	return loader ? defineAsyncComponent(loader) : null;
});

onMounted(() => {
	initTheme();
});
</script>

<template>
	<main class="min-h-screen bg-background text-fg">
		<component v-if="previewComponent" :is="previewComponent" />
		<div v-else class="grid min-h-screen place-items-center p-6 text-sm text-muted-fg">
			Block preview not found.
		</div>
	</main>
</template>
