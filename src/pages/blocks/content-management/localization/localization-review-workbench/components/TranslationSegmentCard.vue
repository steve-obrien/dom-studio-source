<script setup>
import { computed } from 'vue';
import { DomBadge, DomButton, DomPopover, DomStatusPill, DomTextareaInput, DomTooltip } from '@getdom/studio/vue';

const props = defineProps({
	segment: {
		type: Object,
		required: true,
	},
	target: {
		type: String,
		default: '',
	},
	active: {
		type: Boolean,
		default: false,
	},
	status: {
		type: String,
		default: 'needs-review',
	},
	checks: {
		type: Array,
		default: () => [],
	},
});

defineEmits(['select', 'update-target', 'approve']);

const unresolvedChecks = computed(() => props.checks.filter((check) => !check.resolved));
const statusTone = computed(() => {
	if (props.status === 'approved') return 'success';
	if (unresolvedChecks.value.length) return 'warning';
	return 'info';
});
const characterCount = computed(() => props.target.length);
const overLimit = computed(() => characterCount.value > props.segment.maxLength);
</script>

<template>
	<section
		class="rounded-lg border p-4 transition"
		:class="active ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border skin-card'"
	>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<button
				type="button"
				class="min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
				@click="$emit('select')"
			>
				<span class="text-xs font-semibold uppercase tracking-wide text-muted-fg">{{ segment.key }}</span>
				<h3 class="mt-1 text-base font-semibold text-canvas-fg">{{ segment.title }}</h3>
			</button>
			<div class="flex flex-wrap items-center gap-2">
				<DomStatusPill :tone="statusTone" size="sm">
					{{ status === 'approved' ? 'Approved' : unresolvedChecks.length ? `${unresolvedChecks.length} QA` : 'Ready' }}
				</DomStatusPill>
				<DomBadge v-if="segment.area" size="sm" variant="outline">{{ segment.area }}</DomBadge>
			</div>
		</div>

		<div class="mt-4 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
			<div class="rounded-lg border border-border bg-canvas p-3">
				<div class="flex items-center justify-between gap-3">
					<p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Source</p>
					<DomTooltip :text="segment.context">
						<button
							type="button"
							class="inline-flex size-7 items-center justify-center rounded-full text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
							aria-label="Show source context"
						>
							<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
								<path d="M12 17v-5M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</button>
					</DomTooltip>
				</div>
				<p class="mt-3 text-sm leading-6 text-canvas-fg">{{ segment.source }}</p>
			</div>

			<div class="space-y-3">
				<DomTextareaInput
					:model-value="target"
					:rows="4"
					:label="`Translation for ${segment.title}`"
					chrome="none"
					@update:model-value="$emit('update-target', $event)"
				/>
				<div class="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-fg">
					<span :class="overLimit && 'font-semibold text-destructive'">
						{{ characterCount }} / {{ segment.maxLength }} characters
					</span>
					<DomPopover
						v-if="segment.glossary.length"
						trigger="hover-click"
						width="w-[min(88vw,22rem)]"
						padding="p-3"
					>
						<template #trigger>
							<button
								type="button"
								class="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-canvas px-3 text-xs font-semibold text-canvas-fg transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
							>
								<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
									<path d="M6 5h9a3 3 0 0 1 0 6H6V5Zm0 6h10a4 4 0 0 1 0 8H6v-8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
								</svg>
								Glossary
							</button>
						</template>
						<div class="space-y-3">
							<div
								v-for="term in segment.glossary"
								:key="term.term"
								class="rounded-lg bg-secondary p-3"
							>
								<p class="text-sm font-semibold text-canvas-fg">{{ term.term }}</p>
								<p class="mt-1 text-xs leading-5 text-muted-fg">{{ term.note }}</p>
							</div>
						</div>
					</DomPopover>
				</div>
			</div>
		</div>

		<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
			<div class="flex flex-wrap gap-2">
				<DomBadge
					v-for="term in segment.memory"
					:key="term"
					size="sm"
					tone="info"
					variant="soft"
				>
					{{ term }}
				</DomBadge>
			</div>
			<DomButton
				size="sm"
				:variant="status === 'approved' ? 'secondary' : 'primary'"
				:disabled="overLimit || unresolvedChecks.length > 0"
				@click="$emit('approve')"
			>
				{{ status === 'approved' ? 'Approved' : 'Approve segment' }}
			</DomButton>
		</div>
	</section>
</template>
