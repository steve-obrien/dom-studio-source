<script setup>
import { computed } from 'vue';

const props = defineProps({
	row: { type: Object, required: true },
});
const emit = defineEmits(['action']);

const coverStyle = computed(() => props.row.cover
	? { backgroundImage: `linear-gradient(to top, rgb(0 0 0 / 0.72), rgb(0 0 0 / 0.05)), url('${props.row.cover}')` }
	: null);
const progress = computed(() => {
	const total = Number(props.row.checklistTotal) || 0;
	const complete = Number(props.row.checklistComplete) || 0;
	return total ? Math.round((complete / total) * 100) : 0;
});

/**
 * Emits an application-owned open action for the rich card.
 *
 * @returns {void}
 */
function openFeature() {
	emit('action', { action: 'open', id: props.row.id });
}
</script>

<template>
	<div class="overflow-hidden rounded-xl border border-border bg-canvas shadow-sm transition hover:border-ring/35 hover:shadow-md">
		<div
			v-if="row.cover"
			class="flex min-h-32 items-end bg-cover bg-center p-3"
			:style="coverStyle"
		>
			<span class="rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
				{{ row.area }}
			</span>
		</div>

		<div class="space-y-3 p-3">
			<div class="flex flex-wrap gap-1.5">
				<span v-for="tag in row.tags" :key="tag" class="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-fg ring-1 ring-border">
					{{ tag }}
				</span>
			</div>

			<div>
				<h4 class="text-sm font-semibold leading-5 text-canvas-fg">{{ row.title }}</h4>
				<p class="mt-1 line-clamp-2 text-xs leading-5 text-muted-fg">{{ row.description }}</p>
			</div>

			<div v-if="row.checklistTotal" class="space-y-1.5">
				<div class="flex items-center justify-between text-[10px] font-semibold text-muted-fg">
					<span>Checklist</span>
					<span>{{ row.checklistComplete }}/{{ row.checklistTotal }}</span>
				</div>
				<div class="h-1.5 overflow-hidden rounded-full bg-secondary ring-1 ring-border">
					<div class="h-full rounded-full bg-primary transition-[width]" :style="{ width: `${progress}%` }"></div>
				</div>
			</div>

			<div class="flex items-center justify-between gap-3 border-t border-border pt-3">
				<div class="flex items-center gap-2">
					<span class="grid size-7 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">{{ row.ownerInitials }}</span>
					<div class="text-[10px] leading-4 text-muted-fg">
						<p class="font-semibold text-canvas-fg">{{ row.owner }}</p>
						<p>{{ row.dueLabel }}</p>
					</div>
				</div>
				<button type="button" class="rounded-md px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" @click="openFeature">
					Open
				</button>
			</div>
		</div>
	</div>
</template>
