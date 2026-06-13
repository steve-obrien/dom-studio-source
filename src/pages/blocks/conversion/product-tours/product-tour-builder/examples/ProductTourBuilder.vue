<script setup>
import { computed, ref } from 'vue';
import {
	DomAutocomplete,
	DomBadge,
	DomButton,
	DomColorInput,
	DomDatePicker,
	DomDialog,
	DomPositionInput,
	DomRadioGroup,
	DomStatusPill,
	DomTagCombobox,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';
import LaunchChecklist from '../components/LaunchChecklist.vue';
import ProductTourCanvas from '../components/ProductTourCanvas.vue';
import TourStepRail from '../components/TourStepRail.vue';

const goalOptions = [
	{
		label: 'Activation',
		value: 'activation',
		description: 'Help new workspaces finish the setup path.',
		metric: 'Aha moment',
	},
	{
		label: 'Adoption',
		value: 'adoption',
		description: 'Introduce a released feature to qualified accounts.',
		metric: 'Feature usage',
	},
	{
		label: 'Expansion',
		value: 'expansion',
		description: 'Guide qualified teams toward paid capabilities.',
		metric: 'Upgrade intent',
	},
];

const targetOptions = [
	{ label: 'Setup checklist card', value: '[data-tour="setup-card"]', id: 'setup-card', description: 'Dashboard home / checklist container', screen: 'Home' },
	{ label: 'Invite team button', value: '[data-tour="invite-button"]', id: 'invite-button', description: 'Primary invite action in top bar', screen: 'Home' },
	{ label: 'Connect data tile', value: '[data-tour="connect-data"]', id: 'connect-data', description: 'Data source setup card', screen: 'Home' },
	{ label: 'Publish workflow button', value: '[data-tour="publish-workflow"]', id: 'publish-workflow', description: 'Workflow launch CTA', screen: 'Home' },
	{ label: 'Usage insights tab', value: '[data-tour="usage-insights"]', id: 'setup-card', description: 'Analytics tab for activated accounts', screen: 'Insights' },
];

const audienceOptions = [
	{ label: 'Trial admins', value: 'trial-admins', description: 'Workspace owners inside the first 14 days', count: '12.4k' },
	{ label: 'No connected source', value: 'no-connected-source', description: 'Workspaces missing their first data connection', count: '8.1k' },
	{ label: 'Invited no project', value: 'invited-no-project', description: 'Accepted invite but has not started setup', count: '6k' },
	{ label: 'Starter owners', value: 'starter-owners', description: 'Paid self-serve accounts with upgrade signals', count: '3.8k' },
	{ label: 'Recently dismissed', value: 'recently-dismissed', description: 'Suppression segment for people who opted out', count: '-1.2k' },
];

const previewModeOptions = [
	{ label: 'Desktop', value: 'desktop' },
	{ label: 'Mobile', value: 'mobile' },
];

const triggerOptions = [
	{ label: 'Page load', value: 'page-load' },
	{ label: 'Intent', value: 'intent' },
	{ label: 'Manual', value: 'manual' },
];

const steps = ref([
	{
		id: 'step-setup',
		title: 'Show setup progress',
		body: 'Start with the setup checklist so new admins can see what is left before activation.',
		cta: 'Show me',
		targetId: 'setup-card',
		targetLabel: 'Setup checklist card',
		targetSelector: '[data-tour="setup-card"]',
		targetQuery: 'Setup checklist card',
		placement: 'bottom-start',
		status: 'Ready',
	},
	{
		id: 'step-connect',
		title: 'Connect source data',
		body: 'Point teams to the data source that unlocks dashboards, automations, and account health.',
		cta: 'Connect source',
		targetId: 'connect-data',
		targetLabel: 'Connect data tile',
		targetSelector: '[data-tour="connect-data"]',
		targetQuery: 'Connect data tile',
		placement: 'start-top',
		status: 'Needs QA',
	},
	{
		id: 'step-invite',
		title: 'Invite collaborators',
		body: 'Ask admins to bring reviewers into the workspace before they publish their first workflow.',
		cta: 'Invite team',
		targetId: 'invite-button',
		targetLabel: 'Invite team button',
		targetSelector: '[data-tour="invite-button"]',
		targetQuery: 'Invite team button',
		placement: 'bottom-end',
		status: 'Draft',
	},
	{
		id: 'step-publish',
		title: 'Publish the first workflow',
		body: 'Close the loop by guiding activated teams to ship their first automated workflow.',
		cta: 'Publish',
		targetId: 'publish-workflow',
		targetLabel: 'Publish workflow button',
		targetSelector: '[data-tour="publish-workflow"]',
		targetQuery: 'Publish workflow button',
		placement: 'top-start',
		status: 'Ready',
	},
]);

const activeStepId = ref('step-connect');
const goal = ref('activation');
const previewMode = ref('desktop');
const triggerMode = ref('page-load');
const accentColor = ref('#2563eb');
const launchDate = ref('2026-06-19');
const audiences = ref(['trial-admins', 'no-connected-source']);
const publishDialogOpen = ref(false);
const publishState = ref('Draft saved 3 minutes ago');

const activeStep = computed(() => steps.value.find((step) => step.id === activeStepId.value) || steps.value[0]);
const selectedGoal = computed(() => goalOptions.find((option) => option.value === goal.value) || goalOptions[0]);
const selectedAudienceRecords = computed(() => audiences.value.map((value) => audienceOptions.find((option) => option.value === value)).filter(Boolean));
const estimatedReach = computed(() => {
	return selectedAudienceRecords.value.reduce((total, audience) => {
		const numericCount = Number.parseFloat(String(audience.count).replace(/[^\d.-]/g, ''));
		if (!Number.isFinite(numericCount)) return total;
		return total + (audience.count.includes('k') ? numericCount * 1000 : numericCount);
	}, 0);
});
const completedSteps = computed(() => steps.value.filter((step) => step.status === 'Ready').length);
const checks = computed(() => [
	{
		id: 'selectors',
		label: 'Target selectors resolve',
		status: steps.value.every((step) => step.targetSelector) ? 'Passed' : 'Blocked',
		detail: `${steps.value.filter((step) => step.targetSelector).length} selectors mapped to app surfaces.`,
	},
	{
		id: 'placement',
		label: 'Tooltip placement reviewed',
		status: steps.value.some((step) => step.status === 'Needs QA') ? 'Warning' : 'Passed',
		detail: steps.value.some((step) => step.status === 'Needs QA') ? 'One tooltip needs mobile collision QA.' : 'All placements have passed QA.',
	},
	{
		id: 'approval',
		label: 'All steps approved',
		status: steps.value.every((step) => step.status === 'Ready') ? 'Passed' : 'Warning',
		detail: `${completedSteps.value} of ${steps.value.length} steps are marked ready.`,
	},
	{
		id: 'audience',
		label: 'Audience and suppression set',
		status: audiences.value.length >= 2 ? 'Passed' : 'Warning',
		detail: `${selectedAudienceRecords.value.length} audience rules selected with ${(estimatedReach.value / 1000).toFixed(1)}k estimated reach.`,
	},
	{
		id: 'schedule',
		label: 'Launch schedule selected',
		status: launchDate.value ? 'Passed' : 'Blocked',
		detail: launchDate.value ? `Scheduled for ${launchDate.value}.` : 'Pick a launch date before publishing.',
	},
]);
const readyToPublish = computed(() => checks.value.every((check) => check.status === 'Passed'));
const launchPayload = computed(() => ({
	tourId: 'tour_activation_v4',
	goal: goal.value,
	accentColor: accentColor.value,
	launchDate: launchDate.value,
	trigger: triggerMode.value,
	audiences: audiences.value,
	steps: steps.value.map((step, index) => ({
		order: index + 1,
		title: step.title,
		targetSelector: step.targetSelector,
		placement: step.placement,
		cta: step.cta,
		status: step.status,
	})),
}));

function selectStep(stepId) {
	activeStepId.value = stepId;
	publishState.value = 'Step selected';
}

function selectTarget(target) {
	activeStep.value.targetId = target.id;
	activeStep.value.targetLabel = target.label;
	activeStep.value.targetQuery = target.label;
	activeStep.value.targetSelector = target.value || `[data-tour="${target.id}"]`;
	activeStep.value.status = 'Needs QA';
	publishState.value = 'Target changed';
}

function selectCanvasTarget(target) {
	selectTarget({
		...target,
		value: `[data-tour="${target.id}"]`,
	});
}

function applyAutocompleteTarget(event) {
	if (!event.item) return;
	selectTarget(event.item);
}

function markStepReady() {
	activeStep.value.status = 'Ready';
	publishState.value = 'Step marked ready';
}

function saveDraft() {
	publishState.value = 'Draft saved just now';
}

function publishTour() {
	publishState.value = readyToPublish.value ? 'Tour scheduled' : 'Review checks before publishing';
	if (readyToPublish.value) publishDialogOpen.value = false;
}
</script>

<template>
	<section class="min-h-screen bg-canvas text-canvas-fg">
		<div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
			<header class="rounded-lg border border-border skin-card px-4 py-4 sm:px-5">
				<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<DomStatusPill tone="info" size="sm">Draft tour</DomStatusPill>
							<DomBadge tone="neutral" variant="outline">{{ publishState }}</DomBadge>
						</div>
						<h1 class="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Product tour builder</h1>
						<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
							Build guided onboarding moments in context, tune tooltip placement, target the right accounts, and clear launch checks before release.
						</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<DomButton variant="secondary" @click="saveDraft">Save draft</DomButton>
						<DomButton :disabled="!readyToPublish" @click="publishDialogOpen = true">Publish tour</DomButton>
					</div>
				</div>
			</header>

			<TourStepRail :steps="steps" :active-step-id="activeStepId" @select="selectStep" />

			<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
				<div class="grid min-w-0 gap-4">
					<ProductTourCanvas
						:step="activeStep"
						:accent-color="accentColor"
						:preview-mode="previewMode"
						@select-target="selectCanvasTarget"
					/>

					<section class="rounded-lg border border-border skin-card p-4">
						<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Step inspector</p>
								<h2 class="mt-1 text-lg font-semibold text-canvas-fg">{{ activeStep.title }}</h2>
								<p class="mt-1 text-sm leading-6 text-muted-fg">Edit the selected moment, then mark it ready when placement, copy, and target behavior are reviewed.</p>
							</div>
							<DomToggleButtonGroup
								v-model="previewMode"
								label="Preview mode"
								:options="previewModeOptions"
								size="sm"
								chrome="none"
							/>
						</div>

						<div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
							<div class="grid gap-4">
								<label class="block">
									<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Step title</span>
									<input
										v-model="activeStep.title"
										class="mt-1 block h-10 w-full rounded-lg border border-input bg-canvas px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
									/>
								</label>
								<label class="block">
									<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Tooltip body</span>
									<textarea
										v-model="activeStep.body"
										rows="4"
										class="mt-1 block w-full resize-none rounded-lg border border-input bg-canvas px-3 py-2 text-sm leading-6 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
									></textarea>
								</label>
								<div class="grid gap-4 md:grid-cols-2">
									<DomAutocomplete
										v-model="activeStep.targetQuery"
										label="Target element"
										placeholder="Search app target..."
										:options="targetOptions"
										@select="applyAutocompleteTarget"
									>
										<template #item="{ item }">
											<div class="flex items-start justify-between gap-3">
												<div>
													<p class="text-sm font-semibold text-canvas-fg">{{ item.label }}</p>
													<p class="mt-0.5 text-xs text-muted-fg">{{ item.description }}</p>
												</div>
												<span class="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-fg">{{ item.screen }}</span>
											</div>
										</template>
									</DomAutocomplete>
									<label class="block">
										<span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">CTA label</span>
										<input
											v-model="activeStep.cta"
											class="mt-1 block h-10 w-full rounded-lg border border-input bg-canvas px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25"
										/>
									</label>
								</div>
								<DomToggleButtonGroup
									v-model="triggerMode"
									label="Trigger"
									:options="triggerOptions"
									size="sm"
									chrome="none"
								/>
							</div>

							<div class="grid gap-4">
								<DomPositionInput
									v-model="activeStep.placement"
									label="Tooltip placement"
									description="Pick the preferred anchor position around the selected target."
									@update:model-value="activeStep.status = 'Needs QA'"
								/>
								<DomColorInput
									v-model="accentColor"
									label="Tour accent"
									description="Used for selected target outlines and the preview CTA."
								/>
								<DomButton variant="secondary" @click="markStepReady">Mark step ready</DomButton>
							</div>
						</div>
					</section>
				</div>

				<aside class="grid content-start gap-4">
					<section class="rounded-lg border border-border skin-card p-4">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Launch plan</p>
						<h2 class="mt-1 text-lg font-semibold text-canvas-fg">{{ selectedGoal.label }} tour</h2>
						<p class="mt-1 text-sm leading-6 text-muted-fg">{{ selectedGoal.description }}</p>
						<div class="mt-4 grid gap-4">
							<DomRadioGroup
								v-model="goal"
								label="Goal"
								:options="goalOptions"
								chrome="none"
							>
								<template #option="{ option }">
									<span class="min-w-0">
										<span class="block text-sm font-semibold text-canvas-fg">{{ option.label }}</span>
										<span class="mt-0.5 block text-xs leading-5 text-muted-fg">{{ option.metric }}</span>
									</span>
								</template>
							</DomRadioGroup>
							<DomDatePicker
								v-model="launchDate"
								label="Launch date"
								date-format="dd/mm/yyyy"
								description="Schedule the first eligible audience evaluation."
							/>
							<DomTagCombobox
								v-model="audiences"
								label="Audience rules"
								placeholder="Add segment..."
								:options="audienceOptions"
								clearable
							>
								<template #item="{ item }">
									<div class="flex items-start justify-between gap-3">
										<div>
											<p class="text-sm font-semibold text-canvas-fg">{{ item.label }}</p>
											<p class="mt-0.5 text-xs text-muted-fg">{{ item.description }}</p>
										</div>
										<span class="text-xs font-semibold text-muted-fg">{{ item.count }}</span>
									</div>
								</template>
								<template #tag="{ item, label, remove }">
									<button
										type="button"
										class="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs font-medium text-canvas-fg"
										@click="remove"
									>
										{{ item?.label || label }}
										<span aria-hidden="true">x</span>
									</button>
								</template>
							</DomTagCombobox>
						</div>
						<div class="mt-4 rounded-lg border border-border bg-canvas p-3">
							<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Estimated reach</p>
							<p class="mt-1 text-2xl font-semibold tracking-tight text-canvas-fg">{{ Math.max(0, estimatedReach).toLocaleString() }}</p>
							<p class="mt-1 text-xs leading-5 text-muted-fg">After selected inclusions and suppression rules.</p>
						</div>
					</section>

					<LaunchChecklist :checks="checks" />

					<section class="rounded-lg border border-border skin-card p-4">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Payload preview</p>
						<pre class="mt-3 max-h-64 overflow-auto rounded-lg bg-secondary p-3 text-xs leading-5 text-muted-fg">{{ JSON.stringify(launchPayload, null, 2) }}</pre>
					</section>
				</aside>
			</div>
		</div>

		<DomDialog
			v-model="publishDialogOpen"
			title="Publish product tour"
			description="Review the release contract before this tour is scheduled for eligible workspaces."
		>
			<div class="grid gap-3 text-sm">
				<div class="rounded-lg border border-border bg-canvas p-3">
					<p class="font-semibold text-canvas-fg">{{ completedSteps }} ready steps</p>
					<p class="mt-1 text-muted-fg">All copy, targets, and placements should be approved before publishing.</p>
				</div>
				<div class="rounded-lg border border-border bg-canvas p-3">
					<p class="font-semibold text-canvas-fg">{{ Math.max(0, estimatedReach).toLocaleString() }} estimated eligible accounts</p>
					<p class="mt-1 text-muted-fg">Audience rules and suppression must be enforced by your backend.</p>
				</div>
				<div class="rounded-lg border border-border bg-canvas p-3">
					<p class="font-semibold text-canvas-fg">Launch date {{ launchDate }}</p>
					<p class="mt-1 text-muted-fg">Publishing creates a scheduled draft job, not an immediate uncontrolled release.</p>
				</div>
			</div>
			<template #footer>
				<DomButton variant="secondary" data-close>Cancel</DomButton>
				<DomButton :disabled="!readyToPublish" @click="publishTour">Schedule tour</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
