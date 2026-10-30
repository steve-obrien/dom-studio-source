<script setup>
import { RouterLink } from 'vue-router';
import DocSection from '../DocSection.vue';

defineProps({
	componentName: { type: String, required: true },
});
</script>

<template>
	<DocSection eyebrow="Quick start" :title="`Use ${componentName} now`">
		<div class="flex flex-col gap-5 rounded-2xl border border-border bg-secondary/35 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
			<div class="max-w-2xl">
				<p class="text-sm font-semibold text-canvas-fg">Choose the installation path that suits this stage</p>
				<p class="mt-2 text-sm leading-6 text-muted-fg">
					Use npm for the fastest working version. Copy the source when you want {{ componentName }} to become part of your codebase: yours to edit, adapt, and maintain.
				</p>
			</div>
			<RouterLink
				to="/install"
				class="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
			>
				View install options
				<span aria-hidden="true" class="ml-1">→</span>
			</RouterLink>
		</div>
	</DocSection>
</template>
