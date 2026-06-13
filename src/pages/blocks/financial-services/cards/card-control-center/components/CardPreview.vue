<script setup>
defineProps({
	card: {
		type: Object,
		required: true,
	},
	frozen: {
		type: Boolean,
		default: false,
	},
});
</script>

<template>
	<section
		class="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-canvas-fg p-5 text-canvas shadow-2xl shadow-black/20"
		:class="frozen && 'grayscale'"
	>
		<div class="absolute -right-12 -top-16 size-40 rounded-full bg-primary/35 blur-2xl"></div>
		<div class="absolute -bottom-20 left-8 size-44 rounded-full bg-success/25 blur-3xl"></div>
		<div class="relative">
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wide text-canvas/60">{{ card.type }}</p>
					<h3 class="mt-2 text-lg font-semibold">{{ card.name }}</h3>
				</div>
				<div class="grid size-11 place-items-center rounded-2xl bg-canvas/10 ring-1 ring-white/15">
					<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
						<path d="M4 7h16v10H4V7Zm0 3h16M7 15h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>
			</div>

			<div class="mt-10 flex items-end justify-between gap-4">
				<div>
					<p class="font-mono text-xl tracking-[0.2em]">•••• {{ card.last4 }}</p>
					<p class="mt-2 text-xs text-canvas/60">{{ card.holder }} / {{ card.expiry }}</p>
				</div>
				<p class="rounded-full bg-canvas/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">
					{{ frozen ? 'Frozen' : card.status }}
				</p>
			</div>
		</div>
	</section>
</template>
