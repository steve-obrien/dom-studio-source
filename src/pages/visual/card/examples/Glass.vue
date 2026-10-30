<script setup>
import { DomButton, DomCard } from '../../../lib/vue';
</script>

<template>
	<div class="grid w-full max-w-2xl gap-4 sm:grid-cols-[1fr_0.8fr]">
		<DomCard padding="lg" class="min-h-64">
			<div class="flex h-full flex-col justify-between gap-8">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Today</p>
					<h3 class="mt-3 text-3xl font-semibold tracking-tight">42,860</h3>
					<p class="mt-2 text-sm text-muted-fg">Monthly active sessions</p>
				</div>
				<div class="grid grid-cols-6 items-end gap-1.5">
					<span v-for="height in [36, 54, 44, 72, 62, 92]" :key="height" class="rounded-t-lg bg-primary/80" :style="{ height: `${height}px` }"></span>
				</div>
			</div>
		</DomCard>

		<DomCard interactive as="button" class="w-full text-left">
			<div class="space-y-5">
				<div class="flex items-center gap-3">
					<img
						src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80"
						alt=""
						class="size-12 rounded-full object-cover ring-2 ring-canvas"
					>
					<div>
						<p class="font-semibold">Avery Stone</p>
						<p class="text-sm text-muted-fg">Product lead</p>
					</div>
				</div>
				<p class="text-sm leading-6 text-muted-fg">
					Glass cards come from skin tokens, so theme contrast stays predictable.
				</p>
				<DomButton variant="primary" size="sm">Message</DomButton>
			</div>
		</DomCard>
	</div>
</template>
