<script setup>
defineProps({
	locales: {
		type: Array,
		required: true,
	},
	selectedLocale: {
		type: String,
		required: true,
	},
});

defineEmits(['select']);
</script>

<template>
	<div class="grid gap-3 lg:grid-cols-4">
		<button
			v-for="locale in locales"
			:key="locale.value"
			type="button"
			class="min-w-0 rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
			:class="locale.value === selectedLocale ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border skin-card'"
			:aria-pressed="locale.value === selectedLocale"
			@click="$emit('select', locale.value)"
		>
			<div class="flex items-start justify-between gap-3">
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold text-canvas-fg">{{ locale.label }}</p>
					<p class="mt-1 truncate text-xs text-muted-fg">{{ locale.owner }} reviewer</p>
				</div>
				<span class="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-muted-fg">
					{{ locale.progress }}%
				</span>
			</div>
			<div class="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
				<div
					class="h-full rounded-full bg-primary transition-all"
					:style="{ width: `${locale.progress}%` }"
				></div>
			</div>
			<div class="mt-3 flex items-center justify-between gap-3 text-xs text-muted-fg">
				<span>{{ locale.approved }} approved</span>
				<span>{{ locale.issues }} issues</span>
			</div>
		</button>
	</div>
</template>
