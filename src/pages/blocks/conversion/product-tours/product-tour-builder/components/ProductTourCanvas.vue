<script setup>
import { computed } from 'vue';
import { DomAvatar, DomBadge, DomButton, DomProgress, DomStatusPill } from '@getdom/studio/vue';

const props = defineProps({
	step: {
		type: Object,
		required: true,
	},
	device: {
		type: String,
		default: 'desktop',
	},
	stepNumber: {
		type: Number,
		default: 1,
	},
	stepCount: {
		type: Number,
		default: 1,
	},
	previewSession: {
		type: Object,
		default: null,
	},
});

const emit = defineEmits(['select-target', 'previous', 'next']);

const appFrameClass = computed(getAppFrameClass);
const tooltipClass = computed(getTooltipClass);
const progress = computed(getProgress);

/**
 * Returns the app-frame width for the selected preview device.
 *
 * @returns {string} Responsive width classes.
 */
function getAppFrameClass() {
	return props.device === 'mobile'
		? 'w-[21rem] max-w-full min-h-[34rem]'
		: 'w-full max-w-4xl min-h-[31rem]';
}

/**
 * Positions the preview tooltip near the selected target.
 *
 * @returns {string} Absolute-position classes.
 */
function getTooltipClass() {
	const targetClasses = {
		'setup-card': props.device === 'mobile' ? 'left-5 top-[9.5rem]' : 'left-[8%] top-[10rem]',
		'connect-data': props.device === 'mobile' ? 'left-5 top-[19rem]' : 'right-[8%] top-[11rem]',
		'invite-button': props.device === 'mobile' ? 'right-4 top-[4.25rem]' : 'right-6 top-[4.4rem]',
		'publish-workflow': props.device === 'mobile' ? 'left-5 bottom-16' : 'right-[9%] bottom-[4.5rem]',
		'usage-insights': props.device === 'mobile' ? 'left-5 top-[7rem]' : 'left-[32%] top-[4.4rem]',
	};
	return targetClasses[props.step.targetId] || targetClasses['setup-card'];
}

/**
 * Calculates preview progress for the active sequence position.
 *
 * @returns {number} Percentage from zero to one hundred.
 */
function getProgress() {
	return Math.round((Math.max(1, props.stepNumber) / Math.max(1, props.stepCount)) * 100);
}

/**
 * Emits a registered target selection from the app canvas.
 *
 * @param {string} targetId Target identifier.
 * @returns {void}
 */
function selectTarget(targetId) {
	emit('select-target', targetId);
}
</script>

<template>
	<section class="flex min-h-0 flex-1 flex-col bg-secondary/30">
		<div class="flex items-center justify-between gap-3 border-b border-border bg-canvas px-4 py-3">
			<div class="min-w-0">
				<p class="truncate text-sm font-semibold">Interactive app canvas</p>
				<p class="truncate text-xs text-muted-fg">{{ step.route }} · {{ step.targetSelector }}</p>
			</div>
			<div class="flex items-center gap-2">
				<DomStatusPill v-if="previewSession" tone="success" size="sm">Preview linked</DomStatusPill>
				<DomBadge tone="neutral" variant="outline">{{ device }}</DomBadge>
			</div>
		</div>

		<div class="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
			<div
				class="relative mx-auto overflow-hidden rounded-xl border border-border bg-canvas shadow-2xl shadow-black/10"
				:class="appFrameClass"
			>
				<header class="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
					<div class="flex min-w-0 items-center gap-3">
						<DomAvatar name="Northstar" initials="N" shape="rounded" size="sm" />
						<div class="min-w-0">
							<p class="truncate text-sm font-semibold">Northstar Product</p>
							<p class="truncate text-xs text-muted-fg">Activation workspace</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<button
							type="button"
							data-tour="usage-insights"
							class="hidden rounded-lg px-3 py-1.5 text-xs font-medium text-muted-fg hover:bg-secondary sm:block"
							@click="selectTarget('usage-insights')"
						>
							Insights
						</button>
						<DomButton data-tour="invite-button" size="sm" variant="secondary" @click="selectTarget('invite-button')">Invite team</DomButton>
					</div>
				</header>

				<div class="p-4 sm:p-5">
					<div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Workspace home</p>
							<h2 class="mt-1 text-xl font-semibold tracking-tight">Good morning, Alex</h2>
						</div>
						<DomStatusPill tone="warning" size="sm">Trial · 9 days</DomStatusPill>
					</div>

					<div class="mt-5 grid gap-4" :class="device === 'mobile' ? 'grid-cols-1' : 'sm:grid-cols-[1.2fr_0.8fr]'">
						<button
							type="button"
							data-tour="setup-card"
							class="rounded-xl border border-border p-4 text-left transition hover:border-primary/40 hover:bg-secondary/30"
							@click="selectTarget('setup-card')"
						>
							<div class="flex items-start justify-between gap-3">
								<div><p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Setup checklist</p><h3 class="mt-2 text-lg font-semibold">Launch your first workflow</h3></div>
								<DomBadge tone="success" variant="soft">68%</DomBadge>
							</div>
							<DomProgress class="mt-4" :value="68" label="Workspace setup" :show-label="false" size="sm" />
							<p class="mt-4 text-sm leading-6 text-muted-fg">Two actions remain before this workspace is ready for its first customer journey.</p>
						</button>

						<div class="grid gap-4">
							<div class="rounded-xl border border-border p-4">
								<p class="text-sm font-semibold">Connect data</p>
								<p class="mt-1 text-xs leading-5 text-muted-fg">Bring product events and account properties into Northstar.</p>
								<DomButton data-tour="connect-data" class="mt-4" size="sm" @click="selectTarget('connect-data')">Connect source</DomButton>
							</div>
							<div class="rounded-xl border border-border p-4">
								<p class="text-sm font-semibold">First workflow</p>
								<p class="mt-1 text-xs leading-5 text-muted-fg">Turn the activation plan into a live customer journey.</p>
								<DomButton data-tour="publish-workflow" class="mt-4" size="sm" variant="secondary" @click="selectTarget('publish-workflow')">Publish workflow</DomButton>
							</div>
						</div>
					</div>
				</div>

				<div class="pointer-events-none absolute z-20 w-72 max-w-[calc(100%-2rem)]" :class="tooltipClass">
					<div class="rounded-xl border border-primary/30 bg-canvas p-4 shadow-2xl shadow-black/20 ring-2 ring-primary/20">
						<div class="flex items-start justify-between gap-3">
							<div><p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Step {{ stepNumber }} of {{ stepCount }}</p><h3 class="mt-1 text-sm font-semibold">{{ step.title }}</h3></div>
							<DomBadge tone="neutral" variant="outline">{{ step.placement }}</DomBadge>
						</div>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ step.body }}</p>
						<div class="mt-4 flex items-center justify-between gap-3">
							<span class="text-xs text-muted-fg">{{ step.targetLabel }}</span>
							<DomButton size="sm">{{ step.cta }}</DomButton>
						</div>
					</div>
				</div>
			</div>
		</div>

		<footer class="flex items-center justify-between gap-3 border-t border-border bg-canvas px-4 py-3">
			<DomButton size="sm" variant="secondary" :disabled="stepNumber <= 1" @click="$emit('previous')">Previous</DomButton>
			<div class="min-w-0 flex-1 px-3">
				<DomProgress :value="progress" label="Tour sequence" :show-label="false" size="sm" />
			</div>
			<DomButton size="sm" variant="secondary" :disabled="stepNumber >= stepCount" @click="$emit('next')">Next</DomButton>
		</footer>
	</section>
</template>
