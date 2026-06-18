<script setup>
import { DomThemeSwitcher } from '@getdom/studio/vue';
</script>

<template>
	<div class="flex w-full max-w-xl items-center justify-between rounded-xl border border-border bg-canvas px-3 py-2 shadow-sm">
		<div class="min-w-0">
			<p class="truncate text-sm font-semibold">Northstar Studio</p>
			<p class="truncate text-xs text-muted-fg">Theme follows the DOM Studio preference.</p>
		</div>

		<DomThemeSwitcher :show-label="false" />
	</div>
</template>
