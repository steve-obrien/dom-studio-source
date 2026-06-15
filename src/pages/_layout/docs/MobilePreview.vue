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
		<div class="rounded-[3rem] border border-border bg-canvas-fg p-2.5 shadow-2xl shadow-black/20">
			<div class="mobile-preview-screen relative isolate overflow-hidden rounded-[2.35rem] border border-border bg-canvas">
				<div class="absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-canvas-fg"></div>
				<div class="absolute left-1/2 top-3 z-30 h-1.5 w-10 -translate-x-1/2 rounded-full bg-canvas/25"></div>
				<div class="h-[34rem] overflow-hidden sm:h-[38rem]">
					<slot />
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.mobile-preview-screen {
	clip-path: inset(0 round 2.35rem);
}
</style>
