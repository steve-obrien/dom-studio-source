<script setup>
import { defineAsyncComponent, ref } from 'vue';
import { useNearViewport } from '../../composable/useNearViewport.js';

const MobileInbox = defineAsyncComponent(() => import('../mobile/examples/MobileInbox.vue'));
const SettingsStack = defineAsyncComponent(() => import('../mobile/examples/SettingsStack.vue'));
const target = ref(null);
const ready = useNearViewport(target);
</script>

<template>
	<div ref="target" class="flex justify-center gap-5 rounded-2xl border border-border bg-secondary/40 px-4 py-6 shadow-xl shadow-canvas-fg/5 sm:gap-8 sm:py-8">
		<div class="h-[36rem] w-full max-w-[18.5rem] overflow-hidden rounded-[2.25rem] border-[6px] border-canvas-fg/85 bg-canvas shadow-lg">
			<MobileInbox v-if="ready" />
		</div>
		<div class="hidden h-[36rem] w-full max-w-[18.5rem] overflow-hidden rounded-[2.25rem] border-[6px] border-canvas-fg/85 bg-canvas shadow-lg sm:block">
			<SettingsStack v-if="ready" height="100%" />
		</div>
	</div>
</template>
