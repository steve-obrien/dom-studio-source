<script setup>
import { ref } from 'vue';
import { DomDrawer, DomButton } from '@getdom/studio/vue';

const open = ref(false);
</script>

<template>
	<DomButton @click="open = true">Open menu</DomButton>
	<DomDrawer v-model="open" title="Navigation">
		<nav class="flex flex-col">
			<a
				href="#"
				class="border-b border-border px-4 py-4 text-sm font-medium text-fg hover:bg-secondary/60"
				@click.prevent="open = false"
			>Home</a>
			<a
				href="#"
				class="border-b border-border px-4 py-4 text-sm font-medium text-muted-fg hover:bg-secondary/60 hover:text-fg"
				@click.prevent="open = false"
			>Projects</a>
			<a
				href="#"
				class="border-b border-border px-4 py-4 text-sm font-medium text-muted-fg hover:bg-secondary/60 hover:text-fg"
				@click.prevent="open = false"
			>Settings</a>
		</nav>
	</DomDrawer>
</template>
