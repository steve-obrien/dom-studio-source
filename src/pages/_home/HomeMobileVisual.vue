<script setup>
import { defineAsyncComponent, ref } from 'vue';
import { useNearViewport } from '../../composable/useNearViewport.js';
import HomePhoneFrame from './HomePhoneFrame.vue';

const MobileInbox = defineAsyncComponent(() => import('../mobile/examples/MobileInbox.vue'));
const SettingsStack = defineAsyncComponent(() => import('../mobile/examples/SettingsStack.vue'));
const target = ref(null);
const ready = useNearViewport(target);
</script>

<template>
	<div ref="target" class="flex justify-center gap-5 rounded-2xl border border-border bg-secondary/40 px-4 py-6 shadow-xl shadow-canvas-fg/5 sm:gap-8 sm:py-8">
		<HomePhoneFrame>
			<MobileInbox v-if="ready" />
		</HomePhoneFrame>
		<HomePhoneFrame class="hidden sm:block">
			<SettingsStack v-if="ready" height="100%" />
		</HomePhoneFrame>
	</div>
</template>
