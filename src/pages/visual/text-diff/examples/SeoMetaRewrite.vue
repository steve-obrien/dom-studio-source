<script setup>
import { DomButton, DomTextDiff } from '../../../lib/vue';

const currentDescription = 'DOM Studio is a collection of Vue components that helps developers build websites and apps.';
const suggestedDescription = 'Build polished Vue application interfaces with editable components, practical blocks, and source your team can own.';
</script>

<template>
	<div class="w-full max-w-2xl rounded-xl border border-border bg-canvas p-5 shadow-sm">
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<p class="text-sm font-semibold text-canvas-fg">Meta description</p>
				<p class="mt-1 text-xs leading-5 text-muted-fg">AI found a clearer description for the search result.</p>
			</div>
			<span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">SEO suggestion</span>
		</div>

		<DomTextDiff
			class="mt-4"
			:original="currentDescription"
			:proposed="suggestedDescription"
			view="inline"
			original-label="Current description"
			proposed-label="Suggested replacement"
		/>

		<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
			<p class="text-xs text-muted-fg">{{ suggestedDescription.length }} / 160 characters</p>
			<div class="flex items-center gap-2">
				<DomButton size="sm" variant="secondary">Keep current</DomButton>
				<DomButton size="sm" variant="primary">Use suggestion</DomButton>
			</div>
		</div>
	</div>
</template>
