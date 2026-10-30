<script setup>
import { ref } from 'vue';
import { DomIconSelector } from '../../../lib/vue';

const selectedIcon = ref('M12 5v14M5 12h14');
</script>

<template>
	<div class="grid gap-4 sm:grid-cols-[minmax(0,22rem)_1fr] sm:items-start">
		<DomIconSelector
			v-model="selectedIcon"
			label="Button icon"
			description="Search DOM Studio icon paths collected from the local source."
			placeholder="Search icons"
		/>

		<div class="rounded-xl border border-border bg-secondary/40 p-4">
			<p class="text-xs font-medium uppercase tracking-wider text-muted-fg">Selected path</p>
			<code class="mt-2 block break-all text-xs leading-5 text-canvas-fg">{{ selectedIcon }}</code>
		</div>
	</div>
</template>
