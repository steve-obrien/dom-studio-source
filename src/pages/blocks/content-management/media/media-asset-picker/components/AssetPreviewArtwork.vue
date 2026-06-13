<script setup>
defineProps({
	asset: {
		type: Object,
		required: true,
	},
	size: {
		type: String,
		default: 'tile',
	},
});
</script>

<template>
	<div class="relative overflow-hidden" :class="size === 'dialog' ? 'aspect-[4/3] rounded-2xl' : 'aspect-[4/3]'">
		<div class="absolute inset-0 bg-gradient-to-br" :class="asset.accent"></div>
		<div
			class="absolute shadow-2xl shadow-black/15"
			:class="[
				asset.shape,
				size === 'dialog' ? 'inset-x-8 top-8 h-24' : 'inset-x-6 top-6 h-20',
			]"
		></div>
		<div
			class="absolute rounded-xl border border-white/50 bg-white/55 p-3 text-slate-950 shadow-lg backdrop-blur"
			:class="size === 'dialog' ? 'bottom-5 left-5 right-5' : 'bottom-4 left-4 right-4'"
		>
			<div class="h-2 w-2/3 rounded-full bg-slate-900/70"></div>
			<div class="mt-2 h-2 w-1/2 rounded-full bg-slate-900/30"></div>
			<div v-if="size !== 'dialog'" class="mt-3 grid grid-cols-3 gap-1.5">
				<span class="h-8 rounded-lg bg-white/70"></span>
				<span class="h-8 rounded-lg bg-white/45"></span>
				<span class="h-8 rounded-lg bg-white/30"></span>
			</div>
		</div>
	</div>
</template>
