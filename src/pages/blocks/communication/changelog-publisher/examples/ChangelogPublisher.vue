<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmptyState,
	DomProgress,
	DomSelect,
	DomSpinner,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const mobileTabs = [
	{ key: 'write', label: 'Write' },
	{ key: 'preview', label: 'Preview' },
	{ key: 'publish', label: 'Publish' },
];

const rightTabs = [
	{ key: 'preview', label: 'Preview' },
	{ key: 'publish', label: 'Publish' },
];

const previewTabs = [
	{ key: 'in_app', label: 'In-app' },
	{ key: 'email', label: 'Email' },
	{ key: 'public', label: 'Public' },
];

const releaseList = ref([]);
const release = ref(null);
const selectedReleaseId = ref('workflow');
const mobileView = ref('write');
const desktopPanel = ref('preview');
const activePreview = ref('in_app');
const headline = ref('');
const summary = ref('');
const audience = ref('');
const reviewerId = ref('');
const schedule = ref('');
const approvalRequired = ref(true);
const channels = ref({});
const includedNoteIds = ref([]);
const savedFingerprint = ref('');
const actionError = ref('');
const isLoading = ref(true);
const isSaving = ref(false);
const isActing = ref(false);
const lifecycleDialogOpen = ref(false);

const releaseOptions = computed(() => releaseList.value.map((item) => ({
	label: item.internalTitle,
	value: item.id,
	description: `${item.version} · ${item.statusLabel}`,
	statusLabel: item.statusLabel,
	statusTone: item.statusTone,
})));

const editable = computed(() => release.value?.status === 'draft');
const selectedNotes = computed(() => release.value?.notes.filter((note) => includedNoteIds.value.includes(note.id)) || []);
const enabledChannels = computed(() => release.value?.channelCatalog.filter((channel) => channels.value[channel.id]) || []);
const currentPreview = computed(() => release.value?.previews.find((preview) => preview.id === activePreview.value) || null);
const draftFingerprint = computed(() => JSON.stringify(buildDraftPayload(false)));
const isDirty = computed(() => editable.value && draftFingerprint.value !== savedFingerprint.value);
const incompleteChecks = computed(() => release.value?.checks.filter((check) => !check.passed) || []);
const releaseLocked = computed(() => release.value?.status === 'scheduled' || release.value?.status === 'published');
const primaryActionLabel = computed(() => {
	if (!release.value) return 'Review release';
	if (release.value.status === 'draft') return 'Review release';
	if (release.value.status === 'in-review') return `Approve as ${release.value.reviewer.label}`;
	if (release.value.status === 'approved') return release.value.schedule === 'now' ? 'Publish now' : 'Schedule release';
	return 'View publication';
});
const lifecycleTitle = computed(() => {
	if (!release.value) return 'Review release';
	if (release.value.status === 'draft') return 'Request release review?';
	if (release.value.status === 'in-review') return 'Approve this release?';
	if (release.value.status === 'approved') return release.value.schedule === 'now' ? 'Publish this release now?' : 'Schedule this release?';
	return 'Publication proof';
});
const lifecycleDescription = computed(() => {
	if (!release.value) return '';
	if (release.value.status === 'draft') return 'The server will verify copy, release notes, audience, channels, schedule, and breaking-change safeguards before assigning the review.';
	if (release.value.status === 'in-review') return `${release.value.reviewer.label} is confirming the audience and every enabled channel preview.`;
	if (release.value.status === 'approved') return `${enabledChannels.value.length} channel deliveries will use ${release.value.scheduleLabel.toLowerCase()}.`;
	return release.value.publication?.statusLabel || 'Publication is complete.';
});

onMounted(loadReleases);

/**
 * Fetches JSON and promotes API errors into ordinary exceptions.
 *
 * @param {string} url API URL.
 * @param {RequestInit} [options] Fetch options.
 * @returns {Promise<any>} Parsed JSON response.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
		...options,
	});
	const payload = await response.json();
	if (!response.ok) {
		const error = new Error(payload.error || 'The changelog request could not be completed.');
		error.payload = payload;
		throw error;
	}
	return payload;
}

/**
 * Loads the release navigation and opens the selected workflow.
 *
 * @returns {Promise<void>} Resolves after the release is ready.
 */
async function loadReleases() {
	isLoading.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/changelog-publisher/releases');
		releaseList.value = payload.releases;
		if (!releaseList.value.some((item) => item.id === selectedReleaseId.value)) selectedReleaseId.value = releaseList.value[0]?.id || '';
		if (selectedReleaseId.value) await loadRelease(selectedReleaseId.value);
	} catch (error) {
		actionError.value = error.message;
	} finally {
		isLoading.value = false;
	}
}

/**
 * Loads one release and resets the local editor to its persisted draft.
 *
 * @param {string} releaseId Release identifier.
 * @returns {Promise<void>} Resolves after the release is applied.
 */
async function loadRelease(releaseId) {
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/changelog-publisher/${releaseId}`);
		selectedReleaseId.value = releaseId;
		applyRelease(payload.release);
		mobileView.value = payload.release.publication ? 'publish' : 'write';
		desktopPanel.value = payload.release.publication ? 'publish' : 'preview';
	} catch (error) {
		actionError.value = error.message;
	}
}

/**
 * Applies a server release to the editor and refreshes its navigation summary.
 *
 * @param {object} nextRelease Server release.
 * @returns {void}
 */
function applyRelease(nextRelease) {
	release.value = nextRelease;
	headline.value = nextRelease.headline;
	summary.value = nextRelease.summary;
	audience.value = nextRelease.audience;
	reviewerId.value = nextRelease.reviewerId;
	schedule.value = nextRelease.schedule;
	approvalRequired.value = nextRelease.approvalRequired;
	channels.value = { ...nextRelease.channels };
	includedNoteIds.value = nextRelease.notes.filter((note) => note.included).map((note) => note.id);
	savedFingerprint.value = JSON.stringify(buildDraftPayload(false));
	syncReleaseSummary(nextRelease);
	if (!nextRelease.previews.some((preview) => preview.id === activePreview.value && preview.enabled)) {
		activePreview.value = nextRelease.previews.find((preview) => preview.enabled)?.id || 'in_app';
	}
}

/**
 * Replaces the matching compact navigation record after a mutation.
 *
 * @param {object} nextRelease Updated release.
 * @returns {void}
 */
function syncReleaseSummary(nextRelease) {
	const summaryRecord = {
		id: nextRelease.id,
		version: nextRelease.version,
		internalTitle: nextRelease.internalTitle,
		status: nextRelease.status,
		statusLabel: nextRelease.statusLabel,
		statusTone: nextRelease.statusTone,
		releaseDate: nextRelease.releaseDate,
		audienceLabel: nextRelease.audienceLabel,
		readiness: nextRelease.readiness,
	};
	releaseList.value = releaseList.value.map((item) => item.id === nextRelease.id ? summaryRecord : item);
}

/**
 * Builds the complete draft payload expected by the API.
 *
 * @param {boolean} [includeRevision=true] Whether to include the current optimistic revision.
 * @returns {object} Changelog draft payload.
 */
function buildDraftPayload(includeRevision = true) {
	return {
		...(includeRevision ? { revision: release.value?.revision } : {}),
		headline: headline.value,
		summary: summary.value,
		audience: audience.value,
		reviewerId: reviewerId.value,
		schedule: schedule.value,
		approvalRequired: approvalRequired.value,
		channels: { ...channels.value },
		includedNoteIds: [...includedNoteIds.value],
	};
}

/**
 * Persists the complete editable release draft.
 *
 * @returns {Promise<boolean>} True when the draft saves successfully.
 */
async function saveDraft() {
	if (!release.value || !editable.value) return false;
	isSaving.value = true;
	actionError.value = '';
	try {
		const payload = await requestJson(`/api/block-demos/changelog-publisher/${release.value.id}/draft`, {
			method: 'PATCH',
			body: JSON.stringify(buildDraftPayload()),
		});
		applyRelease(payload.release);
		return true;
	} catch (error) {
		actionError.value = error.message;
		return false;
	} finally {
		isSaving.value = false;
	}
}

/**
 * Opens the lifecycle confirmation or exposes existing publication proof.
 *
 * @returns {void}
 */
function handlePrimaryAction() {
	if (releaseLocked.value) {
		mobileView.value = 'publish';
		desktopPanel.value = 'publish';
		return;
	}
	lifecycleDialogOpen.value = true;
}

/**
 * Runs request-review, approval, or publication for the current release state.
 *
 * @returns {Promise<void>} Resolves after the lifecycle mutation finishes.
 */
async function confirmLifecycleAction() {
	if (!release.value) return;
	isActing.value = true;
	actionError.value = '';
	try {
		if (release.value.status === 'draft' && isDirty.value) {
			const saved = await saveDraft();
			if (!saved) return;
		}
		let path = 'request-review';
		let body = { revision: release.value.revision };
		if (release.value.status === 'in-review') {
			path = 'approve';
			body = { revision: release.value.revision, reviewerId: release.value.reviewerId };
		} else if (release.value.status === 'approved') {
			path = 'publish';
		}
		const payload = await requestJson(`/api/block-demos/changelog-publisher/${release.value.id}/${path}`, {
			method: 'POST',
			body: JSON.stringify(body),
		});
		applyRelease(payload.release);
		lifecycleDialogOpen.value = false;
		mobileView.value = 'publish';
		desktopPanel.value = 'publish';
	} catch (error) {
		actionError.value = error.message;
	} finally {
		isActing.value = false;
	}
}

/**
 * Toggles one customer-facing release note.
 *
 * @param {string} noteId Release-note identifier.
 * @param {boolean} included Whether the note should be published.
 * @returns {void}
 */
function setNoteIncluded(noteId, included) {
	if (!editable.value) return;
	if (included) includedNoteIds.value = [...new Set([...includedNoteIds.value, noteId])];
	else includedNoteIds.value = includedNoteIds.value.filter((id) => id !== noteId);
}

/**
 * Toggles one publication channel.
 *
 * @param {string} channelId Channel identifier.
 * @param {boolean} enabled Whether the channel should receive the release.
 * @returns {void}
 */
function setChannelEnabled(channelId, enabled) {
	if (!editable.value) return;
	channels.value = { ...channels.value, [channelId]: enabled };
	if (!enabled && activePreview.value === channelId) {
		activePreview.value = release.value?.previews.find((preview) => preview.id !== channelId && channels.value[preview.id])?.id || 'in_app';
	}
}

/**
 * Chooses a release from a rich selector or the desktop rail.
 *
 * @param {string} releaseId Release identifier.
 * @returns {Promise<void>} Resolves after the selected release loads.
 */
async function selectRelease(releaseId) {
	if (!releaseId || releaseId === selectedReleaseId.value) return;
	await loadRelease(releaseId);
}

/**
 * Returns a channel-specific call-to-action label for the preview.
 *
 * @param {string} previewId Preview channel identifier.
 * @returns {string} Preview call to action.
 */
function previewActionLabel(previewId) {
	if (previewId === 'email') return 'Open your workspace';
	if (previewId === 'public') return 'Read the documentation';
	return 'See what changed';
}
</script>

<template>
	<section class="relative flex h-dvh w-full flex-col overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="isLoading" class="grid h-full place-items-center">
			<div class="flex items-center gap-3 text-sm text-muted-fg">
				<DomSpinner size="sm" />
				Loading release workspace
			</div>
		</div>

		<DomEmptyState
			v-else-if="!release"
			class="m-auto max-w-lg"
			title="Release workspace unavailable"
			description="The changelog API did not return a release. Retry after the demo server is available."
		>
			<DomButton @click="loadReleases">Retry</DomButton>
		</DomEmptyState>

		<template v-else>
			<header class="shrink-0 border-b border-border px-4 py-3 sm:px-6">
				<div class="mx-auto flex w-full max-w-[90rem] flex-col gap-3 lg:flex-row lg:items-center">
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2">
							<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Release publisher</p>
							<DomStatusPill :tone="release.statusTone" :label="release.statusLabel" size="sm" />
							<DomBadge v-if="isDirty" tone="warning" size="sm">Unsaved</DomBadge>
						</div>
						<h1 class="mt-1 truncate text-lg font-semibold tracking-tight sm:text-xl">{{ release.internalTitle }}</h1>
					</div>

					<DomSelect
						:model-value="selectedReleaseId"
						class="w-full lg:w-80"
						label="Release"
						:options="releaseOptions"
						width="min-w-[19rem] max-w-[calc(100vw-2rem)]"
						@update:model-value="selectRelease"
					>
						<template #option="{ option }">
							<div class="flex items-start justify-between gap-4">
								<div class="min-w-0">
									<p class="truncate font-medium">{{ option.label }}</p>
									<p class="mt-1 text-xs opacity-75">{{ option.description }}</p>
								</div>
								<DomStatusPill :tone="option.statusTone" :label="option.statusLabel" size="sm" />
							</div>
						</template>
					</DomSelect>

					<div class="hidden shrink-0 items-center gap-2 sm:flex">
						<DomButton v-if="editable" variant="secondary" :disabled="!isDirty" :loading="isSaving" @click="saveDraft">Save draft</DomButton>
						<DomButton :loading="isActing" @click="handlePrimaryAction">{{ primaryActionLabel }}</DomButton>
					</div>
				</div>
			</header>

			<DomTabs
				v-model="mobileView"
				:tabs="mobileTabs"
				variant="page"
				class="shrink-0 md:hidden [&>div:last-child]:hidden"
			/>

			<div class="flex min-h-0 flex-1">
				<aside class="hidden w-60 shrink-0 overflow-y-auto border-r border-border lg:block">
					<div class="px-4 pb-2 pt-5">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Release train</p>
					</div>
					<nav aria-label="Changelog releases">
						<button
							v-for="item in releaseList"
							:key="item.id"
							type="button"
							class="w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/40"
							:class="item.id === selectedReleaseId ? 'border-l-primary bg-secondary/50' : 'border-l-transparent'"
							@click="selectRelease(item.id)"
						>
							<div class="flex items-start justify-between gap-2">
								<p class="min-w-0 truncate text-sm font-semibold">{{ item.internalTitle }}</p>
								<DomStatusPill :tone="item.statusTone" :label="item.statusLabel" size="sm" />
							</div>
							<p class="mt-1 text-xs text-muted-fg">{{ item.version }} · {{ item.releaseDate }}</p>
							<div class="mt-3 flex items-center gap-2">
								<DomProgress class="min-w-0 flex-1" :value="item.readiness" :show-label="false" size="sm" />
								<span class="text-xs font-medium text-muted-fg">{{ item.readiness }}%</span>
							</div>
						</button>
					</nav>
				</aside>

				<main
					class="min-w-0 flex-1 flex-col overflow-y-auto pb-24 md:flex md:pb-0"
					:class="mobileView === 'write' ? 'flex' : 'hidden'"
				>
					<div class="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
						<DomAlert
							v-if="actionError"
							class="mb-5"
							tone="danger"
							title="Release action needs attention"
							:description="actionError"
							dismissible
							@dismiss="actionError = ''"
						/>

						<section aria-labelledby="release-copy-heading">
							<div class="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Customer-facing copy</p>
									<h2 id="release-copy-heading" class="mt-1 text-lg font-semibold">Tell customers what changed</h2>
								</div>
								<DomBadge tone="neutral">{{ headline.length }}/100</DomBadge>
							</div>
							<div class="space-y-5 py-5">
								<DomTextInput
									v-model="headline"
									label="Announcement headline"
									placeholder="Lead with the customer benefit"
									:disabled="!editable"
								/>
								<DomTextareaInput
									v-model="summary"
									label="Summary"
									description="This becomes the shared source for in-app, email, and public previews."
									placeholder="Explain why the release matters and what customers can do now."
									:rows="4"
									:disabled="!editable"
								/>
							</div>
						</section>

						<section class="border-t border-border py-5" aria-labelledby="release-notes-heading">
							<div class="flex flex-wrap items-end justify-between gap-3">
								<div>
									<h2 id="release-notes-heading" class="text-base font-semibold">Shipped work</h2>
									<p class="mt-1 text-sm text-muted-fg">Choose the implementation details that belong in customer copy.</p>
								</div>
								<DomBadge tone="neutral">{{ selectedNotes.length }} included</DomBadge>
							</div>
							<div class="mt-4 divide-y divide-border border-y border-border">
								<div v-for="note in release.notes" :key="note.id" class="py-4">
									<DomCheckbox
										:model-value="includedNoteIds.includes(note.id)"
										:label="note.title"
										:description="note.detail"
										:disabled="!editable"
										@update:model-value="setNoteIncluded(note.id, $event)"
									/>
									<DomBadge class="ml-7 mt-2" :tone="note.type === 'Breaking change' ? 'danger' : 'neutral'" size="sm">{{ note.type }}</DomBadge>
								</div>
							</div>
						</section>

						<section class="border-t border-border py-5" aria-labelledby="release-targeting-heading">
							<h2 id="release-targeting-heading" class="text-base font-semibold">Targeting and governance</h2>
							<p class="mt-1 text-sm text-muted-fg">These choices are validated again when review begins.</p>
							<div class="mt-5 grid gap-5 sm:grid-cols-2">
								<DomSelect
									v-model="audience"
									label="Audience"
									:options="release.options.audiences"
									:disabled="!editable"
									width="min-w-[18rem] max-w-[calc(100vw-2rem)]"
								>
									<template #option="{ option }">
										<p class="font-medium">{{ option.label }}</p>
										<p class="mt-1 text-xs opacity-75">{{ option.description }}</p>
									</template>
								</DomSelect>
								<DomSelect
									v-model="reviewerId"
									label="Reviewer"
									:options="release.options.reviewers"
									:disabled="!editable"
									width="min-w-[18rem] max-w-[calc(100vw-2rem)]"
								>
									<template #option="{ option }">
										<div class="flex items-center gap-3">
											<DomAvatar :name="option.label" :initials="option.initials" size="sm" />
											<div>
												<p class="font-medium">{{ option.label }}</p>
												<p class="mt-1 text-xs opacity-75">{{ option.description }}</p>
											</div>
										</div>
									</template>
								</DomSelect>
								<DomSelect
									v-model="schedule"
									class="sm:col-span-2"
									label="Publication timing"
									:options="release.options.schedules"
									:disabled="!editable"
									width="min-w-[20rem] max-w-[calc(100vw-2rem)]"
								>
									<template #option="{ option }">
										<p class="font-medium">{{ option.label }}</p>
										<p class="mt-1 text-xs opacity-75">{{ option.description }}</p>
									</template>
								</DomSelect>
							</div>
							<div class="mt-5 border-y border-border py-4">
								<DomToggle
									v-model="approvalRequired"
									label="Require reviewer approval"
									description="Recommended for paid-plan launches, broad email sends, and breaking changes."
									:disabled="!editable"
								/>
							</div>
						</section>

						<section class="border-t border-border py-5" aria-labelledby="release-channels-heading">
							<div>
								<h2 id="release-channels-heading" class="text-base font-semibold">Delivery channels</h2>
								<p class="mt-1 text-sm text-muted-fg">One structured release powers every enabled destination.</p>
							</div>
							<div class="mt-4 grid border-y border-border sm:grid-cols-2">
								<div
									v-for="(channel, index) in release.channelCatalog"
									:key="channel.id"
									class="border-border py-4 sm:px-4"
									:class="[index > 0 ? 'border-t sm:border-t-0' : '', index % 2 === 1 ? 'sm:border-l' : '', index > 1 ? 'sm:border-t' : '']"
								>
									<DomCheckbox
										:model-value="channels[channel.id]"
										:label="channel.label"
										:description="channel.description"
										:disabled="!editable"
										@update:model-value="setChannelEnabled(channel.id, $event)"
									/>
									<p class="ml-7 mt-2 text-xs text-muted-fg">Owner: {{ channel.owner }}</p>
								</div>
							</div>
						</section>
					</div>
				</main>

				<aside
					class="min-h-0 w-full shrink-0 flex-col overflow-hidden border-l-0 border-border bg-secondary/15 md:flex md:w-[23rem] md:border-l"
					:class="mobileView === 'write' ? 'hidden' : 'flex'"
				>
					<DomTabs
						v-model="desktopPanel"
						:tabs="rightTabs"
						variant="page"
						class="hidden shrink-0 md:block [&>div:last-child]:hidden"
					/>

					<div
						class="min-h-0 flex-1 flex-col overflow-y-auto pb-24 md:pb-0"
						:class="[mobileView === 'preview' ? 'flex' : 'hidden', desktopPanel === 'preview' ? 'md:flex' : 'md:hidden']"
					>
						<div class="border-b border-border px-4 py-4 sm:px-5">
							<DomTabs
								v-model="activePreview"
								:tabs="previewTabs"
								variant="pill"
								class="[&>div:last-child]:hidden"
							/>
						</div>

						<div v-if="currentPreview" class="p-4 sm:p-5">
							<DomAlert
								v-if="!channels[currentPreview.id]"
								class="mb-4"
								tone="warning"
								title="Channel disabled"
								description="Enable this destination in Write before publishing."
							/>

							<article class="overflow-hidden border border-border bg-canvas shadow-sm">
								<div v-if="activePreview === 'email'" class="border-b border-border bg-secondary/40 px-5 py-3 text-xs text-muted-fg">
									<p><span class="font-medium text-canvas-fg">From:</span> Atlas Product Updates</p>
									<p class="mt-1"><span class="font-medium text-canvas-fg">Subject:</span> {{ headline || 'Release headline' }}</p>
								</div>
								<div class="p-5">
									<div class="flex flex-wrap items-center gap-2">
										<DomBadge tone="primary" size="sm">{{ currentPreview.eyebrow }}</DomBadge>
										<span class="text-xs text-muted-fg">{{ release.releaseDate }}</span>
									</div>
									<h2 class="mt-4 text-xl font-semibold leading-tight tracking-tight">{{ headline || 'Add a release headline' }}</h2>
									<p class="mt-3 text-sm leading-6 text-muted-fg">{{ summary || 'Add a customer-facing summary to preview this channel.' }}</p>
									<div class="mt-5 divide-y divide-border border-y border-border">
										<div v-for="note in selectedNotes" :key="note.id" class="py-4">
											<div class="flex items-center gap-2">
												<p class="text-sm font-semibold">{{ note.title }}</p>
												<DomBadge tone="neutral" size="sm">{{ note.type }}</DomBadge>
											</div>
											<p class="mt-2 text-sm leading-6 text-muted-fg">{{ note.detail }}</p>
										</div>
									</div>
									<DomButton class="mt-5" size="sm">{{ previewActionLabel(activePreview) }}</DomButton>
								</div>
							</article>

							<div class="mt-4 flex flex-wrap gap-2">
								<DomBadge tone="neutral">{{ release.audienceLabel }}</DomBadge>
								<DomBadge tone="neutral">{{ release.scheduleLabel }}</DomBadge>
							</div>
						</div>
					</div>

					<div
						class="min-h-0 flex-1 flex-col overflow-y-auto pb-24 md:pb-0"
						:class="[mobileView === 'publish' ? 'flex' : 'hidden', desktopPanel === 'publish' ? 'md:flex' : 'md:hidden']"
					>
						<div class="p-4 sm:p-5">
							<section v-if="release.publication" class="border-b border-border pb-5" aria-labelledby="publication-proof-heading">
								<div class="flex items-start justify-between gap-3">
									<div>
										<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Publication proof</p>
										<h2 id="publication-proof-heading" class="mt-2 text-lg font-semibold">{{ release.publication.statusLabel }}</h2>
										<p class="mt-1 text-xs text-muted-fg">{{ release.publication.id }}</p>
									</div>
									<DomStatusPill tone="success" :label="release.publication.status === 'published' ? 'Live' : 'Queued'" size="sm" />
								</div>
								<div class="mt-4 divide-y divide-border border-y border-border">
									<div v-for="dispatch in release.publication.dispatches" :key="dispatch.channelId" class="flex items-center justify-between gap-3 py-3 text-sm">
										<span>{{ dispatch.label }}</span>
										<DomStatusPill tone="success" :label="dispatch.state" size="sm" />
									</div>
								</div>
							</section>

							<div class="flex items-end justify-between gap-4" :class="release.publication ? 'mt-5' : ''">
								<div>
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Publish readiness</p>
									<p class="mt-2 text-3xl font-semibold tracking-tight">{{ release.readiness }}%</p>
								</div>
								<DomStatusPill :tone="release.statusTone" :label="release.statusLabel" />
							</div>
							<DomProgress class="mt-4" :value="release.readiness" label="Publishing readiness" :show-label="false" />

							<div class="mt-5 divide-y divide-border border-y border-border">
								<div v-for="check in release.checks" :key="check.key" class="flex items-start justify-between gap-3 py-3">
									<div>
										<p class="text-sm font-medium">{{ check.label }}</p>
										<p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p>
									</div>
									<DomStatusPill :tone="check.passed ? 'success' : 'warning'" :label="check.passed ? 'Ready' : 'Open'" size="sm" />
								</div>
							</div>

							<section class="border-b border-border py-5" aria-labelledby="review-chain-heading">
								<h2 id="review-chain-heading" class="text-sm font-semibold">Review chain</h2>
								<div class="mt-4 flex items-center gap-3">
									<DomAvatar :name="release.reviewer.label" :initials="release.reviewer.initials" size="md" />
									<div>
										<p class="text-sm font-medium">{{ release.reviewer.label }}</p>
										<p class="text-xs text-muted-fg">{{ release.reviewer.description }}</p>
									</div>
								</div>
								<p class="mt-3 text-xs leading-5 text-muted-fg">
									{{ release.approval ? `Approved ${release.approval.approvedAt}` : release.reviewRequestedAt ? `Review requested ${release.reviewRequestedAt}` : 'Review has not been requested.' }}
								</p>
							</section>

							<section class="py-5" aria-labelledby="release-activity-heading">
								<h2 id="release-activity-heading" class="text-sm font-semibold">Activity</h2>
								<ol class="mt-4 space-y-5">
									<li v-for="event in release.activity" :key="event.id" class="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
										<DomAvatar :name="event.actor" size="xs" />
										<div>
											<p class="text-sm font-medium">{{ event.action }}</p>
											<p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p>
											<p class="mt-1 text-xs text-muted-fg">{{ event.actor }} · {{ event.time }}</p>
										</div>
									</li>
								</ol>
							</section>
						</div>
					</div>
				</aside>
			</div>

			<div class="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-border bg-canvas/95 px-4 py-3 backdrop-blur sm:hidden">
				<DomButton v-if="editable" variant="secondary" :disabled="!isDirty" :loading="isSaving" @click="saveDraft">Save</DomButton>
				<DomButton class="flex-1" :loading="isActing" @click="handlePrimaryAction">{{ primaryActionLabel }}</DomButton>
			</div>

			<DomDialog
				v-model="lifecycleDialogOpen"
				:title="lifecycleTitle"
				:description="lifecycleDescription"
			>
				<div class="space-y-5 text-sm">
					<DomAlert
						v-if="actionError"
						tone="danger"
						title="Release action blocked"
						:description="actionError"
					/>
					<div class="flex items-start justify-between gap-4 border-b border-border pb-4">
						<div>
							<p class="font-semibold">{{ headline }}</p>
							<p class="mt-1 text-muted-fg">{{ release.audienceLabel }} · {{ enabledChannels.length }} channels</p>
						</div>
						<DomStatusPill :tone="release.statusTone" :label="release.statusLabel" size="sm" />
					</div>
					<div class="space-y-3">
						<div v-for="check in release.checks" :key="check.key" class="flex items-start justify-between gap-4">
							<div>
								<p class="font-medium">{{ check.label }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ check.detail }}</p>
							</div>
							<DomStatusPill :tone="check.passed ? 'success' : 'warning'" :label="check.passed ? 'Ready' : 'Required'" size="sm" />
						</div>
					</div>
					<DomAlert
						v-if="incompleteChecks.length"
						tone="warning"
						title="Publishing checks are incomplete"
						description="Resolve the open checks in Write before continuing."
					/>
				</div>
				<template #footer>
					<DomButton variant="secondary" data-close>Keep editing</DomButton>
					<DomButton :disabled="incompleteChecks.length > 0" :loading="isActing" @click="confirmLifecycleAction">{{ primaryActionLabel }}</DomButton>
				</template>
			</DomDialog>
		</template>
	</section>
</template>
