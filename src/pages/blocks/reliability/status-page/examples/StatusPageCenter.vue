<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmailInput,
	DomJsonViewer,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTextInput,
} from '@getdom/studio/vue';

const apiBase = '/api/block-demos/status-page';
const workspace = ref(null);
const selectedRegion = ref('global');
const loading = ref(true);
const busyAction = ref('');
const error = ref('');
const notice = ref('');
const componentOpen = ref(false);
const componentDetail = ref(null);
const feedOpen = ref(false);
const feedData = ref(null);
const subscribeOpen = ref(false);
const subscribeStep = ref('edit');
const subscriptionPreview = ref(null);
const pendingSubscription = ref(null);
const subscriptionReceipt = ref(null);
const demoVerificationCode = ref('');
const verificationCode = ref('');
const fieldErrors = ref({});
const subscriptionDraft = reactive({
	email: 'platform@acme.example',
	region: 'global',
});
const componentSelections = reactive({});
const notificationSelections = reactive({
	incidents: true,
	maintenance: true,
	digest: false,
});

const activeIncident = computed(getActiveIncident);
const componentGroups = computed(getComponentGroups);
const selectedComponentIds = computed(getSelectedComponentIds);
const selectedNotificationIds = computed(getSelectedNotificationIds);
const affectedComponents = computed(getAffectedComponents);

onMounted(loadWorkspace);
watch(selectedRegion, handleRegionChange);

/**
 * Loads the public status workspace for the selected region.
 *
 * @param {boolean} clearMessages Whether to clear transient feedback.
 * @returns {Promise<void>}
 */
async function loadWorkspace(clearMessages = true) {
	if (clearMessages) clearFeedback();
	loading.value = true;
	try {
		const data = await request(`/bootstrap?region=${encodeURIComponent(selectedRegion.value)}`);
		workspace.value = data;
		initializeComponentSelections();
	} catch (requestError) {
		error.value = requestError.message || 'Unable to load public status.';
	} finally {
		loading.value = false;
	}
}

/**
 * Refreshes the current region when its selector changes.
 *
 * @returns {Promise<void>}
 */
async function handleRegionChange() {
	subscriptionDraft.region = selectedRegion.value;
	await loadWorkspace(false);
}

/**
 * Returns the current active incident.
 *
 * @returns {Record<string, unknown> | null} Active incident.
 */
function getActiveIncident() {
	return workspace.value?.activeIncidents?.[0] || null;
}

/**
 * Groups region-specific components into their public product areas.
 *
 * @returns {Array<Record<string, unknown>>} Populated component groups.
 */
function getComponentGroups() {
	if (!workspace.value) return [];
	return workspace.value.catalog.componentGroups.map((group) => ({
		...group,
		components: workspace.value.components.filter((component) => component.groupId === group.id),
	}));
}

/**
 * Returns component identifiers selected for subscription.
 *
 * @returns {string[]} Selected component identifiers.
 */
function getSelectedComponentIds() {
	return Object.entries(componentSelections).filter(([, selected]) => selected).map(([componentId]) => componentId);
}

/**
 * Returns notification identifiers selected for subscription.
 *
 * @returns {string[]} Selected notification identifiers.
 */
function getSelectedNotificationIds() {
	return Object.entries(notificationSelections).filter(([, selected]) => selected).map(([notificationId]) => notificationId);
}

/**
 * Resolves the component records affected by the active incident.
 *
 * @returns {Array<Record<string, unknown>>} Affected component records.
 */
function getAffectedComponents() {
	if (!activeIncident.value || !workspace.value) return [];
	return workspace.value.components.filter((component) => activeIncident.value.componentIds.includes(component.id));
}

/**
 * Initializes component subscription choices from the loaded catalog.
 *
 * @returns {void}
 */
function initializeComponentSelections() {
	for (const component of workspace.value?.components || []) {
		if (!(component.id in componentSelections)) componentSelections[component.id] = true;
	}
}

/**
 * Refreshes the public page and reports when evidence was checked.
 *
 * @returns {Promise<void>}
 */
async function refreshStatus() {
	busyAction.value = 'refresh';
	clearFeedback();
	try {
		await loadWorkspace(false);
		notice.value = `Status evidence refreshed at ${formatTime(workspace.value.page.checkedAt)}.`;
	} finally {
		busyAction.value = '';
	}
}

/**
 * Loads one component's evidence into the detail dialog.
 *
 * @param {Record<string, unknown>} component Public component summary.
 * @returns {Promise<void>}
 */
async function openComponent(component) {
	busyAction.value = `component:${component.id}`;
	clearFeedback();
	try {
		componentDetail.value = await request(`/components/${component.id}?region=${encodeURIComponent(selectedRegion.value)}`);
		componentOpen.value = true;
	} catch (requestError) {
		error.value = requestError.message || 'Unable to load component evidence.';
	} finally {
		busyAction.value = '';
	}
}

/**
 * Loads the machine-readable incident feed into a DOM Studio viewer.
 *
 * @returns {Promise<void>}
 */
async function openFeed() {
	busyAction.value = 'feed';
	clearFeedback();
	try {
		feedData.value = await request('/feed');
		feedOpen.value = true;
	} catch (requestError) {
		error.value = requestError.message || 'Unable to load the reliability feed.';
	} finally {
		busyAction.value = '';
	}
}

/**
 * Opens a fresh subscription workflow using the current region.
 *
 * @returns {void}
 */
function openSubscription() {
	subscriptionDraft.region = selectedRegion.value;
	subscribeStep.value = 'edit';
	subscriptionPreview.value = null;
	pendingSubscription.value = null;
	subscriptionReceipt.value = null;
	demoVerificationCode.value = '';
	verificationCode.value = '';
	fieldErrors.value = {};
	subscribeOpen.value = true;
}

/**
 * Updates one component selection in the subscription draft.
 *
 * @param {string} componentId Component identifier.
 * @param {boolean} selected Whether the component is selected.
 * @returns {void}
 */
function setComponentSelected(componentId, selected) {
	componentSelections[componentId] = selected;
	fieldErrors.value = { ...fieldErrors.value, componentIds: [] };
}

/**
 * Updates one notification selection in the subscription draft.
 *
 * @param {string} notificationId Notification identifier.
 * @param {boolean} selected Whether the notification type is selected.
 * @returns {void}
 */
function setNotificationSelected(notificationId, selected) {
	notificationSelections[notificationId] = selected;
	fieldErrors.value = { ...fieldErrors.value, notificationIds: [] };
}

/**
 * Creates a server-validated subscription preview.
 *
 * @returns {Promise<void>}
 */
async function previewSubscription() {
	busyAction.value = 'preview-subscription';
	clearFeedback();
	fieldErrors.value = {};
	try {
		const data = await request('/subscription-preview', {
			method: 'POST',
			body: subscriptionPayload(),
		});
		subscriptionPreview.value = data.preview;
		subscribeStep.value = 'preview';
	} catch (requestError) {
		applyRequestError(requestError);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Commits an exact subscription preview and sends confirmation evidence.
 *
 * @returns {Promise<void>}
 */
async function createSubscription() {
	busyAction.value = 'create-subscription';
	clearFeedback();
	try {
		const data = await request('/subscriptions', {
			method: 'POST',
			body: {
				revision: subscriptionPreview.value.workspaceRevision,
				previewId: subscriptionPreview.value.id,
				previewChecksum: subscriptionPreview.value.checksum,
			},
		});
		workspace.value.revision = data.revision;
		pendingSubscription.value = data.subscription;
		subscriptionReceipt.value = data.deliveryReceipt;
		demoVerificationCode.value = data.demoVerificationCode;
		subscribeStep.value = 'verify';
	} catch (requestError) {
		applyRequestError(requestError);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Verifies a pending subscription with the received confirmation code.
 *
 * @returns {Promise<void>}
 */
async function verifySubscription() {
	busyAction.value = 'verify-subscription';
	clearFeedback();
	fieldErrors.value = {};
	try {
		const data = await request(`/subscriptions/${pendingSubscription.value.id}/verify`, {
			method: 'POST',
			body: { version: pendingSubscription.value.version, code: verificationCode.value },
		});
		workspace.value.revision = data.revision;
		pendingSubscription.value = data.subscription;
		subscriptionReceipt.value = data.receipt;
		subscribeStep.value = 'complete';
		await loadWorkspace(false);
	} catch (requestError) {
		applyRequestError(requestError);
	} finally {
		busyAction.value = '';
	}
}

/**
 * Restores the seeded public status state.
 *
 * @returns {Promise<void>}
 */
async function resetDemo() {
	busyAction.value = 'reset';
	clearFeedback();
	try {
		await request('/reset', { method: 'POST' });
		selectedRegion.value = 'global';
		await loadWorkspace(false);
		notice.value = 'The public status demo has been reset.';
	} catch (requestError) {
		error.value = requestError.message || 'Unable to reset the demo.';
	} finally {
		busyAction.value = '';
	}
}

/**
 * Scrolls to one public page section without changing routes.
 *
 * @param {string} sectionId Section identifier.
 * @returns {void}
 */
function goToSection(sectionId) {
	document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Builds the current subscription API payload.
 *
 * @returns {Record<string, unknown>} Subscription payload.
 */
function subscriptionPayload() {
	return {
		email: subscriptionDraft.email,
		region: subscriptionDraft.region,
		componentIds: selectedComponentIds.value,
		notificationIds: selectedNotificationIds.value,
	};
}

/**
 * Copies structured request errors into visible form or page feedback.
 *
 * @param {Error & { fields?: Record<string, string[]> }} requestError Request error.
 * @returns {void}
 */
function applyRequestError(requestError) {
	fieldErrors.value = requestError.fields || {};
	error.value = requestError.message || 'The request could not be completed.';
}

/**
 * Returns visible errors for one form field.
 *
 * @param {string} field Field name.
 * @returns {string[]} Field errors.
 */
function errorsFor(field) {
	return fieldErrors.value[field] || [];
}

/**
 * Clears transient page feedback.
 *
 * @returns {void}
 */
function clearFeedback() {
	error.value = '';
	notice.value = '';
}

/**
 * Sends one JSON request to the repository-local block API.
 *
 * @param {string} path API path relative to the status-page base.
 * @param {{ method?: string, body?: Record<string, unknown> }} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed API response.
 */
async function request(path, options = {}) {
	const response = await fetch(`${apiBase}${path}`, {
		method: options.method || 'GET',
		headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const data = await response.json();
	if (!response.ok) {
		const requestError = new Error(data.message || `Request failed with ${response.status}.`);
		requestError.fields = data.fields || {};
		requestError.status = response.status;
		throw requestError;
	}
	return data;
}

/**
 * Returns a semantic CSS class for one daily health sample.
 *
 * @param {string} status Status identifier.
 * @returns {string} Tailwind background class.
 */
function historyClass(status) {
	if (status === 'operational') return 'bg-success';
	if (status === 'maintenance') return 'bg-primary';
	if (status === 'degraded') return 'bg-warning';
	return 'bg-destructive';
}

/**
 * Formats an ISO timestamp as a concise UTC time.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Formatted time.
 */
function formatTime(value) {
	return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }).format(new Date(value));
}

/**
 * Formats an ISO timestamp as a compact date and time.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Formatted date and time.
 */
function formatDateTime(value) {
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }).format(new Date(value));
}

/**
 * Formats an ISO date for incident history.
 *
 * @param {string} value ISO timestamp.
 * @returns {string} Formatted date.
 */
function formatDate(value) {
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

/**
 * Resolves a component label by identifier.
 *
 * @param {string} componentId Component identifier.
 * @returns {string} Component label.
 */
function componentLabel(componentId) {
	return workspace.value?.components.find((component) => component.id === componentId)?.name || componentId;
}

/**
 * Resolves a region label by identifier.
 *
 * @param {string} regionId Region identifier.
 * @returns {string} Region label.
 */
function regionLabel(regionId) {
	return workspace.value?.catalog.regions.find((region) => region.value === regionId)?.label || regionId;
}
</script>

<template>
	<div class="min-h-dvh bg-canvas text-canvas-fg">
		<header class="border-b border-border/80 bg-canvas/95">
			<div class="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold tracking-tight">{{ workspace?.page.name || 'Northstar Cloud' }}</p>
					<p class="truncate text-xs text-muted-fg">status.northstar.example</p>
				</div>
				<nav class="hidden items-center gap-1 md:flex" aria-label="Status page sections">
					<DomButton variant="ghost" size="sm" @click="goToSection('current-status')">Current status</DomButton>
					<DomButton variant="ghost" size="sm" @click="goToSection('maintenance')">Maintenance</DomButton>
					<DomButton variant="ghost" size="sm" @click="goToSection('incident-history')">Incident history</DomButton>
				</nav>
				<DomButton size="sm" @click="openSubscription">Subscribe</DomButton>
			</div>
		</header>

		<main v-if="workspace" class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
			<section id="current-status" class="scroll-mt-6 py-10 sm:py-14">
				<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
					<div class="max-w-3xl">
						<DomStatusPill
							:tone="workspace.overall.tone"
							:label="workspace.overall.affectedCount ? `${workspace.overall.affectedCount} affected component${workspace.overall.affectedCount === 1 ? '' : 's'}` : 'Live status'"
							:variant="workspace.overall.tone === 'warning' ? 'solid' : 'soft'"
							:pulse="workspace.overall.affectedCount > 0"
						/>
						<h1 class="mt-5 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">{{ workspace.overall.title }}</h1>
						<p class="mt-4 max-w-2xl text-base leading-7 text-muted-fg sm:text-lg">{{ workspace.overall.summary }}</p>
					</div>
					<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-1">
						<DomSelect v-model="selectedRegion" label="Customer region" :options="workspace.catalog.regions" />
						<DomButton variant="secondary" size="sm" :loading="busyAction === 'refresh'" @click="refreshStatus">
							Refresh status
						</DomButton>
					</div>
				</div>
				<div class="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-fg">
					<span>Evidence checked {{ formatTime(workspace.page.checkedAt) }}</span>
					<span>API revision {{ workspace.revision }}</span>
					<button type="button" class="font-medium text-canvas-fg underline decoration-border underline-offset-4" :disabled="busyAction === 'feed'" @click="openFeed">JSON feed</button>
				</div>
			</section>

			<DomAlert v-if="error" class="mb-6" tone="danger" title="The request needs attention" :description="error" />
			<DomAlert v-if="notice" class="mb-6" tone="success" title="Status page updated" :description="notice" />

			<section v-if="activeIncident" id="active-incident" class="scroll-mt-6 border-y border-warning/35 bg-warning/[0.07] py-8 sm:py-10">
				<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
					<div>
						<div class="flex flex-wrap items-center gap-3">
							<DomStatusPill tone="warning" label="Monitoring" variant="solid" pulse />
							<span class="text-xs font-medium text-muted-fg">Updated {{ formatTime(activeIncident.updatedAt) }}</span>
						</div>
						<h2 class="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{{ activeIncident.title }}</h2>
						<p class="mt-3 max-w-3xl text-sm leading-7 text-muted-fg sm:text-base">{{ activeIncident.impact }}</p>

						<ol class="mt-8 border-l border-warning/40 pl-5">
							<li v-for="(update, index) in activeIncident.updates" :key="update.id" class="relative pb-7 last:pb-0">
								<span class="absolute -left-[1.48rem] top-1.5 size-2 rounded-full ring-4 ring-canvas" :class="index === 0 ? 'bg-warning' : 'bg-muted-fg'" aria-hidden="true"></span>
								<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
									<h3 class="text-sm font-semibold">{{ update.label }}</h3>
									<time class="text-xs text-muted-fg">{{ formatTime(update.publishedAt) }}</time>
								</div>
								<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">{{ update.body }}</p>
							</li>
						</ol>
					</div>
					<aside class="border-t border-warning/25 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Affected</p>
						<ul class="mt-3 space-y-3">
							<li v-for="component in affectedComponents" :key="component.id" class="flex items-center justify-between gap-3 text-sm">
								<span class="font-medium">{{ component.name }}</span>
								<DomBadge tone="warning" variant="solid" size="sm">{{ component.statusLabel }}</DomBadge>
							</li>
						</ul>
						<p class="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Region</p>
						<p class="mt-2 text-sm font-medium">{{ activeIncident.regionIds.map(regionLabel).join(', ') }}</p>
						<DomButton class="mt-6 w-full" variant="secondary" size="sm" @click="openSubscription">Follow this incident</DomButton>
					</aside>
				</div>
			</section>

			<section id="availability" class="scroll-mt-6 py-10 sm:py-14">
				<div class="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Last 30 days</p>
						<h2 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Service availability</h2>
					</div>
					<p class="max-w-lg text-sm leading-6 text-muted-fg">Status is published per customer-facing capability, not internal infrastructure.</p>
				</div>

				<div class="mt-8 border-t border-border">
					<section v-for="group in componentGroups" :key="group.id" class="grid border-b border-border py-7 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
						<div class="mb-5 lg:mb-0">
							<h3 class="text-sm font-semibold">{{ group.label }}</h3>
							<p class="mt-1 text-xs leading-5 text-muted-fg">{{ group.description }}</p>
						</div>
						<div class="divide-y divide-border/70">
							<button
								v-for="component in group.components"
								:key="component.id"
								type="button"
								class="grid w-full gap-4 py-5 text-left first:pt-0 last:pb-0 md:grid-cols-[12rem_minmax(0,1fr)_9rem] md:items-center"
								:aria-label="`View ${component.name} status evidence`"
								@click="openComponent(component)"
							>
								<span>
									<span class="block text-sm font-semibold">{{ component.name }}</span>
									<span class="mt-1 block text-xs text-muted-fg">{{ component.uptime.toFixed(3) }}% uptime</span>
								</span>
								<span>
									<span class="grid grid-cols-[repeat(30,minmax(2px,1fr))] gap-[3px]" aria-label="Thirty daily health samples">
										<span
											v-for="day in component.history"
											:key="`${component.id}-${day.date}`"
											class="h-8 rounded-[2px]"
											:class="historyClass(day.status)"
											:title="`${day.label}: ${workspace.catalog.statuses[day.status].label}`"
										></span>
									</span>
									<span class="mt-1.5 flex justify-between text-[10px] text-muted-fg"><span>30 days ago</span><span>Today</span></span>
								</span>
								<span class="md:text-right">
									<DomStatusPill :tone="component.tone" :label="component.statusLabel" :variant="component.tone === 'warning' ? 'solid' : 'soft'" size="sm" :pulse="component.status !== 'operational'" />
									<span class="mt-1.5 block text-xs text-muted-fg">View evidence</span>
								</span>
							</button>
						</div>
					</section>
				</div>
			</section>

			<div class="grid border-t border-border lg:grid-cols-2 lg:divide-x lg:divide-border">
				<section id="maintenance" class="scroll-mt-6 py-10 lg:pr-10">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Planned work</p>
					<h2 class="mt-2 text-2xl font-semibold tracking-tight">Scheduled maintenance</h2>
					<div class="mt-7 divide-y divide-border">
						<article v-for="window in workspace.maintenance" :key="window.id" class="py-5 first:pt-0">
							<div class="flex flex-wrap items-center gap-2">
								<DomStatusPill tone="info" label="Scheduled" size="sm" />
								<time class="text-xs text-muted-fg">{{ formatDateTime(window.startsAt) }}</time>
							</div>
							<h3 class="mt-3 text-base font-semibold">{{ window.title }}</h3>
							<p class="mt-2 text-sm leading-6 text-muted-fg">{{ window.impact }}</p>
						</article>
					</div>
				</section>

				<section id="incident-history" class="scroll-mt-6 border-t border-border py-10 lg:border-t-0 lg:pl-10">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Past 30 days</p>
					<h2 class="mt-2 text-2xl font-semibold tracking-tight">Incident history</h2>
					<div v-if="workspace.incidentHistory.length" class="mt-7 divide-y divide-border">
						<article v-for="incident in workspace.incidentHistory" :key="incident.id" class="py-5 first:pt-0">
							<div class="flex flex-wrap items-center gap-2">
								<DomStatusPill tone="success" label="Resolved" size="sm" />
								<time class="text-xs text-muted-fg">{{ formatDate(incident.resolvedAt) }}</time>
							</div>
							<h3 class="mt-3 text-base font-semibold">{{ incident.title }}</h3>
							<p class="mt-2 text-sm leading-6 text-muted-fg">{{ incident.impact }}</p>
							<p class="mt-2 text-xs text-muted-fg">{{ incident.componentIds.map(componentLabel).join(', ') }}</p>
						</article>
					</div>
					<p v-else class="mt-7 text-sm text-muted-fg">No incidents were reported for this region.</p>
				</section>
			</div>
		</main>

		<div v-else class="mx-auto grid min-h-[42rem] w-full max-w-6xl content-start gap-6 px-4 py-12 sm:px-6 lg:px-8">
			<DomSkeleton height="2.5rem" width="52%" />
			<DomSkeleton height="7rem" width="100%" />
			<DomSkeleton height="18rem" width="100%" />
		</div>

		<footer class="border-t border-border">
			<div class="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-muted-fg sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
				<div>
					<p class="font-medium text-canvas-fg">{{ workspace?.page.name || 'Northstar Cloud' }} status</p>
					<p class="mt-1">Public reliability evidence and customer incident communication.</p>
				</div>
				<div class="flex flex-wrap gap-3">
					<button type="button" class="underline decoration-border underline-offset-4" @click="openFeed">JSON feed</button>
					<button type="button" class="underline decoration-border underline-offset-4" :disabled="busyAction === 'reset'" @click="resetDemo">Reset demo</button>
				</div>
			</div>
		</footer>

		<DomDialog v-model="componentOpen" :title="componentDetail?.component?.name || 'Component evidence'" description="Current regional status, daily availability, and related customer events." size="lg">
			<div v-if="componentDetail" class="space-y-6">
				<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
					<div>
						<DomStatusPill :tone="componentDetail.component.tone" :label="componentDetail.component.statusLabel" :variant="componentDetail.component.tone === 'warning' ? 'solid' : 'soft'" />
						<p class="mt-3 text-sm leading-6 text-muted-fg">{{ componentDetail.component.detail }}</p>
					</div>
					<div class="text-left sm:text-right">
						<p class="text-xs uppercase tracking-[0.14em] text-muted-fg">30-day uptime</p>
						<p class="mt-1 text-2xl font-semibold">{{ componentDetail.component.uptime.toFixed(3) }}%</p>
					</div>
				</div>
				<div>
					<div class="grid grid-cols-[repeat(30,minmax(3px,1fr))] gap-1" aria-label="Thirty daily health samples">
						<span v-for="day in componentDetail.component.history" :key="day.date" class="h-12 rounded-[3px]" :class="historyClass(day.status)" :title="`${day.label}: ${workspace.catalog.statuses[day.status].label}`"></span>
					</div>
					<div class="mt-2 flex justify-between text-xs text-muted-fg"><span>30 days ago</span><span>Today</span></div>
				</div>
				<div class="grid gap-5 sm:grid-cols-2">
					<section>
						<h3 class="text-sm font-semibold">Related incidents</h3>
						<p v-if="!componentDetail.incidents.length" class="mt-2 text-sm text-muted-fg">No incidents in this evidence window.</p>
						<ul v-else class="mt-2 space-y-2 text-sm text-muted-fg">
							<li v-for="incident in componentDetail.incidents" :key="incident.id">{{ incident.title }}</li>
						</ul>
					</section>
					<section>
						<h3 class="text-sm font-semibold">Scheduled maintenance</h3>
						<p v-if="!componentDetail.maintenance.length" class="mt-2 text-sm text-muted-fg">No maintenance scheduled.</p>
						<ul v-else class="mt-2 space-y-2 text-sm text-muted-fg">
							<li v-for="window in componentDetail.maintenance" :key="window.id">{{ window.title }}</li>
						</ul>
					</section>
				</div>
			</div>
		</DomDialog>

		<DomDialog v-model="feedOpen" title="Public reliability feed" description="The same incident updates are available as a machine-readable JSON Feed." size="xl">
			<DomJsonViewer v-if="feedData" :value="feedData" title="Status updates" filename="status-feed.json" :preview-lines="16" />
		</DomDialog>

		<DomDialog v-if="workspace" v-model="subscribeOpen" title="Subscribe to updates" description="Choose only the services and messages that matter to you." size="lg" :footer="false">
			<div v-if="subscribeStep === 'edit'" class="space-y-6">
				<DomAlert v-if="error" tone="danger" title="Review the subscription" :description="error" />
				<div class="grid gap-4 sm:grid-cols-2">
					<DomEmailInput v-model="subscriptionDraft.email" label="Work email" placeholder="you@example.com" :errors="errorsFor('email')" />
					<DomSelect v-model="subscriptionDraft.region" label="Region" :options="workspace.catalog.regions" :errors="errorsFor('region')" />
				</div>
				<section>
					<div class="flex items-baseline justify-between gap-4">
						<h3 class="text-sm font-semibold">Components</h3>
						<span class="text-xs text-muted-fg">{{ selectedComponentIds.length }} selected</span>
					</div>
					<p v-if="errorsFor('componentIds').length" class="mt-2 text-xs text-destructive">{{ errorsFor('componentIds')[0] }}</p>
					<div class="mt-3 grid gap-3 sm:grid-cols-2">
						<div v-for="component in workspace.components" :key="component.id" class="border-b border-border pb-3">
							<DomCheckbox
								:model-value="Boolean(componentSelections[component.id])"
								:label="component.name"
								:description="component.description"
								@update:model-value="setComponentSelected(component.id, $event)"
							/>
						</div>
					</div>
				</section>
				<section>
					<h3 class="text-sm font-semibold">Messages</h3>
					<p v-if="errorsFor('notificationIds').length" class="mt-2 text-xs text-destructive">{{ errorsFor('notificationIds')[0] }}</p>
					<div class="mt-3 space-y-3">
						<DomCheckbox
							v-for="notification in workspace.catalog.notifications"
							:key="notification.value"
							:model-value="Boolean(notificationSelections[notification.value])"
							:label="notification.label"
							:description="notification.description"
							@update:model-value="setNotificationSelected(notification.value, $event)"
						/>
					</div>
				</section>
				<div class="flex justify-end gap-3 border-t border-border pt-5">
					<DomButton variant="secondary" @click="subscribeOpen = false">Cancel</DomButton>
					<DomButton :loading="busyAction === 'preview-subscription'" @click="previewSubscription">Review subscription</DomButton>
				</div>
			</div>

			<div v-else-if="subscribeStep === 'preview'" class="space-y-6">
				<DomAlert tone="info" title="Confirmation required" :description="`We will send a confirmation link to ${subscriptionPreview.emailMasked}. It expires in one hour.`" />
				<dl class="divide-y divide-border border-y border-border text-sm">
					<div class="grid gap-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)]"><dt class="text-muted-fg">Region</dt><dd class="font-medium">{{ subscriptionPreview.regionLabel }}</dd></div>
					<div class="grid gap-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)]"><dt class="text-muted-fg">Components</dt><dd class="font-medium">{{ subscriptionPreview.componentLabels.join(', ') }}</dd></div>
					<div class="grid gap-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)]"><dt class="text-muted-fg">Messages</dt><dd class="font-medium">{{ subscriptionPreview.notificationLabels.join(', ') }}</dd></div>
				</dl>
				<div class="flex justify-between gap-3">
					<DomButton variant="secondary" @click="subscribeStep = 'edit'">Back</DomButton>
					<DomButton :loading="busyAction === 'create-subscription'" @click="createSubscription">Send confirmation</DomButton>
				</div>
			</div>

			<div v-else-if="subscribeStep === 'verify'" class="space-y-6">
				<DomAlert tone="success" title="Confirmation email accepted" :description="`${subscriptionReceipt.provider} accepted delivery to ${subscriptionReceipt.recipient}.`" />
				<DomTextInput v-model="verificationCode" label="Six-digit confirmation code" placeholder="000000" :errors="errorsFor('code')" />
				<p class="text-xs text-muted-fg">Demo code: <span class="font-semibold text-canvas-fg">{{ demoVerificationCode }}</span></p>
				<div class="flex justify-end">
					<DomButton :loading="busyAction === 'verify-subscription'" @click="verifySubscription">Verify subscription</DomButton>
				</div>
			</div>

			<div v-else class="space-y-6">
				<DomAlert tone="success" title="Subscription active" :description="`${pendingSubscription.emailMasked} will now receive the selected status updates.`" />
				<dl class="divide-y divide-border border-y border-border text-sm">
					<div class="grid gap-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)]"><dt class="text-muted-fg">Receipt</dt><dd class="break-all font-mono text-xs">{{ subscriptionReceipt.id }}</dd></div>
					<div class="grid gap-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)]"><dt class="text-muted-fg">Checksum</dt><dd class="break-all font-mono text-xs">{{ subscriptionReceipt.checksum }}</dd></div>
				</dl>
				<div class="flex justify-end"><DomButton @click="subscribeOpen = false">Done</DomButton></div>
			</div>
		</DomDialog>
	</div>
</template>
