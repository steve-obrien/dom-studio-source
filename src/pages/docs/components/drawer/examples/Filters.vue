<script setup>
import { ref } from 'vue';
import { DomDrawer, DomButton } from '@getdom/studio/vue';

const open = ref(false);
</script>

<template>
	<DomButton variant="secondary" @click="open = true">Open filters</DomButton>
	<DomDrawer v-model="open" side="left" title="Filters" width="var(--container-xs)">
		<div class="space-y-4 p-4 text-sm text-muted-foreground">
			<p>Sort by date, status, or assignee.</p>
			<DomButton variant="secondary" data-close class="w-full">Apply</DomButton>
		</div>
	</DomDrawer>
</template>
