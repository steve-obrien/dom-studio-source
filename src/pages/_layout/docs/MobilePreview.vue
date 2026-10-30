<script setup>
defineProps({
	title: { type: String, default: '' },
	device: { type: String, default: 'DOM Studio Phone' },
});
</script>

<template>
	<div class="mx-auto w-full md:max-w-[25rem]">
		<div v-if="title" class="mb-3 flex items-center justify-between px-1">
			<p class="text-sm font-semibold tracking-tight text-canvas-fg">{{ title }}</p>
			<p class="hidden text-xs text-muted-fg sm:block">{{ device }}</p>
		</div>
		<div class="sm:rounded-[3rem] sm:border sm:border-border sm:bg-[var(--device-frame)] sm:p-2.5 sm:shadow-2xl sm:shadow-black/20">
			<div class="mobile-preview-screen relative isolate overflow-hidden bg-canvas sm:rounded-[2.35rem] sm:border sm:border-border [--dom-safe-area-top:0px] [--dom-safe-area-bottom:0px] sm:[--dom-safe-area-top:44px] sm:[--dom-safe-area-bottom:20px]">
				<div class="hidden sm:block absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-[var(--device-frame)]"></div>
				<div class="hidden sm:block absolute left-1/2 top-3 z-30 h-1.5 w-10 -translate-x-1/2 rounded-full bg-canvas/25"></div>
				<div class="h-[34rem] overflow-hidden sm:h-[38rem]">
					<slot />
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
@media (min-width: 640px) {
	.mobile-preview-screen {
		clip-path: inset(0 round 2.35rem);
	}
}
</style>
