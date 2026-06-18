<script setup>
import { ref } from 'vue';
import { DomProfileMenu } from '@getdom/studio/vue';

const selected = ref('none');
const themeMode = ref('stored preference');
</script>

<template>
	<div class="grid gap-3">
		<DomProfileMenu
			name="Mina Patel"
			email="mina@northstar.app"
			initials="MP"
			@select="selected = $event.value"
			@theme="themeMode = $event.mode"
		/>

		<p class="text-xs text-muted-fg">
			Selected: <code class="text-canvas-fg">{{ selected }}</code>
			<span class="px-1 text-border">/</span>
			Theme: <code class="text-canvas-fg">{{ themeMode }}</code>
		</p>
	</div>
</template>
