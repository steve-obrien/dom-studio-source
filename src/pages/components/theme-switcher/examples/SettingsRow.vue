<script setup>
import { ref } from 'vue';
import { DomThemeSwitcher } from '@getdom/studio/vue';

const lastChange = ref('Stored preference');
</script>

<template>
	<div class="w-full max-w-sm rounded-xl border border-border bg-canvas p-3">
		<DomThemeSwitcher @change="lastChange = `${$event.mode} preference`" />

		<p class="mt-3 text-xs text-muted-fg">
			{{ lastChange }}
		</p>
	</div>
</template>
