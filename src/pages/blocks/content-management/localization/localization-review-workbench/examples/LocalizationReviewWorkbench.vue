<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomDrawer,
	DomProgress,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTagCombobox,
	DomTextInput,
	DomTextareaInput,
} from '@getdom/studio/vue';

const bootstrap = ref(null);
const release = ref(null);
const selectedReleaseId = ref('checkout-2026-08');
const selectedLocale = ref('fr-FR');
const selectedSegmentId = ref('');
const statusFilter = ref('all');
const searchQuery = ref('');
const targetDraft = ref('');
const noteDraft = ref('');
const draftCache = ref({});
const suggestion = ref(null);
const appliedTerms = ref([]);
const handoffNote = ref('');
const publishAcknowledged = ref(false);
const loading = ref(true);
const busy = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const queueOpen = ref(false);
const contextOpen = ref(false);
const handoffOpen = ref(false);
const activityOpen = ref(false);
const publishOpen = ref(false);
const receipt = ref(null);

const releaseOptions = computed(() => bootstrap.value?.releases || []);
const localeOptions = computed(() => bootstrap.value?.localeOptions || []);
const statusOptions = computed(() => bootstrap.value?.statusOptions || []);
const glossaryOptions = computed(() => bootstrap.value?.glossaryOptions || []);
const segments = computed(() => release.value?.segments || []);
const activeSegment = computed(() => segments.value.find((segment) => segment.id === selectedSegmentId.value) || segments.value[0] || null);
const localeSummary = computed(() => release.value?.localeSummaries?.find((locale) => locale.value === selectedLocale.value) || null);
const currentLocaleOption = computed(() => localeOptions.value.find((locale) => locale.value === selectedLocale.value) || localeOptions.value[0] || null);
const openChecks = computed(() => activeSegment.value?.checks || []);
const targetDirty = computed(() => Boolean(activeSegment.value) && (
		targetDraft.value !== activeSegment.value.target
		|| noteDraft.value !== (activeSegment.value.note || '')
	));
const activeCharacterCount = computed(() => targetDraft.value.length);
const overCharacterLimit = computed(() => Boolean(activeSegment.value) && activeCharacterCount.value > activeSegment.value.maxLength);
const filteredSegments = computed(() => segments.value.filter((segment) => {
	const query = searchQuery.value.trim().toLowerCase();
	const matchesQuery = !query || [segment.title, segment.key, segment.source, segment.area]
		.join(' ')
		.toLowerCase()
		.includes(query);
	if (!matchesQuery) return false;
	if (statusFilter.value === 'needs-review') return segment.status !== 'approved';
	if (statusFilter.value === 'issues') return segment.checks.length > 0;
	if (statusFilter.value === 'approved') return segment.status === 'approved';
	return true;
}));
const activePosition = computed(() => Math.max(0, segments.value.findIndex((segment) => segment.id === activeSegment.value?.id)) + 1);
const canApprove = computed(() => Boolean(activeSegment.value)
	&& !targetDirty.value
	&& activeSegment.value.status !== 'approved'
	&& activeSegment.value.checks.length === 0
	&& activeSegment.value.target.trim().length > 0);
const publishTone = computed(() => release.value?.publication ? 'success' : release.value?.readiness?.ready ? 'primary' : 'warning');
const publishLabel = computed(() => release.value?.publication ? 'Published' : release.value?.readiness?.ready ? 'Ready to publish' : 'Review in progress');

onMounted(loadWorkbench);

/**
 * Loads bootstrap options and the initial API-backed localization release.
 *
 * @returns {Promise<void>}
 */
async function loadWorkbench() {
	loading.value = true;
	clearFeedback();
	try {
		bootstrap.value = await requestJson('/api/block-demos/localization-review/bootstrap');
		selectedReleaseId.value = bootstrap.value.releases[0]?.value || selectedReleaseId.value;
		selectedLocale.value = bootstrap.value.localeOptions[0]?.value || selectedLocale.value;
		await loadRelease(selectedReleaseId.value, selectedLocale.value, { selectFirstOpen: true });
	} catch (error) {
		errorMessage.value = error.message || 'The localization release could not be loaded.';
	} finally {
		loading.value = false;
	}
}

/**
 * Loads one release and locale from the demo API.
 *
 * @param {string} releaseId Release identifier.
 * @param {string} locale Locale code.
 * @param {{selectFirstOpen?: boolean}} options Selection behavior.
 * @returns {Promise<void>}
 */
async function loadRelease(releaseId, locale, options = {}) {
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/localization-review/releases/${releaseId}?locale=${encodeURIComponent(locale)}`);
		applyRelease(payload.release, options);
	} catch (error) {
		errorMessage.value = error.message || 'The selected locale could not be loaded.';
	}
}

/**
 * Applies a server release and hydrates the active translation draft.
 *
 * @param {Record<string, unknown>} nextRelease Server release payload.
 * @param {{selectFirstOpen?: boolean}} options Selection behavior.
 * @returns {void}
 */
function applyRelease(nextRelease, options = {}) {
	release.value = nextRelease;
	selectedReleaseId.value = nextRelease.id;
	selectedLocale.value = nextRelease.locale;
	appliedTerms.value = [...(nextRelease.handoff?.appliedTerms || [])];
	handoffNote.value = nextRelease.handoff?.reviewerNote || '';
	receipt.value = nextRelease.publication || receipt.value;
	draftCache.value = {};
	const selectedStillExists = nextRelease.segments.some((segment) => segment.id === selectedSegmentId.value);
	if (options.selectFirstOpen || !selectedStillExists) {
		selectedSegmentId.value = nextRelease.segments.find((segment) => segment.status !== 'approved' || segment.checks.length)?.id
			|| nextRelease.segments[0]?.id
			|| '';
	}
	hydrateActiveDraft();
}

/**
 * Changes the release and reloads its selected locale.
 *
 * @param {string} releaseId Release identifier.
 * @returns {Promise<void>}
 */
async function selectRelease(releaseId) {
	if (!releaseId || releaseId === release.value?.id) return;
	selectedReleaseId.value = releaseId;
	selectedSegmentId.value = '';
	queueOpen.value = false;
	await loadRelease(releaseId, selectedLocale.value, { selectFirstOpen: true });
}

/**
 * Changes locale without losing the selected release context.
 *
 * @param {string} locale Locale code.
 * @returns {Promise<void>}
 */
async function selectLocale(locale) {
	if (!locale || locale === release.value?.locale) return;
	selectedLocale.value = locale;
	selectedSegmentId.value = '';
	queueOpen.value = false;
	contextOpen.value = false;
	receipt.value = null;
	await loadRelease(selectedReleaseId.value, locale, { selectFirstOpen: true });
}

/**
 * Selects one translation segment while preserving any unsaved local draft.
 *
 * @param {string} segmentId Segment identifier.
 * @returns {void}
 */
function selectSegment(segmentId) {
	cacheActiveDraft();
	selectedSegmentId.value = segmentId;
	suggestion.value = null;
	clearFeedback();
	hydrateActiveDraft();
	queueOpen.value = false;
}

/**
 * Stores the active draft locally before navigating between strings.
 *
 * @returns {void}
 */
function cacheActiveDraft() {
	if (!activeSegment.value) return;
	draftCache.value[activeSegment.value.id] = {
		target: targetDraft.value,
		note: noteDraft.value,
	};
}

/**
 * Hydrates editor values from a cached draft or the latest server segment.
 *
 * @returns {void}
 */
function hydrateActiveDraft() {
	if (!activeSegment.value) {
		targetDraft.value = '';
		noteDraft.value = '';
		return;
	}
	const cached = draftCache.value[activeSegment.value.id];
	targetDraft.value = cached?.target ?? activeSegment.value.target;
	noteDraft.value = cached?.note ?? activeSegment.value.note ?? '';
}

/**
 * Updates and caches the active target translation.
 *
 * @param {string} value Updated translation.
 * @returns {void}
 */
function updateTargetDraft(value) {
	targetDraft.value = value;
	cacheActiveDraft();
	suggestion.value = null;
}

/**
 * Updates and caches the reviewer note.
 *
 * @param {string} value Updated note.
 * @returns {void}
 */
function updateNoteDraft(value) {
	noteDraft.value = value;
	cacheActiveDraft();
}

/**
 * Resets the active editor to the last saved server values.
 *
 * @returns {void}
 */
function discardActiveDraft() {
	if (!activeSegment.value) return;
	delete draftCache.value[activeSegment.value.id];
	hydrateActiveDraft();
	suggestion.value = null;
	successMessage.value = 'Unsaved changes discarded.';
}

/**
 * Requests a translation-memory suggestion for the active segment.
 *
 * @returns {Promise<void>}
 */
async function requestSuggestion() {
	if (!activeSegment.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/localization-review/releases/${release.value.id}/segments/${activeSegment.value.id}/suggest`, {
			method: 'POST',
			body: { locale: selectedLocale.value },
		});
		suggestion.value = payload.suggestion;
	} catch (error) {
		errorMessage.value = error.message || 'Translation memory could not return a suggestion.';
	} finally {
		busy.value = false;
	}
}

/**
 * Applies the current translation-memory suggestion to the editable draft.
 *
 * @returns {void}
 */
function applySuggestion() {
	if (!suggestion.value) return;
	updateTargetDraft(suggestion.value.target);
	successMessage.value = 'Suggestion applied to the draft. Save to rerun quality checks.';
}

/**
 * Saves the active translation and refreshes server-owned quality checks.
 *
 * @returns {Promise<boolean>} True when the save succeeds.
 */
async function saveTranslation() {
	if (!activeSegment.value || busy.value) return false;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/localization-review/releases/${release.value.id}/segments/${activeSegment.value.id}`, {
			method: 'PATCH',
			body: {
				locale: selectedLocale.value,
				revision: release.value.revision,
				target: targetDraft.value,
				note: noteDraft.value,
			},
		});
		applyRelease(payload.release);
		successMessage.value = payload.message;
		return true;
	} catch (error) {
		applyErrorRelease(error);
		errorMessage.value = error.message || 'The translation could not be saved.';
		return false;
	} finally {
		busy.value = false;
	}
}

/**
 * Resolves one reviewer-owned quality check through the API.
 *
 * @param {Record<string, unknown>} check Quality-check record.
 * @returns {Promise<void>}
 */
async function resolveCheck(check) {
	if (!activeSegment.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/localization-review/releases/${release.value.id}/segments/${activeSegment.value.id}/checks/${check.id}/resolve`, {
			method: 'POST',
			body: { locale: selectedLocale.value, revision: release.value.revision },
		});
		applyRelease(payload.release);
		successMessage.value = payload.message;
	} catch (error) {
		applyErrorRelease(error);
		errorMessage.value = error.message || 'The quality check could not be resolved.';
	} finally {
		busy.value = false;
	}
}

/**
 * Saves dirty copy if needed, then approves the active translation.
 *
 * @returns {Promise<void>}
 */
async function approveTranslation() {
	if (!activeSegment.value || busy.value) return;
	if (targetDirty.value) {
		const saved = await saveTranslation();
		if (!saved || activeSegment.value?.checks.length) return;
	}
	const approvedSegmentId = activeSegment.value.id;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/localization-review/releases/${release.value.id}/segments/${approvedSegmentId}/approve`, {
			method: 'POST',
			body: { locale: selectedLocale.value, revision: release.value.revision },
		});
		applyRelease(payload.release);
		successMessage.value = payload.message;
		selectNextOpenSegment(approvedSegmentId);
	} catch (error) {
		applyErrorRelease(error);
		errorMessage.value = error.message || 'The translation could not be approved.';
	} finally {
		busy.value = false;
	}
}

/**
 * Moves to the next unapproved or issue-bearing string after approval.
 *
 * @param {string} currentSegmentId Previously active segment identifier.
 * @returns {void}
 */
function selectNextOpenSegment(currentSegmentId) {
	const currentIndex = segments.value.findIndex((segment) => segment.id === currentSegmentId);
	const ordered = [...segments.value.slice(currentIndex + 1), ...segments.value.slice(0, currentIndex + 1)];
	const next = ordered.find((segment) => segment.status !== 'approved' || segment.checks.length);
	if (next) selectSegment(next.id);
}

/**
 * Saves locale handoff notes and applied glossary terms.
 *
 * @returns {Promise<void>}
 */
async function saveHandoff() {
	if (!release.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/localization-review/releases/${release.value.id}/handoff`, {
			method: 'PATCH',
			body: {
				locale: selectedLocale.value,
				revision: release.value.revision,
				appliedTerms: appliedTerms.value,
				reviewerNote: handoffNote.value,
			},
		});
		applyRelease(payload.release);
		handoffOpen.value = false;
		successMessage.value = payload.message;
	} catch (error) {
		applyErrorRelease(error);
		errorMessage.value = error.message || 'The locale handoff could not be saved.';
	} finally {
		busy.value = false;
	}
}

/**
 * Publishes a complete locale pack and stores its synchronization receipt.
 *
 * @returns {Promise<void>}
 */
async function publishLocale() {
	if (!release.value || busy.value) return;
	busy.value = true;
	clearFeedback();
	try {
		const payload = await requestJson(`/api/block-demos/localization-review/releases/${release.value.id}/publish`, {
			method: 'POST',
			body: {
				locale: selectedLocale.value,
				revision: release.value.revision,
				acknowledged: publishAcknowledged.value,
			},
		});
		applyRelease(payload.release);
		receipt.value = payload.receipt;
		publishAcknowledged.value = false;
		successMessage.value = payload.message;
	} catch (error) {
		applyErrorRelease(error);
		errorMessage.value = error.message || 'The locale pack could not be published.';
	} finally {
		busy.value = false;
	}
}

/**
 * Applies a fresh server release returned with an API conflict.
 *
 * @param {Error & {payload?: Record<string, unknown>}} error Request error.
 * @returns {void}
 */
function applyErrorRelease(error) {
	if (error.payload?.release) applyRelease(error.payload.release);
}

/**
 * Clears transient success and error feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
}

/**
 * Returns the visible status label for a segment.
 *
 * @param {Record<string, unknown>} segment Translation segment.
 * @returns {string} Status label.
 */
function segmentStatusLabel(segment) {
	if (segment.checks.length) return `${segment.checks.length} issue${segment.checks.length === 1 ? '' : 's'}`;
	if (segment.status === 'approved') return 'Approved';
	return 'Needs review';
}

/**
 * Returns the semantic tone for a segment status.
 *
 * @param {Record<string, unknown>} segment Translation segment.
 * @returns {string} DOM Studio tone.
 */
function segmentStatusTone(segment) {
	if (segment.checks.length) return 'warning';
	if (segment.status === 'approved') return 'success';
	return 'neutral';
}

/**
 * Returns the semantic tone for a quality-check severity.
 *
 * @param {Record<string, unknown>} check Quality-check record.
 * @returns {string} DOM Studio tone.
 */
function checkTone(check) {
	if (check.severity === 'High') return 'danger';
	if (check.severity === 'Medium') return 'warning';
	return 'neutral';
}

/**
 * Formats an ISO timestamp for compact receipt presentation.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Human-readable timestamp.
 */
function formatDateTime(value) {
	if (!value) return 'Not yet';
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

/**
 * Requests JSON and throws a payload-aware error for non-success responses.
 *
 * @param {string} url API URL.
 * @param {{method?: string, body?: Record<string, unknown>}} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const error = new Error(payload.error || `Request failed with status ${response.status}.`);
		error.payload = payload;
		throw error;
	}
	return payload;
}
</script>

<template>
	<div class="h-dvh min-h-[38rem] overflow-hidden bg-canvas text-canvas-fg">
		<header class="flex h-14 items-center gap-3 border-b border-border bg-canvas px-3 sm:px-4">
			<div class="flex min-w-0 flex-1 items-center gap-3 lg:w-64 lg:flex-none lg:shrink-0">
				<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-fg">A</div>
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold">Atlas Locale</p>
					<p class="truncate text-[11px] text-muted-fg">{{ release?.version || 'Translation review' }}</p>
				</div>
			</div>

			<div class="hidden min-w-0 flex-1 items-center gap-2 lg:flex">
				<DomSelect
					:model-value="selectedReleaseId"
					class="w-56"
					label="Release batch"
					chrome="none"
					:options="releaseOptions"
					width="min-w-[20rem] max-w-[calc(100vw-3rem)]"
					@update:model-value="selectRelease"
				>
					<template #option="{ option }">
						<p class="font-semibold">{{ option.label }}</p>
						<p class="mt-0.5 text-xs opacity-75">{{ option.description }}</p>
						<p class="mt-1 text-[11px] opacity-60">{{ option.meta }}</p>
					</template>
				</DomSelect>
				<DomSelect
					:model-value="selectedLocale"
					class="w-44"
					label="Reviewer locale"
					chrome="none"
					:options="localeOptions"
					width="min-w-[18rem] max-w-[calc(100vw-3rem)]"
					@update:model-value="selectLocale"
				>
					<template #option="{ option }">
						<div class="flex items-center gap-3">
							<DomAvatar :initials="option.initials" size="sm" />
							<div><p class="font-semibold">{{ option.label }}</p><p class="text-xs opacity-75">{{ option.description }}</p></div>
						</div>
					</template>
				</DomSelect>
			</div>

			<div class="ml-auto flex shrink-0 items-center gap-2">
				<span class="hidden sm:inline-flex"><DomStatusPill :tone="publishTone" size="sm">{{ publishLabel }}</DomStatusPill></span>
				<span class="hidden xl:inline-flex"><DomButton size="sm" variant="ghost" @click="activityOpen = true">Activity</DomButton></span>
				<DomButton size="sm" :variant="release?.readiness?.ready ? 'primary' : 'secondary'" @click="publishOpen = true">
					<span class="hidden sm:inline">Publish {{ currentLocaleOption?.shortLabel }}</span>
					<span class="sm:hidden">Publish</span>
				</DomButton>
			</div>
		</header>

		<div class="flex h-[calc(100dvh-3.5rem)] min-h-0">
			<aside class="hidden w-72 shrink-0 flex-col border-r border-border bg-secondary/20 lg:flex">
				<div class="border-b border-border p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="text-sm font-semibold">Release strings</p>
							<p class="mt-1 text-xs text-muted-fg">{{ localeSummary?.approved || 0 }} of {{ localeSummary?.total || 0 }} approved</p>
						</div>
						<DomBadge :tone="localeSummary?.issues ? 'warning' : 'success'" variant="soft">{{ localeSummary?.issues || 0 }} QA</DomBadge>
					</div>
					<DomProgress class="mt-3" :value="localeSummary?.progress || 0" :max="100" />
					<DomTextInput v-model="searchQuery" class="mt-4" label="Search strings" placeholder="Search key or source..." chrome="none" />
					<DomSelect v-model="statusFilter" class="mt-2" label="String status" :options="statusOptions" chrome="none" width="min-w-[15rem]" />
				</div>

				<nav class="min-h-0 flex-1 overflow-y-auto" aria-label="Translation segments">
					<button
						v-for="segment in filteredSegments"
						:key="segment.id"
						type="button"
						class="block w-full border-b border-border px-4 py-3 text-left transition hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
						:class="segment.id === activeSegment?.id ? 'bg-canvas shadow-[inset_3px_0_0_var(--primary)]' : ''"
						:aria-current="segment.id === activeSegment?.id ? 'true' : undefined"
						@click="selectSegment(segment.id)"
					>
						<div class="flex items-start justify-between gap-3">
							<p class="min-w-0 truncate text-sm font-medium">{{ segment.title }}</p>
							<span class="mt-1 size-2 shrink-0 rounded-full" :class="segment.checks.length ? 'bg-warning' : segment.status === 'approved' ? 'bg-success' : 'bg-muted-fg'" />
						</div>
						<p class="mt-1 truncate font-mono text-[11px] text-muted-fg">{{ segment.key }}</p>
						<div class="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-fg">
							<span>{{ segment.area }}</span>
							<span>{{ segmentStatusLabel(segment) }}</span>
						</div>
					</button>
					<div v-if="!filteredSegments.length" class="p-6 text-center text-sm text-muted-fg">No strings match this view.</div>
				</nav>
			</aside>

			<main class="min-w-0 flex-1 overflow-y-auto bg-canvas">
				<div v-if="loading" class="mx-auto max-w-3xl space-y-5 p-5 sm:p-8">
					<DomSkeleton class="h-5 w-28" />
					<DomSkeleton class="h-10 w-3/4" />
					<DomSkeleton class="h-28 w-full" />
					<DomSkeleton class="h-44 w-full" />
				</div>

				<div v-else-if="activeSegment" class="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-4 sm:px-7 sm:py-6">
					<div class="mb-5 flex items-center gap-2 lg:hidden">
						<DomButton class="flex-1" size="sm" variant="secondary" @click="queueOpen = true">Strings · {{ activePosition }}/{{ segments.length }}</DomButton>
						<DomSelect
							:model-value="selectedLocale"
							class="w-28"
							label="Locale"
							chrome="none"
							:options="localeOptions"
							width="min-w-[17rem] max-w-[calc(100vw-2rem)]"
							@update:model-value="selectLocale"
						/>
						<DomButton size="sm" variant="secondary" @click="contextOpen = true">Context</DomButton>
					</div>

					<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2 text-xs text-muted-fg">
								<span>{{ activeSegment.area }}</span>
								<span aria-hidden="true">/</span>
								<span>String {{ activePosition }} of {{ segments.length }}</span>
							</div>
							<h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{{ activeSegment.title }}</h1>
							<p class="mt-2 break-all font-mono text-xs text-muted-fg">{{ activeSegment.key }}</p>
						</div>
						<DomStatusPill :tone="segmentStatusTone(activeSegment)" size="sm">{{ segmentStatusLabel(activeSegment) }}</DomStatusPill>
					</div>

					<div class="space-y-3 py-5">
						<DomAlert v-if="errorMessage" tone="danger" title="Action needed">{{ errorMessage }}</DomAlert>
						<DomAlert v-if="successMessage" tone="success" title="Saved">{{ successMessage }}</DomAlert>
					</div>

					<section aria-labelledby="source-copy-heading" class="border-b border-border pb-6">
						<div class="flex items-center justify-between gap-4">
							<h2 id="source-copy-heading" class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">English source</h2>
						<DomBadge variant="outline">{{ activeSegment.source.length }} chars</DomBadge>
						</div>
						<p class="mt-3 text-base leading-7 sm:text-lg">{{ activeSegment.source }}</p>
					</section>

					<section aria-labelledby="translation-heading" class="py-6">
						<div class="flex flex-wrap items-end justify-between gap-3">
							<div>
								<h2 id="translation-heading" class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">{{ currentLocaleOption?.label }} translation</h2>
								<p class="mt-1 text-xs text-muted-fg">Reviewed by {{ currentLocaleOption?.reviewer }}</p>
							</div>
							<DomButton size="sm" variant="secondary" :loading="busy" @click="requestSuggestion">Suggest from memory</DomButton>
						</div>

						<DomTextareaInput
							:model-value="targetDraft"
							class="mt-4"
							:label="`${currentLocaleOption?.label || 'Target'} translation`"
							:rows="5"
							:invalid="overCharacterLimit"
							:read-only="Boolean(release.publication)"
							@update:model-value="updateTargetDraft"
						/>
						<div class="mt-2 flex items-center justify-between gap-3 text-xs">
							<span class="text-muted-fg">Version {{ activeSegment.version }} · API saved</span>
							<span :class="overCharacterLimit ? 'font-semibold text-destructive' : 'text-muted-fg'">{{ activeCharacterCount }} / {{ activeSegment.maxLength }}</span>
						</div>

						<div v-if="suggestion" class="mt-4 border-l-2 border-primary bg-primary/5 px-4 py-3">
							<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
								<div>
									<p class="text-xs font-semibold uppercase tracking-wide text-primary">{{ suggestion.confidence }}% match · {{ suggestion.source }}</p>
									<p class="mt-2 text-sm leading-6">{{ suggestion.target }}</p>
								</div>
								<DomButton size="sm" variant="secondary" @click="applySuggestion">Use suggestion</DomButton>
							</div>
						</div>
					</section>

					<section v-if="openChecks.length" aria-labelledby="quality-checks-heading" class="border-t border-border py-5">
						<div class="flex items-center justify-between gap-3">
							<h2 id="quality-checks-heading" class="text-sm font-semibold">Quality checks</h2>
							<DomBadge tone="warning">{{ openChecks.length }} open</DomBadge>
						</div>
						<div class="mt-3 divide-y divide-border border-y border-border">
							<div v-for="check in openChecks" :key="check.id" class="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
								<div class="min-w-0">
									<div class="flex items-center gap-2"><p class="text-sm font-semibold">{{ check.title }}</p><DomBadge :tone="checkTone(check)" size="sm">{{ check.severity }}</DomBadge></div>
									<p class="mt-1 text-sm leading-6 text-muted-fg">{{ check.detail }}</p>
								</div>
								<DomButton v-if="check.resolvable" size="sm" variant="secondary" @click="resolveCheck(check)">Resolve</DomButton>
								<DomBadge v-else variant="outline">Fix in translation</DomBadge>
							</div>
						</div>
					</section>

					<section class="border-t border-border py-5">
						<DomTextareaInput
							:model-value="noteDraft"
							label="Reviewer note"
							description="Internal context saved with this string version."
							:rows="2"
							:read-only="Boolean(release.publication)"
							placeholder="Add context for the next reviewer..."
							@update:model-value="updateNoteDraft"
						/>
					</section>

					<div class="sticky bottom-0 mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border bg-canvas/95 py-4 backdrop-blur">
						<div class="flex gap-2">
							<DomButton variant="ghost" size="sm" @click="handoffOpen = true">Locale handoff</DomButton>
							<DomButton v-if="targetDirty" variant="ghost" size="sm" @click="discardActiveDraft">Reset</DomButton>
						</div>
						<div class="ml-auto flex gap-2">
							<DomButton v-if="targetDirty" variant="secondary" :loading="busy" :disabled="overCharacterLimit" @click="saveTranslation">Save translation</DomButton>
							<DomButton v-if="!release.publication" :loading="busy" :disabled="!canApprove" @click="approveTranslation">
								{{ activeSegment.status === 'approved' ? 'Approved' : 'Approve and next' }}
							</DomButton>
							<DomStatusPill v-else tone="success">Published</DomStatusPill>
						</div>
					</div>
				</div>
			</main>

			<aside class="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-secondary/10 xl:block">
				<div v-if="activeSegment" class="divide-y divide-border">
					<section class="p-5">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Where it appears</p>
						<p class="mt-3 text-sm leading-6">{{ activeSegment.context }}</p>
						<div class="mt-4 flex flex-wrap gap-2"><DomBadge variant="outline">{{ activeSegment.area }}</DomBadge><DomBadge variant="outline">Max {{ activeSegment.maxLength }}</DomBadge></div>
					</section>

					<section class="p-5">
						<div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">Glossary guidance</p><DomBadge>{{ activeSegment.glossary.length }}</DomBadge></div>
						<div v-if="activeSegment.glossary.length" class="mt-3 space-y-4">
							<div v-for="term in activeSegment.glossary" :key="term.term">
								<p class="text-sm font-semibold">{{ term.term }}</p>
								<p class="mt-1 text-xs leading-5 text-muted-fg">{{ term.guidance }}</p>
							</div>
						</div>
						<p v-else class="mt-3 text-sm text-muted-fg">No glossary terms are required for this string.</p>
					</section>

					<section class="p-5">
						<div class="flex items-center justify-between gap-3"><p class="text-sm font-semibold">Publish readiness</p><span class="text-xs text-muted-fg">{{ release.readiness.approved }}/{{ release.readiness.total }}</span></div>
						<div class="mt-3 space-y-3">
							<div v-for="check in release.readiness.checks" :key="check.id" class="flex items-start gap-3 text-sm">
								<span class="mt-1 size-2 shrink-0 rounded-full" :class="check.ready ? 'bg-success' : 'bg-muted-fg/50'" />
								<span :class="check.ready ? 'text-canvas-fg' : 'text-muted-fg'">{{ check.label }}</span>
							</div>
						</div>
						<DomButton class="mt-5 w-full" variant="secondary" @click="publishOpen = true">Review publish gate</DomButton>
					</section>

					<section class="p-5">
						<div class="flex items-center gap-3">
							<DomAvatar :initials="currentLocaleOption?.initials" size="md" />
							<div><p class="text-sm font-semibold">{{ currentLocaleOption?.reviewer }}</p><p class="mt-0.5 text-xs text-muted-fg">{{ currentLocaleOption?.label }} reviewer</p></div>
						</div>
						<DomButton class="mt-4 w-full" size="sm" variant="ghost" @click="activityOpen = true">View release activity</DomButton>
					</section>
				</div>
			</aside>
		</div>

		<DomDrawer v-model="queueOpen" title="Release strings" side="left" width="min(94vw, 24rem)">
			<div class="border-b border-border p-4">
				<DomSelect :model-value="selectedReleaseId" label="Release batch" :options="releaseOptions" searchable @update:model-value="selectRelease" />
				<DomTextInput v-model="searchQuery" class="mt-3" label="Search strings" placeholder="Search key or source..." />
				<DomSelect v-model="statusFilter" class="mt-3" label="String status" :options="statusOptions" />
			</div>
			<nav aria-label="Mobile translation segments">
				<button
					v-for="segment in filteredSegments"
					:key="segment.id"
					type="button"
					class="block w-full border-b border-border px-4 py-4 text-left"
					:class="segment.id === activeSegment?.id ? 'bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]' : ''"
					@click="selectSegment(segment.id)"
				>
					<div class="flex items-start justify-between gap-3"><p class="font-medium">{{ segment.title }}</p><DomBadge :tone="segmentStatusTone(segment)" size="sm">{{ segmentStatusLabel(segment) }}</DomBadge></div>
					<p class="mt-1 break-all font-mono text-[11px] text-muted-fg">{{ segment.key }}</p>
				</button>
			</nav>
		</DomDrawer>

		<DomDrawer v-model="contextOpen" title="String context" side="right" width="min(94vw, 26rem)">
			<div v-if="activeSegment" class="divide-y divide-border">
				<section class="p-5"><p class="text-xs font-semibold uppercase tracking-wide text-muted-fg">Where it appears</p><p class="mt-3 text-sm leading-6">{{ activeSegment.context }}</p></section>
				<section class="p-5"><p class="text-sm font-semibold">Glossary guidance</p><div class="mt-3 space-y-4"><div v-for="term in activeSegment.glossary" :key="term.term"><p class="text-sm font-semibold">{{ term.term }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ term.guidance }}</p></div><p v-if="!activeSegment.glossary.length" class="text-sm text-muted-fg">No glossary terms are required.</p></div></section>
				<section class="p-5"><p class="text-sm font-semibold">Publish readiness</p><div class="mt-3 space-y-3"><div v-for="check in release.readiness.checks" :key="check.id" class="flex items-start gap-3 text-sm"><span class="mt-1 size-2 shrink-0 rounded-full" :class="check.ready ? 'bg-success' : 'bg-muted-fg/50'" /><span>{{ check.label }}</span></div></div></section>
			</div>
		</DomDrawer>

		<DomDrawer v-model="activityOpen" title="Release activity" side="right" width="min(94vw, 30rem)">
			<div class="divide-y divide-border px-5">
				<div v-for="event in release?.activity || []" :key="event.id" class="py-4">
					<div class="flex items-start justify-between gap-4"><p class="text-sm font-semibold">{{ event.action }}</p><span class="shrink-0 text-xs text-muted-fg">{{ event.time }}</span></div>
					<p class="mt-1 text-sm leading-6 text-muted-fg">{{ event.detail }}</p>
					<p class="mt-2 text-xs text-muted-fg">{{ event.actor }}</p>
				</div>
			</div>
		</DomDrawer>

		<DomDialog v-model="handoffOpen" title="Locale handoff" description="Keep reviewer guidance and glossary coverage attached to this locale release.">
			<div class="space-y-5">
				<DomTagCombobox v-model="appliedTerms" label="Applied glossary terms" :options="glossaryOptions" placeholder="Add a glossary term..." clearable>
					<template #item="{ item }"><div><p class="font-semibold">{{ item.label }}</p><p class="mt-1 text-xs text-muted-fg">{{ item.description }}</p></div></template>
				</DomTagCombobox>
				<DomTextareaInput v-model="handoffNote" label="Reviewer handoff note" :rows="4" placeholder="Add release context for localization operations..." />
			</div>
			<template #footer><DomButton variant="secondary" @click="handoffOpen = false">Cancel</DomButton><DomButton :loading="busy" @click="saveHandoff">Save handoff</DomButton></template>
		</DomDialog>

		<DomDialog v-model="publishOpen" title="Publish locale pack" :description="release?.readiness?.ready ? 'All server-owned checks have passed.' : 'Complete the remaining review gates before publishing.'">
			<div v-if="release" class="space-y-4">
				<DomAlert v-if="errorMessage" tone="danger" title="Cannot publish">{{ errorMessage }}</DomAlert>
				<div class="divide-y divide-border border-y border-border">
					<div v-for="check in release.readiness.checks" :key="check.id" class="flex items-center justify-between gap-4 py-3 text-sm"><span>{{ check.label }}</span><DomStatusPill :tone="check.ready ? 'success' : 'neutral'" size="sm">{{ check.ready ? 'Passed' : 'Pending' }}</DomStatusPill></div>
				</div>
				<DomCheckbox v-if="!release.publication" v-model="publishAcknowledged" label="I reviewed this locale pack and handoff" description="The API will lock this locale version and synchronize its JSON and PO bundles." />
				<div v-if="receipt || release.publication" class="border border-success/30 bg-success/10 p-4">
					<p class="font-semibold text-success">Locale bundle published</p>
					<dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
						<div><dt class="text-xs text-muted-fg">Bundle</dt><dd class="mt-1 font-mono text-xs">{{ (receipt || release.publication).bundle }}</dd></div>
						<div><dt class="text-xs text-muted-fg">Published</dt><dd class="mt-1">{{ formatDateTime((receipt || release.publication).publishedAt) }}</dd></div>
						<div class="sm:col-span-2"><dt class="text-xs text-muted-fg">Checksum</dt><dd class="mt-1 break-all font-mono text-[11px]">{{ (receipt || release.publication).checksum }}</dd></div>
					</dl>
				</div>
			</div>
			<template #footer><DomButton variant="secondary" @click="publishOpen = false">Close</DomButton><DomButton v-if="!release?.publication" :loading="busy" :disabled="!release?.readiness?.ready" @click="publishLocale">Publish {{ currentLocaleOption?.label }}</DomButton></template>
		</DomDialog>
	</div>
</template>
