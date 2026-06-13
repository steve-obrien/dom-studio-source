<script setup>
import { computed } from 'vue';
import { DomBadge, DomTooltip } from '@getdom/studio/vue';

const props = defineProps({
	step: {
		type: Object,
		required: true,
	},
	accentColor: {
		type: String,
		default: '#2563eb',
	},
	previewMode: {
		type: String,
		default: 'desktop',
	},
});

defineEmits(['select-target']);

const targets = [
	{ id: 'setup-card', label: 'Setup card', class: 'left-[8%] top-[24%] h-[30%] w-[39%]' },
	{ id: 'invite-button', label: 'Invite button', class: 'right-[8%] top-[13%] h-10 w-32' },
	{ id: 'connect-data', label: 'Connect data tile', class: 'right-[9%] top-[28%] h-[24%] w-[34%]' },
	{ id: 'publish-workflow', label: 'Publish workflow button', class: 'left-[13%] bottom-[15%] h-11 w-44' },
];

const activeTarget = computed(() => targets.find((target) => target.id === props.step.targetId) || targets[0]);
const canvasStyle = computed(() => ({
	'--tour-accent': props.accentColor,
}));
const tooltipPositionClass = computed(() => {
	const placement = props.step.placement || 'bottom';
	if (placement.startsWith('top')) return 'bottom-full left-1/2 mb-3 -translate-x-1/2';
	if (placement.startsWith('start')) return 'right-full top-1/2 mr-3 -translate-y-1/2';
	if (placement.startsWith('end')) return 'left-full top-1/2 ml-3 -translate-y-1/2';
	return 'left-1/2 top-full mt-3 -translate-x-1/2';
});
</script>

<template>
	<section class="overflow-hidden rounded-lg border border-border skin-card" :style="canvasStyle">
		<div class="flex flex-col gap-3 border-b border-border bg-canvas/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Live app preview</p>
				<h2 class="mt-1 text-sm font-semibold text-canvas-fg">{{ step.title }}</h2>
			</div>
			<DomBadge tone="neutral" variant="outline">{{ previewMode }} preview</DomBadge>
		</div>

		<div class="bg-secondary/40 p-4 sm:p-6">
			<div
				class="relative mx-auto min-h-[28rem] overflow-hidden rounded-lg border border-border bg-canvas shadow-xl shadow-black/10"
				:class="previewMode === 'mobile' ? 'max-w-[21rem]' : 'max-w-5xl'"
			>
				<div class="flex items-center justify-between border-b border-border px-4 py-3">
					<div class="flex items-center gap-2">
						<div class="size-8 rounded-lg bg-canvas-fg"></div>
						<div>
							<p class="text-sm font-semibold text-canvas-fg">Northstar Workspace</p>
							<p class="text-xs text-muted-fg">Activation dashboard</p>
						</div>
					</div>
					<div class="hidden items-center gap-2 sm:flex">
						<span class="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-fg">Trial: 9 days</span>
						<button type="button" class="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-canvas-fg">Invite team</button>
					</div>
				</div>

				<div class="grid gap-4 p-4 md:grid-cols-[1.2fr_0.8fr]">
					<div class="rounded-lg border border-border bg-canvas p-4">
						<div class="flex items-start justify-between gap-4">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Setup checklist</p>
								<h3 class="mt-2 text-xl font-semibold tracking-tight text-canvas-fg">Launch your first workflow</h3>
							</div>
							<span class="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">68%</span>
						</div>
						<div class="mt-5 grid gap-3">
							<div class="rounded-lg border border-border p-3">
								<p class="text-sm font-semibold text-canvas-fg">Connect your source data</p>
								<p class="mt-1 text-xs leading-5 text-muted-fg">Sync events, customers, and account properties.</p>
							</div>
							<div class="rounded-lg border border-border p-3">
								<p class="text-sm font-semibold text-canvas-fg">Invite the people who approve launches</p>
								<p class="mt-1 text-xs leading-5 text-muted-fg">Add design, success, and engineering reviewers.</p>
							</div>
						</div>
					</div>
					<div class="grid gap-4">
						<div class="rounded-lg border border-border bg-canvas p-4">
							<p class="text-sm font-semibold text-canvas-fg">Connect data</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">Choose a warehouse, API stream, or product analytics source.</p>
							<button type="button" class="mt-4 rounded-full bg-canvas-fg px-4 py-2 text-xs font-semibold text-canvas">Connect source</button>
						</div>
						<div class="rounded-lg border border-border bg-canvas p-4">
							<p class="text-sm font-semibold text-canvas-fg">Publish workflow</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">Send the first activation path to your trial admins.</p>
							<button type="button" class="mt-4 rounded-full border border-border px-4 py-2 text-xs font-semibold">Publish workflow</button>
						</div>
					</div>
				</div>

				<button
					v-for="target in targets"
					:key="target.id"
					type="button"
					class="absolute rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-ring/60"
					:class="[
						target.class,
						target.id === activeTarget.id ? 'ring-2 ring-[var(--tour-accent)] ring-offset-2 ring-offset-canvas' : 'ring-1 ring-transparent hover:ring-border',
					]"
					:aria-label="`Select ${target.label} as tour target`"
					@click="$emit('select-target', target)"
				></button>

				<div :class="[activeTarget.class, 'pointer-events-none absolute']">
					<div
						class="absolute z-10 w-72 max-w-[calc(100vw-3rem)] rounded-lg border border-border bg-canvas p-4 text-left shadow-2xl shadow-black/15"
						:class="tooltipPositionClass"
					>
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.14em]" style="color: var(--tour-accent)">Step preview</p>
								<h3 class="mt-1 text-sm font-semibold text-canvas-fg">{{ step.title }}</h3>
							</div>
							<DomTooltip text="This tooltip uses the selected placement from DomPositionInput.">
								<span class="grid size-7 place-items-center rounded-full bg-secondary text-xs font-semibold text-muted-fg">?</span>
							</DomTooltip>
						</div>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ step.body }}</p>
						<div class="mt-4 flex items-center justify-between gap-3">
							<span class="text-xs text-muted-fg">{{ step.targetLabel }}</span>
							<button type="button" class="rounded-full px-3 py-1.5 text-xs font-semibold text-white" style="background: var(--tour-accent)">
								{{ step.cta }}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
