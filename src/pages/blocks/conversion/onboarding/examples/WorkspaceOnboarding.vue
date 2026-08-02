<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomEmailInput,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTextInput,
} from '@getdom/studio/vue';

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const session = ref(null);
const activeStep = ref('connect');
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const workspaceOpened = ref(false);
const workspaceForm = ref({ name: '', slug: '', teamSize: '', region: '' });
const personalizationForm = ref({ role: '', goals: [] });
const selectedSourceId = ref('linear');
const invitationForm = ref({ email: '', role: 'member' });
const termsAccepted = ref(false);

const activeStepRecord = computed(getActiveStepRecord);
const activeStepIndex = computed(getActiveStepIndex);
const isLaunched = computed(getIsLaunched);
const selectedSource = computed(getSelectedSource);
const canLaunch = computed(getCanLaunch);

/**
 * Resolves the currently selected server-owned setup step.
 *
 * @returns {Record<string, unknown>|null} Active step record.
 */
function getActiveStepRecord() {
	return session.value?.readiness?.steps?.find((step) => step.id === activeStep.value) || null;
}

/**
 * Resolves the active step's zero-based position.
 *
 * @returns {number} Active step index.
 */
function getActiveStepIndex() {
	return Math.max(0, session.value?.readiness?.steps?.findIndex((step) => step.id === activeStep.value) ?? 0);
}

/**
 * Resolves whether the server has activated this workspace.
 *
 * @returns {boolean} Whether launch proof exists.
 */
function getIsLaunched() {
	return session.value?.status === 'active' && Boolean(session.value?.launch);
}

/**
 * Resolves the selected connection source option.
 *
 * @returns {Record<string, unknown>|null} Selected source option.
 */
function getSelectedSource() {
	return bootstrap.value?.options?.sources?.find((source) => source.value === selectedSourceId.value) || null;
}

/**
 * Resolves whether readiness and acknowledgement allow activation.
 *
 * @returns {boolean} Whether the launch action is available.
 */
function getCanLaunch() {
	return Boolean(session.value?.readiness?.readyToLaunch && termsAccepted.value && !busy.value);
}

/**
 * Loads the complete setup contract and resumes the first incomplete step.
 *
 * @returns {Promise<void>}
 */
async function loadBootstrap() {
	loading.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/onboarding/bootstrap');
		bootstrap.value = payload;
		applySession(payload.session, { preserveStep: false });
	} catch (error) {
		errorMessage.value = error.message || 'The onboarding workspace could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Applies server state and synchronizes editable form values.
 *
 * @param {Record<string, unknown>} nextSession Updated session payload.
 * @param {{ preserveStep?: boolean }} options Application options.
 * @returns {void}
 */
function applySession(nextSession, options = {}) {
	session.value = nextSession;
	workspaceForm.value = { ...nextSession.workspace };
	personalizationForm.value = {
		role: nextSession.personalization?.role || '',
		goals: [...(nextSession.personalization?.goals || [])],
	};
	if (nextSession.connection?.sourceId) selectedSourceId.value = nextSession.connection.sourceId;
	if (!options.preserveStep) activeStep.value = nextSession.nextStep || 'workspace';
}

/**
 * Selects a setup step without resetting in-progress fields.
 *
 * @param {string} stepId Step identifier.
 * @returns {void}
 */
function selectStep(stepId) {
	activeStep.value = stepId;
	workspaceOpened.value = false;
	clearFeedback();
}

/**
 * Saves workspace identity through the onboarding API.
 *
 * @returns {Promise<void>}
 */
async function saveWorkspace() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/onboarding/workspace', {
			method: 'PATCH',
			body: { revision: session.value.revision, ...workspaceForm.value },
		});
		applySession(payload.session, { preserveStep: true });
		successMessage.value = payload.message;
		activeStep.value = 'personalize';
	} catch (error) {
		applyRequestError(error, 'Workspace details could not be saved.');
	} finally {
		busy.value = false;
	}
}

/**
 * Toggles one personalization goal while enforcing the three-goal limit.
 *
 * @param {string} goal Goal identifier.
 * @param {boolean} checked Desired selected state.
 * @returns {void}
 */
function toggleGoal(goal, checked) {
	const current = personalizationForm.value.goals;
	if (!checked) {
		personalizationForm.value.goals = current.filter((item) => item !== goal);
		return;
	}
	if (current.includes(goal)) return;
	if (current.length >= 3) {
		errorMessage.value = 'Choose no more than three outcomes so the first workspace stays focused.';
		return;
	}
	personalizationForm.value.goals = [...current, goal];
	clearFeedback({ preserveError: true });
}

/**
 * Saves role and outcome choices through the onboarding API.
 *
 * @returns {Promise<void>}
 */
async function savePersonalization() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/onboarding/personalization', {
			method: 'PATCH',
			body: { revision: session.value.revision, ...personalizationForm.value },
		});
		applySession(payload.session, { preserveStep: true });
		successMessage.value = payload.message;
		activeStep.value = 'connect';
	} catch (error) {
		applyRequestError(error, 'Personalization could not be saved.');
	} finally {
		busy.value = false;
	}
}

/**
 * Connects the selected source and persists import proof.
 *
 * @param {boolean} simulateRestricted Whether to exercise the recoverable Jira permission path.
 * @returns {Promise<void>}
 */
async function connectSource(simulateRestricted = false) {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/onboarding/connections', {
			method: 'POST',
			body: {
				revision: session.value.revision,
				sourceId: selectedSourceId.value,
				simulateRestricted,
			},
		});
		applySession(payload.session, { preserveStep: true });
		successMessage.value = payload.message;
		activeStep.value = 'launch';
	} catch (error) {
		applyRequestError(error, 'The source could not be connected.');
	} finally {
		busy.value = false;
	}
}

/**
 * Adds a teammate invitation with a selected DOM Studio role.
 *
 * @returns {Promise<void>}
 */
async function addInvitation() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/onboarding/invitations', {
			method: 'POST',
			body: { revision: session.value.revision, ...invitationForm.value },
		});
		applySession(payload.session, { preserveStep: true });
		invitationForm.value.email = '';
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The invitation could not be prepared.');
	} finally {
		busy.value = false;
	}
}

/**
 * Removes one pending invitation through the onboarding API.
 *
 * @param {string} invitationId Invitation identifier.
 * @returns {Promise<void>}
 */
async function removeInvitation(invitationId) {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/onboarding/invitations/${encodeURIComponent(invitationId)}`, {
			method: 'DELETE',
			body: { revision: session.value.revision },
		});
		applySession(payload.session, { preserveStep: true });
		successMessage.value = payload.message;
	} catch (error) {
		applyRequestError(error, 'The invitation could not be removed.');
	} finally {
		busy.value = false;
	}
}

/**
 * Activates a ready workspace and stores immutable launch proof.
 *
 * @returns {Promise<void>}
 */
async function launchWorkspace() {
	if (!session.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson('/api/block-demos/onboarding/launch', {
			method: 'POST',
			body: { revision: session.value.revision, termsAccepted: termsAccepted.value },
		});
		applySession(payload.session, { preserveStep: true });
		successMessage.value = payload.message;
		workspaceOpened.value = false;
	} catch (error) {
		applyRequestError(error, 'The workspace could not be launched.');
	} finally {
		busy.value = false;
	}
}

/**
 * Shows the activated workspace handoff without navigating away from the block.
 *
 * @returns {void}
 */
function openWorkspace() {
	workspaceOpened.value = true;
	clearFeedback();
}

/**
 * Applies a structured API error and refreshes stale session state when present.
 *
 * @param {Error & { fields?: Array<Record<string, string>>, payload?: Record<string, unknown> }} error Request error.
 * @param {string} fallback Fallback error message.
 * @returns {void}
 */
function applyRequestError(error, fallback) {
	errorMessage.value = error.message || fallback;
	fieldErrors.value = Object.fromEntries((error.fields || []).map((field) => [field.field, field.message]));
	if (error.payload?.session) applySession(error.payload.session, { preserveStep: true });
}

/**
 * Clears transient success, error, and field feedback.
 *
 * @param {{ preserveError?: boolean }} options Clearing options.
 * @returns {void}
 */
function clearFeedback(options = {}) {
	if (!options.preserveError) errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Resolves semantic status styling for a setup step.
 *
 * @param {Record<string, unknown>} step Step record.
 * @returns {string} DOM Studio status tone.
 */
function stepTone(step) {
	if (session.value?.status === 'active') return 'success';
	if (step.status === 'complete') return 'success';
	if (step.id === activeStep.value) return 'primary';
	return 'neutral';
}

/**
 * Resolves the display label for a selected option.
 *
 * @param {Array<Record<string, unknown>>} options Available options.
 * @param {string} value Selected value.
 * @returns {string} Selected label.
 */
function optionLabel(options, value) {
	return options?.find((option) => option.value === value)?.label || value || 'Not set';
}

/**
 * Formats an ISO timestamp as a concise local time.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Local time label.
 */
function formatTime(value) {
	if (!value) return 'Not yet';
	return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

/**
 * Sends JSON to the demo API and promotes structured errors into exceptions.
 *
 * @param {string} url API route.
 * @param {{ method?: string, body?: Record<string, unknown> }} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const payload = await response.json();
	if (!response.ok || payload.error) {
		const error = new Error(payload.error?.message || `Request failed with ${response.status}.`);
		error.fields = payload.error?.fields || [];
		error.payload = payload.error || payload;
		throw error;
	}
	return payload;
}

onMounted(loadBootstrap);
</script>

<template>
	<div class="h-dvh min-h-[42rem] overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="grid h-full lg:grid-cols-[17rem_minmax(0,1fr)]">
			<aside class="hidden border-r border-border p-6 lg:block">
				<DomSkeleton variant="text" :lines="5" />
			</aside>
			<main class="p-6 sm:p-10">
				<div class="mx-auto max-w-3xl space-y-6">
					<DomSkeleton variant="text" :lines="3" />
					<DomSkeleton height="20rem" />
				</div>
			</main>
		</div>

		<div v-else-if="session && bootstrap" class="grid h-full lg:grid-cols-[17rem_minmax(0,1fr)]">
			<aside class="hidden min-h-0 flex-col border-r border-border bg-secondary/25 lg:flex">
				<div class="flex items-center gap-3 px-6 py-6">
					<DomAvatar :name="bootstrap.product.name" :initials="bootstrap.product.mark" shape="rounded" />
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold">{{ bootstrap.product.name }}</p>
						<p class="text-xs text-muted-fg">Workspace setup</p>
					</div>
				</div>

				<div class="px-6 pb-5">
					<div class="flex items-center justify-between gap-3 text-xs">
						<span class="font-medium">{{ session.readiness.completeCount }} of {{ session.readiness.steps.length }} complete</span>
						<span class="text-muted-fg">{{ session.readiness.percent }}%</span>
					</div>
					<DomProgress class="mt-3" :value="session.readiness.percent" label="Setup progress" size="sm" :show-label="false" />
				</div>

				<nav class="min-h-0 flex-1 overflow-y-auto px-3" aria-label="Setup steps">
					<button
						v-for="(step, index) in session.readiness.steps"
						:key="step.id"
						type="button"
						class="mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-secondary"
						:class="step.id === activeStep ? 'bg-canvas shadow-sm ring-1 ring-border' : ''"
						@click="selectStep(step.id)"
					>
						<span class="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-canvas text-xs font-semibold">{{ index + 1 }}</span>
						<span class="min-w-0 flex-1">
							<span class="flex items-center justify-between gap-2">
								<span class="text-sm font-semibold">{{ step.label }}</span>
								<span v-if="step.status === 'complete'" class="text-[10px] font-semibold uppercase tracking-wider text-success">Done</span>
							</span>
							<span class="mt-1 block text-xs leading-5 text-muted-fg">{{ step.description }}</span>
						</span>
					</button>
				</nav>

				<div class="border-t border-border px-5 py-4">
					<div class="flex items-center gap-3">
						<DomAvatar :name="bootstrap.viewer.name" :initials="bootstrap.viewer.initials" size="sm" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{{ bootstrap.viewer.name }}</p>
							<p class="truncate text-xs text-muted-fg">{{ bootstrap.viewer.email }}</p>
						</div>
						<DomStatusPill :tone="isLaunched ? 'success' : 'primary'" size="sm">{{ isLaunched ? 'Live' : 'Draft' }}</DomStatusPill>
					</div>
				</div>
			</aside>

			<section class="flex min-h-0 min-w-0 flex-col">
				<header class="border-b border-border bg-canvas/95 px-5 py-4 backdrop-blur lg:hidden">
					<div class="flex items-center justify-between gap-4">
						<div class="flex min-w-0 items-center gap-3">
							<DomAvatar :name="bootstrap.product.name" :initials="bootstrap.product.mark" shape="rounded" size="sm" />
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold">{{ bootstrap.product.name }}</p>
								<p class="text-xs text-muted-fg">Step {{ activeStepIndex + 1 }} of {{ session.readiness.steps.length }}</p>
							</div>
						</div>
						<DomStatusPill :tone="isLaunched ? 'success' : 'primary'" size="sm">{{ isLaunched ? 'Live' : `${session.readiness.percent}%` }}</DomStatusPill>
					</div>
					<DomProgress class="mt-3" :value="session.readiness.percent" label="Setup progress" size="sm" :show-label="false" />
					<nav class="mt-3 flex gap-1 overflow-x-auto" aria-label="Setup steps">
						<button
							v-for="(step, index) in session.readiness.steps"
							:key="step.id"
							type="button"
							class="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition"
							:class="step.id === activeStep ? 'bg-primary text-primary-fg' : 'bg-secondary text-secondary-fg'"
							@click="selectStep(step.id)"
						>
							{{ index + 1 }}. {{ step.label }}
						</button>
					</nav>
				</header>

				<main class="min-h-0 flex-1 overflow-y-auto">
					<div v-if="workspaceOpened && isLaunched" class="mx-auto flex min-h-full max-w-4xl flex-col justify-center px-5 py-10 sm:px-8 lg:px-12">
						<div class="max-w-2xl">
							<DomBadge tone="success" variant="soft">Workspace handoff</DomBadge>
							<h2 class="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome to {{ session.workspace.name }}</h2>
							<p class="mt-4 max-w-xl text-base leading-7 text-muted-fg">Your imported work, invited team, and personalized starting views are ready. The first useful action is already waiting.</p>
							<div class="mt-8 border-y border-border py-6">
								<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recommended first project</p>
								<h3 class="mt-2 text-xl font-semibold">Q3 activation roadmap</h3>
								<p class="mt-2 text-sm leading-6 text-muted-fg">A starter project shaped around your selected outcomes and {{ session.connection.importedItems }} imported items.</p>
							</div>
							<div class="mt-6 flex flex-wrap gap-3">
								<DomButton @click="workspaceOpened = false">Review launch receipt</DomButton>
								<DomButton variant="secondary" @click="selectStep('personalize')">Adjust personalization</DomButton>
							</div>
						</div>
					</div>

					<div v-else class="mx-auto w-full max-w-4xl px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
						<div class="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
							<div class="max-w-2xl">
								<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">{{ isLaunched ? 'Setup complete' : 'Workspace activation' }}</p>
								<h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{{ isLaunched ? `${session.workspace.name} is ready` : activeStepRecord?.label }}</h1>
								<p class="mt-3 text-sm leading-6 text-muted-fg">
									{{ isLaunched ? 'Your setup is stored, teammates are queued, and the workspace has immutable launch proof.' : activeStepRecord?.description }}
								</p>
							</div>
							<DomStatusPill :tone="isLaunched ? 'success' : stepTone(activeStepRecord)" :pulse="busy">
								{{ busy ? 'Saving' : isLaunched ? 'Active' : activeStepRecord?.status === 'complete' ? 'Saved' : 'Needs attention' }}
							</DomStatusPill>
						</div>

						<div class="mt-6 space-y-4">
							<DomAlert v-if="errorMessage" tone="danger" title="Check this step" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
							<DomAlert v-if="successMessage" tone="success" title="Saved" :description="successMessage" dismissible @dismiss="successMessage = ''" />
						</div>

						<form v-if="!isLaunched && activeStep === 'workspace'" class="mt-8 max-w-2xl" @submit.prevent="saveWorkspace">
							<div class="grid gap-5 sm:grid-cols-2">
								<DomTextInput v-model="workspaceForm.name" label="Workspace name" placeholder="Northstar Product" :errors="fieldErrors.name || []" required />
								<DomTextInput v-model="workspaceForm.slug" label="Workspace URL" description="northstar.app/workspaces/your-url" placeholder="northstar-product" :errors="fieldErrors.slug || []" required />
								<DomSelect v-model="workspaceForm.teamSize" label="Team size" :options="bootstrap.options.teamSizes" :errors="fieldErrors.teamSize || []" width="min-w-[18rem]" />
								<DomSelect v-model="workspaceForm.region" label="Data region" :options="bootstrap.options.regions" :errors="fieldErrors.region || []" width="min-w-[18rem]">
									<template #option="{ option }">
										<div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div>
									</template>
								</DomSelect>
							</div>
							<div class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
								<p class="text-xs leading-5 text-muted-fg">Changes are revisioned and reloadable.</p>
								<DomButton type="submit" :loading="busy">Save and continue</DomButton>
							</div>
						</form>

						<form v-else-if="!isLaunched && activeStep === 'personalize'" class="mt-8 max-w-2xl" @submit.prevent="savePersonalization">
							<DomSelect v-model="personalizationForm.role" label="What best describes your role?" :options="bootstrap.options.roles" :errors="fieldErrors.role || []" searchable width="min-w-[20rem]">
								<template #option="{ option }">
									<div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div>
								</template>
							</DomSelect>
							<fieldset class="mt-7">
								<legend class="text-sm font-semibold">What should Northstar help with first?</legend>
								<p class="mt-1 text-xs leading-5 text-muted-fg">Choose up to three outcomes. We use them to shape starter views and the first project.</p>
								<div class="mt-4 divide-y divide-border border-y border-border">
									<div v-for="goal in bootstrap.options.goals" :key="goal.value" class="py-4">
										<DomCheckbox
											:model-value="personalizationForm.goals.includes(goal.value)"
											:label="goal.label"
											:description="goal.description"
											@update:model-value="toggleGoal(goal.value, $event)"
										/>
									</div>
								</div>
							</fieldset>
							<div class="mt-8 flex flex-wrap items-center justify-between gap-3">
								<DomButton type="button" variant="secondary" @click="selectStep('workspace')">Back</DomButton>
								<DomButton type="submit" :loading="busy">Save and continue</DomButton>
							</div>
						</form>

						<section v-else-if="!isLaunched && activeStep === 'connect'" class="mt-8 max-w-2xl">
							<div v-if="session.connection" class="flex flex-col gap-4 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<div class="flex flex-wrap items-center gap-2"><h2 class="font-semibold">{{ session.connection.label }}</h2><DomStatusPill tone="success" size="sm">Ready</DomStatusPill></div>
									<p class="mt-1 text-sm text-muted-fg">{{ session.connection.accountLabel }} · {{ session.connection.importedItems }} items · connected {{ formatTime(session.connection.connectedAt) }}</p>
								</div>
								<DomButton variant="secondary" size="sm" @click="selectedSourceId = session.connection.sourceId">Reconnect</DomButton>
							</div>

							<div class="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_14rem]">
								<div>
									<DomSelect v-model="selectedSourceId" label="Import source" :options="bootstrap.options.sources" searchable width="min-w-[20rem]">
										<template #value="{ option, placeholder }">
											<span v-if="option"><span class="font-medium">{{ option.label }}</span><span class="ml-2 text-xs text-muted-fg">{{ option.description }}</span></span>
											<span v-else class="text-muted-fg">{{ placeholder }}</span>
										</template>
										<template #option="{ option }">
											<div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p></div>
										</template>
									</DomSelect>
									<p class="mt-4 text-sm leading-6 text-muted-fg">{{ selectedSource?.description }}</p>
								</div>
								<ol class="space-y-3 border-l border-border pl-5 text-xs leading-5 text-muted-fg">
									<li><span class="font-semibold text-canvas-fg">1. Authorize</span><br />Approve a scoped connection.</li>
									<li><span class="font-semibold text-canvas-fg">2. Inspect</span><br />Review the item count.</li>
									<li><span class="font-semibold text-canvas-fg">3. Continue</span><br />Import runs in the background.</li>
								</ol>
							</div>
							<div class="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
								<DomButton variant="secondary" @click="selectStep('personalize')">Back</DomButton>
								<div class="flex flex-wrap gap-3">
									<DomButton v-if="selectedSourceId === 'jira'" variant="secondary" :loading="busy" @click="connectSource(true)">Test restricted access</DomButton>
									<DomButton :loading="busy" @click="connectSource(false)">{{ selectedSourceId === 'empty' ? 'Use clean workspace' : `Connect ${selectedSource?.label || 'source'}` }}</DomButton>
								</div>
							</div>
						</section>

						<section v-else-if="!isLaunched" class="mt-8 max-w-3xl">
							<form class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end" @submit.prevent="addInvitation">
								<DomEmailInput v-model="invitationForm.email" label="Teammate email" placeholder="name@company.com" :errors="fieldErrors.email || []" />
								<DomSelect v-model="invitationForm.role" label="Role" :options="bootstrap.options.invitationRoles" width="min-w-[15rem]" />
								<DomButton type="submit" :loading="busy">Add invite</DomButton>
							</form>

							<div class="mt-7 border-y border-border">
								<div class="flex items-center gap-3 py-4">
									<DomAvatar :name="bootstrap.viewer.name" :initials="bootstrap.viewer.initials" size="sm" />
									<div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">{{ bootstrap.viewer.email }}</p><p class="text-xs text-muted-fg">Workspace owner</p></div>
									<DomBadge tone="primary" variant="soft">Owner</DomBadge>
								</div>
								<div v-for="invitation in session.invitations" :key="invitation.id" class="flex items-center gap-3 border-t border-border py-4">
									<DomAvatar :name="invitation.email" size="sm" />
									<div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">{{ invitation.email }}</p><p class="text-xs text-muted-fg">Invite prepared · {{ optionLabel(bootstrap.options.invitationRoles, invitation.role) }}</p></div>
									<DomButton variant="ghost" size="sm" :disabled="busy" @click="removeInvitation(invitation.id)">Remove</DomButton>
								</div>
							</div>

							<div class="mt-8 bg-secondary/50 p-5 sm:p-6">
								<div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
									<div class="max-w-xl">
										<h2 class="font-semibold">Ready to activate {{ session.workspace.name }}</h2>
										<p class="mt-2 text-sm leading-6 text-muted-fg">Launch creates the workspace, queues {{ session.invitations.length }} invitation{{ session.invitations.length === 1 ? '' : 's' }}, and records a signed setup receipt.</p>
									</div>
									<DomStatusPill :tone="session.readiness.readyToLaunch ? 'success' : 'warning'">{{ session.readiness.completeCount }}/4 ready</DomStatusPill>
								</div>
								<div class="mt-5 border-t border-border pt-5">
									<DomCheckbox v-model="termsAccepted" label="I confirm these workspace settings" description="The data region and workspace URL cannot be changed during activation." />
								</div>
							</div>

							<div class="mt-6 flex flex-wrap items-center justify-between gap-3">
								<DomButton variant="secondary" @click="selectStep('connect')">Back</DomButton>
								<DomButton :disabled="!canLaunch" :loading="busy" @click="launchWorkspace">Launch workspace</DomButton>
							</div>
						</section>

						<section v-else class="mt-8 max-w-3xl">
							<div class="border-y border-success/30 bg-success/5 py-6 sm:px-6">
								<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div><DomStatusPill tone="success">Workspace active</DomStatusPill><h2 class="mt-3 text-xl font-semibold">Launch {{ session.launch.reference }} completed</h2><p class="mt-2 text-sm leading-6 text-muted-fg">{{ session.invitations.length }} teammate invitation{{ session.invitations.length === 1 ? '' : 's' }} queued and {{ session.connection.importedItems }} source items ready.</p></div>
									<DomButton @click="openWorkspace">Open workspace</DomButton>
								</div>
							</div>

							<dl class="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
								<div><dt class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Workspace</dt><dd class="mt-1 text-sm font-medium">{{ session.workspace.name }}</dd></div>
								<div><dt class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Region</dt><dd class="mt-1 text-sm font-medium">{{ optionLabel(bootstrap.options.regions, session.workspace.region) }}</dd></div>
								<div><dt class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Source</dt><dd class="mt-1 text-sm font-medium">{{ session.connection.label }} · {{ session.connection.importedItems }} items</dd></div>
								<div><dt class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Launched</dt><dd class="mt-1 text-sm font-medium">{{ formatTime(session.launch.launchedAt) }}</dd></div>
							</dl>

							<div class="mt-8 border-t border-border pt-6">
								<p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Launch proof</p>
								<code class="mt-2 block break-all rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-fg">{{ session.launch.proof }}</code>
							</div>
						</section>
					</div>
				</main>
			</section>
		</div>

		<div v-else class="grid h-full place-items-center p-6">
			<DomAlert class="max-w-lg" tone="danger" title="Onboarding unavailable" :description="errorMessage || 'The onboarding session could not be loaded.'">
				<template #actions><DomButton variant="secondary" @click="loadBootstrap">Try again</DomButton></template>
			</DomAlert>
		</div>
	</div>
</template>
