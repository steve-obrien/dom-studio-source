<script setup>
import { computed, onMounted, ref } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomCheckbox,
	DomDialog,
	DomEmailInput,
	DomEmptyState,
	DomJsonViewer,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTabs,
	DomTextareaInput,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';

const mobileViews = [
	{ key: 'envelopes', label: 'Envelopes' },
	{ key: 'document', label: 'Document' },
	{ key: 'details', label: 'Details' },
];

const inspectorTabs = [
	{ key: 'recipients', label: 'Recipients' },
	{ key: 'readiness', label: 'Readiness' },
	{ key: 'evidence', label: 'Evidence' },
];

const loading = ref(true);
const busy = ref(false);
const bootstrap = ref(null);
const envelope = ref(null);
const selectedEnvelopeId = ref('');
const selectedDocumentId = ref('');
const selectedRecipientId = ref('');
const selectedPage = ref('1');
const envelopeSearch = ref('');
const statusFilter = ref('all');
const activeMobileView = ref('document');
const inspectorTab = ref('recipients');
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});
const latestReceipt = ref(null);
const certificateEvidence = ref(null);

const addFieldDialogOpen = ref(false);
const approveDialogOpen = ref(false);
const sendDialogOpen = ref(false);
const reminderDialogOpen = ref(false);
const signDialogOpen = ref(false);
const voidDialogOpen = ref(false);
const resetDialogOpen = ref(false);

const settingsDraft = ref(createEmptySettingsDraft());
const recipientDraft = ref(createEmptyRecipientDraft());
const addFieldDraft = ref(createEmptyFieldDraft());
const approvalDraft = ref({ reason: 'Finance verified this exact version and checksum against the approved grant summary.', acknowledged: false });
const sendAcknowledged = ref(false);
const reminderDraft = ref({ reason: 'Recipient requested a fresh link and signing reminder.', acknowledged: false });
const signAcknowledged = ref(false);
const voidDraft = ref({ confirmSubject: '', reason: '', acknowledged: false });

const workspace = computed(() => bootstrap.value?.workspace || {});
const filteredEnvelopes = computed(getFilteredEnvelopes);
const selectedDocument = computed(() => envelope.value?.documents.find((document) => document.id === selectedDocumentId.value) || envelope.value?.documents[0] || null);
const selectedRecipient = computed(() => envelope.value?.recipients.find((recipient) => recipient.id === selectedRecipientId.value) || envelope.value?.recipients[0] || null);
const selectedPageNumber = computed(() => Number(selectedPage.value || 1));
const selectedDocumentFields = computed(() => envelope.value?.fields.filter((field) => field.documentId === selectedDocument.value?.id && field.page === selectedPageNumber.value) || []);
const selectedRecipientFields = computed(() => envelope.value?.fields.filter((field) => field.recipientId === selectedRecipient.value?.id) || []);
const documentOptions = computed(getDocumentOptions);
const recipientOptions = computed(getRecipientOptions);
const pageOptions = computed(getPageOptions);
const envelopeIsDraft = computed(() => envelope.value?.status === 'draft');
const envelopeIsSent = computed(() => envelope.value?.status === 'sent');
const envelopeIsCompleted = computed(() => envelope.value?.status === 'completed');
const selectedRecipientCanAct = computed(() => envelopeIsSent.value && ['pending', 'viewed'].includes(selectedRecipient.value?.status));

/**
 * Returns a blank settings draft before an envelope loads.
 *
 * @returns {Record<string, unknown>} Empty settings draft.
 */
function createEmptySettingsDraft() {
	return {
		subject: '',
		message: '',
		deliveryMode: 'sequential',
		reminderCadence: 'every_3_days',
		expiresInDays: '14',
		signingOrder: true,
		declineReasonRequired: true,
	};
}

/**
 * Returns a blank recipient draft before an envelope loads.
 *
 * @returns {Record<string, unknown>} Empty recipient draft.
 */
function createEmptyRecipientDraft() {
	return { name: '', email: '', role: 'candidate', required: true, identityCheck: false };
}

/**
 * Returns a blank field creation draft.
 *
 * @returns {Record<string, unknown>} Empty field draft.
 */
function createEmptyFieldDraft() {
	return { documentId: '', recipientId: '', type: 'signature', page: '1', position: 'lower_right', required: true };
}

/**
 * Creates an editable settings draft from the current envelope.
 *
 * @param {Record<string, unknown>} value Envelope view.
 * @returns {Record<string, unknown>} Settings draft.
 */
function createSettingsDraft(value) {
	return {
		subject: value.subject,
		message: value.message,
		deliveryMode: value.deliveryMode,
		reminderCadence: value.reminderCadence,
		expiresInDays: value.expiresInDays,
		signingOrder: value.signingOrder,
		declineReasonRequired: value.declineReasonRequired,
	};
}

/**
 * Creates an editable recipient draft from the selected recipient.
 *
 * @param {Record<string, unknown> | null} value Recipient view.
 * @returns {Record<string, unknown>} Recipient draft.
 */
function createRecipientDraft(value) {
	if (!value) return createEmptyRecipientDraft();
	return {
		name: value.name,
		email: value.email,
		role: value.role,
		required: value.required,
		identityCheck: value.identityCheck,
	};
}

/**
 * Loads the signing workspace and its default envelope.
 *
 * @returns {Promise<void>}
 */
async function loadWorkspace() {
	loading.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/document-signing/bootstrap');
		bootstrap.value = result;
		applyEnvelopePayload(result);
	} catch (error) {
		handleRequestError(error);
	} finally {
		loading.value = false;
	}
}

/**
 * Loads one envelope from the server-owned workspace.
 *
 * @param {string} envelopeId Envelope identifier.
 * @returns {Promise<void>}
 */
async function selectEnvelope(envelopeId) {
	if (busy.value || envelopeId === envelope.value?.id) return;
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/document-signing/envelopes/${envelopeId}`);
		applyEnvelopePayload(result);
		activeMobileView.value = 'document';
		inspectorTab.value = result.envelope.status === 'completed' ? 'evidence' : 'recipients';
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Applies a server envelope response and rebuilds the editable drafts.
 *
 * @param {Record<string, unknown>} result Envelope response.
 * @param {Record<string, string>} preferred Preferred relationship identifiers.
 * @returns {void}
 */
function applyEnvelopePayload(result, preferred = {}) {
	if (result.workspace && bootstrap.value) bootstrap.value.workspace = result.workspace;
	if (result.envelopes && bootstrap.value) bootstrap.value.envelopes = result.envelopes;
	if (!result.envelope) return;
	envelope.value = result.envelope;
	selectedEnvelopeId.value = result.envelope.id;
	const recipientId = preferred.recipientId || result.selectedRecipientId || selectedRecipientId.value;
	const documentId = preferred.documentId || result.selectedDocumentId || selectedDocumentId.value;
	selectedRecipientId.value = result.envelope.recipients.some((recipient) => recipient.id === recipientId) ? recipientId : result.envelope.recipients[0]?.id || '';
	selectedDocumentId.value = result.envelope.documents.some((document) => document.id === documentId) ? documentId : result.envelope.documents[0]?.id || '';
	const document = result.envelope.documents.find((item) => item.id === selectedDocumentId.value);
	selectedPage.value = String(document?.pages || 1);
	settingsDraft.value = createSettingsDraft(result.envelope);
	recipientDraft.value = createRecipientDraft(result.envelope.recipients.find((recipient) => recipient.id === selectedRecipientId.value));
	addFieldDraft.value = {
		...createEmptyFieldDraft(),
		documentId: selectedDocumentId.value,
		recipientId: selectedRecipientId.value,
		page: String(document?.pages || 1),
	};
	voidDraft.value = { confirmSubject: '', reason: '', acknowledged: false };
	certificateEvidence.value = result.envelope.certificate || null;
}

/**
 * Selects a document and focuses its final page where signatures usually live.
 *
 * @param {string} documentId Document identifier.
 * @returns {void}
 */
function chooseDocument(documentId) {
	selectedDocumentId.value = documentId;
	const document = envelope.value.documents.find((item) => item.id === documentId);
	selectedPage.value = String(document?.pages || 1);
	addFieldDraft.value.documentId = documentId;
	addFieldDraft.value.page = selectedPage.value;
}

/**
 * Selects a recipient and refreshes the corresponding draft.
 *
 * @param {string} recipientId Recipient identifier.
 * @returns {void}
 */
function chooseRecipient(recipientId) {
	selectedRecipientId.value = recipientId;
	recipientDraft.value = createRecipientDraft(envelope.value.recipients.find((recipient) => recipient.id === recipientId));
	addFieldDraft.value.recipientId = recipientId;
}

/**
 * Saves the envelope delivery contract through the exact-revision API.
 *
 * @returns {Promise<void>}
 */
async function saveSettings() {
	await runMutation(
		`/api/block-demos/document-signing/envelopes/${envelope.value.id}/settings`,
		{ method: 'PATCH', body: { ...settingsDraft.value, revision: envelope.value.revision } },
		'Envelope settings saved.',
	);
}

/**
 * Saves the selected recipient through the exact-revision API.
 *
 * @returns {Promise<void>}
 */
async function saveRecipient() {
	await runMutation(
		`/api/block-demos/document-signing/envelopes/${envelope.value.id}/recipients/${selectedRecipient.value.id}`,
		{ method: 'PATCH', body: { ...recipientDraft.value, revision: envelope.value.revision } },
		'Recipient details saved.',
		{ recipientId: selectedRecipient.value.id },
	);
}

/**
 * Adds a signing field using a server-owned position template.
 *
 * @returns {Promise<void>}
 */
async function addField() {
	const result = await runMutation(
		`/api/block-demos/document-signing/envelopes/${envelope.value.id}/fields`,
		{ method: 'POST', body: { ...addFieldDraft.value, page: Number(addFieldDraft.value.page), revision: envelope.value.revision } },
		'Signing field added.',
		{ recipientId: addFieldDraft.value.recipientId, documentId: addFieldDraft.value.documentId },
	);
	if (result) addFieldDialogOpen.value = false;
}

/**
 * Removes one signing field through the exact-revision API.
 *
 * @param {Record<string, unknown>} field Signing field view.
 * @returns {Promise<void>}
 */
async function removeField(field) {
	await runMutation(
		`/api/block-demos/document-signing/envelopes/${envelope.value.id}/fields/${field.id}`,
		{ method: 'DELETE', body: { revision: envelope.value.revision } },
		'Signing field removed.',
		{ recipientId: field.recipientId, documentId: field.documentId },
	);
}

/**
 * Approves the selected document version with checksum evidence.
 *
 * @returns {Promise<void>}
 */
async function approveDocument() {
	const result = await runMutation(
		`/api/block-demos/document-signing/envelopes/${envelope.value.id}/documents/${selectedDocument.value.id}/approve`,
		{ method: 'POST', body: { ...approvalDraft.value, revision: envelope.value.revision } },
		'Document version approved.',
		{ documentId: selectedDocument.value.id },
	);
	if (result) {
		approveDialogOpen.value = false;
		approvalDraft.value.acknowledged = false;
		inspectorTab.value = 'readiness';
	}
}

/**
 * Recalculates server-owned readiness and updates the visible check result.
 *
 * @returns {Promise<void>}
 */
async function runPreflight() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/document-signing/envelopes/${envelope.value.id}/preflight`, { method: 'POST' });
		envelope.value.preflight = result.preflight;
		successMessage.value = `${result.preflight.passed} of ${result.preflight.total} server checks are passing.`;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Sends the ready envelope and stores the provider receipt.
 *
 * @returns {Promise<void>}
 */
async function sendEnvelope() {
	const result = await runMutation(
		`/api/block-demos/document-signing/envelopes/${envelope.value.id}/send`,
		{ method: 'POST', body: { revision: envelope.value.revision, acknowledged: sendAcknowledged.value } },
		'Envelope sent to the signing provider.',
	);
	if (result) {
		latestReceipt.value = result.receipt;
		sendDialogOpen.value = false;
		sendAcknowledged.value = false;
		inspectorTab.value = 'evidence';
		activeMobileView.value = 'details';
	}
}

/**
 * Sends an operator reminder to the selected active recipient.
 *
 * @returns {Promise<void>}
 */
async function sendReminder() {
	const result = await runMutation(
		`/api/block-demos/document-signing/envelopes/${envelope.value.id}/recipients/${selectedRecipient.value.id}/reminders`,
		{ method: 'POST', body: { ...reminderDraft.value, revision: envelope.value.revision } },
		'Reminder queued for delivery.',
		{ recipientId: selectedRecipient.value.id },
	);
	if (result) {
		latestReceipt.value = result.receipt;
		reminderDialogOpen.value = false;
		reminderDraft.value.acknowledged = false;
	}
}

/**
 * Simulates a deterministic signing-provider callback for the selected recipient.
 *
 * @returns {Promise<void>}
 */
async function simulateSignature() {
	const result = await runMutation(
		`/api/block-demos/document-signing/envelopes/${envelope.value.id}/recipients/${selectedRecipient.value.id}/sign`,
		{ method: 'POST', body: { revision: envelope.value.revision, acknowledged: signAcknowledged.value } },
		'Provider signature callback accepted.',
		{ recipientId: selectedRecipient.value.id },
	);
	if (result) {
		latestReceipt.value = result.receipt;
		signDialogOpen.value = false;
		signAcknowledged.value = false;
		if (result.envelope.status === 'completed') {
			certificateEvidence.value = result.envelope.certificate;
			inspectorTab.value = 'evidence';
		}
	}
}

/**
 * Voids the current envelope and invalidates active signing links.
 *
 * @returns {Promise<void>}
 */
async function voidEnvelope() {
	const result = await runMutation(
		`/api/block-demos/document-signing/envelopes/${envelope.value.id}/void`,
		{ method: 'POST', body: { ...voidDraft.value, revision: envelope.value.revision } },
		'Envelope voided and signing links invalidated.',
	);
	if (result) {
		latestReceipt.value = result.receipt;
		voidDialogOpen.value = false;
		inspectorTab.value = 'evidence';
	}
}

/**
 * Loads the immutable certificate through its dedicated API boundary.
 *
 * @returns {Promise<void>}
 */
async function loadCertificate() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(`/api/block-demos/document-signing/envelopes/${envelope.value.id}/certificate`);
		certificateEvidence.value = result.certificate;
		successMessage.value = 'Completion certificate loaded.';
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Restores the deterministic workspace after explicit confirmation.
 *
 * @returns {Promise<void>}
 */
async function resetWorkspace() {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson('/api/block-demos/document-signing/reset', { method: 'POST' });
		bootstrap.value = result;
		latestReceipt.value = null;
		applyEnvelopePayload(result);
		resetDialogOpen.value = false;
		activeMobileView.value = 'document';
		inspectorTab.value = 'recipients';
		successMessage.value = result.message;
	} catch (error) {
		handleRequestError(error);
	} finally {
		busy.value = false;
	}
}

/**
 * Opens the field dialog using the current relationship context.
 *
 * @returns {void}
 */
function openFieldDialog() {
	addFieldDraft.value = {
		...createEmptyFieldDraft(),
		documentId: selectedDocument.value.id,
		recipientId: selectedRecipient.value.id,
		page: String(selectedDocument.value.pages),
	};
	clearFeedback();
	addFieldDialogOpen.value = true;
}

/**
 * Opens the document approval dialog for the current exact version.
 *
 * @param {string} documentId Document identifier.
 * @returns {void}
 */
function openApprovalDialog(documentId) {
	chooseDocument(documentId);
	approvalDraft.value = { reason: 'Finance verified this exact version and checksum against the approved grant summary.', acknowledged: false };
	clearFeedback();
	approveDialogOpen.value = true;
}

/**
 * Opens the reminder dialog for one active recipient.
 *
 * @returns {void}
 */
function openReminderDialog() {
	reminderDraft.value = { reason: 'Recipient requested a fresh link and signing reminder.', acknowledged: false };
	clearFeedback();
	reminderDialogOpen.value = true;
}

/**
 * Opens the void confirmation dialog with a clean audit draft.
 *
 * @returns {void}
 */
function openVoidDialog() {
	voidDraft.value = { confirmSubject: '', reason: '', acknowledged: false };
	clearFeedback();
	voidDialogOpen.value = true;
}

/**
 * Runs a JSON mutation and applies its latest safe envelope state.
 *
 * @param {string} url API URL.
 * @param {Record<string, unknown>} options Fetch options.
 * @param {string} message Success message.
 * @param {Record<string, string>} preferred Preferred relationship identifiers.
 * @returns {Promise<Record<string, unknown> | null>} Mutation response or null.
 */
async function runMutation(url, options, message, preferred = {}) {
	busy.value = true;
	clearFeedback();
	try {
		const result = await requestJson(url, options);
		applyEnvelopePayload(result, preferred);
		successMessage.value = result.message || message;
		return result;
	} catch (error) {
		handleRequestError(error);
		return null;
	} finally {
		busy.value = false;
	}
}

/**
 * Converts field validation records into component error arrays.
 *
 * @param {unknown} error Request failure.
 * @returns {void}
 */
function handleRequestError(error) {
	const result = error && typeof error === 'object' ? error : { message: String(error) };
	errorMessage.value = result.message || 'The signing workspace could not complete that action.';
	fieldErrors.value = (result.fields || []).reduce((errors, item) => {
		errors[item.field] ||= [];
		errors[item.field].push(item.message);
		return errors;
	}, {});
	if (result.envelope) applyEnvelopePayload(result);
	if (result.code === 'conflict') inspectorTab.value = 'readiness';
}

/**
 * Clears visible request feedback before a new action.
 *
 * @returns {void}
 */
function clearFeedback() {
	errorMessage.value = '';
	successMessage.value = '';
	fieldErrors.value = {};
}

/**
 * Sends a JSON request and throws the parsed API error shape.
 *
 * @param {string} url API URL.
 * @param {Record<string, unknown>} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed response.
 */
async function requestJson(url, options = {}) {
	const requestOptions = { method: options.method || 'GET', headers: {} };
	if (options.body !== undefined) {
		requestOptions.headers['content-type'] = 'application/json';
		requestOptions.body = JSON.stringify(options.body);
	}
	const response = await fetch(url, requestOptions);
	const result = await response.json();
	if (!response.ok || result.error) throw result;
	return result;
}

/**
 * Returns envelopes matching the current search and lifecycle filter.
 *
 * @returns {Array<Record<string, unknown>>} Filtered envelope summaries.
 */
function getFilteredEnvelopes() {
	const query = envelopeSearch.value.trim().toLowerCase();
	return (bootstrap.value?.envelopes || []).filter((item) => {
		const matchesStatus = statusFilter.value === 'all' || item.status === statusFilter.value;
		const matchesSearch = !query || `${item.name} ${item.subject}`.toLowerCase().includes(query);
		return matchesStatus && matchesSearch;
	});
}

/**
 * Returns rich document options for the document selector.
 *
 * @returns {Array<Record<string, unknown>>} Document options.
 */
function getDocumentOptions() {
	return (envelope.value?.documents || []).map((document) => ({ value: document.id, label: document.name, description: `${document.version} · ${document.statusLabel} · ${document.pages} pages` }));
}

/**
 * Returns rich recipient options for signing-field assignment.
 *
 * @returns {Array<Record<string, unknown>>} Recipient options.
 */
function getRecipientOptions() {
	return (envelope.value?.recipients || []).map((recipient) => ({ value: recipient.id, label: recipient.name, description: `${recipient.roleLabel} · signing order ${recipient.order}` }));
}

/**
 * Returns page options for the selected document.
 *
 * @returns {Array<Record<string, unknown>>} Page options.
 */
function getPageOptions() {
	const pages = selectedDocument.value?.pages || 1;
	return Array.from({ length: pages }, (_, index) => ({ value: String(index + 1), label: `Page ${index + 1}`, description: index + 1 === pages ? 'Final page' : 'Document page' }));
}

/**
 * Formats an ISO timestamp for compact evidence rows.
 *
 * @param {string | null} value ISO timestamp.
 * @returns {string} Localized date and time.
 */
function formatTime(value) {
	if (!value) return 'Not yet';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

/**
 * Returns a short relative time for navigation and activity rows.
 *
 * @param {string | null} value ISO timestamp.
 * @returns {string} Relative time label.
 */
function relativeTime(value) {
	if (!value) return 'Not yet';
	const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.round(hours / 24)}d ago`;
}

onMounted(loadWorkspace);
</script>

<template>
	<div class="h-dvh min-h-0 overflow-hidden bg-canvas text-canvas-fg">
		<div v-if="loading" class="flex h-full min-h-0 flex-col">
			<div class="h-16 shrink-0 border-b border-border p-4"><DomSkeleton variant="text" :lines="2" /></div>
			<div class="grid min-h-0 flex-1 xl:grid-cols-[16rem_minmax(0,1fr)_22rem]"><div class="hidden border-r border-border p-4 xl:block"><DomSkeleton variant="text" :lines="14" /></div><div class="p-5"><DomSkeleton variant="text" :lines="18" /></div><div class="hidden border-l border-border p-4 xl:block"><DomSkeleton variant="text" :lines="14" /></div></div>
		</div>

		<div v-else-if="bootstrap && envelope" class="flex h-full min-h-0 flex-col">
			<header class="shrink-0 border-b border-border bg-canvas">
				<div class="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-4">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2"><h1 class="truncate text-base font-semibold sm:text-lg">Envelope room</h1><DomStatusPill :tone="workspace.awaitingCount ? 'warning' : 'success'" size="sm">{{ workspace.awaitingCount }} awaiting</DomStatusPill></div>
						<p class="truncate text-xs text-muted-fg">{{ workspace.name }} · versioned documents · provider evidence</p>
					</div>
					<div class="flex shrink-0 items-center gap-2"><div class="hidden sm:block"><DomButton size="sm" variant="ghost" @click="resetDialogOpen = true">Reset</DomButton></div><DomButton v-if="envelopeIsDraft" size="sm" :disabled="!envelope.preflight.ready" @click="sendDialogOpen = true"><span class="hidden sm:inline">Review & send</span><span class="sm:hidden">Send</span></DomButton><DomButton v-else-if="envelopeIsCompleted" size="sm" @click="inspectorTab = 'evidence'; activeMobileView = 'details'; loadCertificate()">Certificate</DomButton><DomButton v-else size="sm" variant="secondary" @click="inspectorTab = 'recipients'; activeMobileView = 'details'">Manage</DomButton></div>
				</div>
			</header>

			<div v-if="errorMessage || successMessage" class="shrink-0 border-b border-border px-3 py-2 sm:px-4">
				<DomAlert v-if="errorMessage" tone="danger" variant="soft" title="Signing action needs attention" :description="errorMessage" dismissible @dismiss="errorMessage = ''" />
				<DomAlert v-else tone="success" variant="soft" title="Envelope updated" :description="successMessage" dismissible @dismiss="successMessage = ''" />
			</div>

			<DomTabs v-model="activeMobileView" :tabs="mobileViews" variant="page" class="shrink-0 xl:hidden [&>div:last-child]:hidden" />

			<div class="flex min-h-0 flex-1">
				<aside class="min-h-0 w-full shrink-0 flex-col border-r border-border bg-secondary/10 xl:flex xl:w-64" :class="activeMobileView === 'envelopes' ? 'flex' : 'hidden'">
					<div class="shrink-0 border-b border-border p-3">
						<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Envelopes</p><p class="mt-1 text-sm font-semibold">{{ workspace.envelopeCount }} in this workspace</p></div><DomBadge tone="neutral" variant="outline">{{ workspace.completedCount }} complete</DomBadge></div>
						<div class="mt-3"><DomTextInput v-model="envelopeSearch" type="search" label="Find envelope" placeholder="Name or subject" /></div>
						<div class="mt-3"><DomSelect v-model="statusFilter" label="Lifecycle" :options="bootstrap.options.statuses" width="min-w-[18rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div>
					</div>
					<nav class="min-h-0 flex-1 divide-y divide-border overflow-y-auto" aria-label="Signing envelopes">
						<button v-for="item in filteredEnvelopes" :key="item.id" type="button" class="w-full border-l-2 px-4 py-4 text-left transition hover:bg-secondary/45 focus-visible:outline-2 focus-visible:outline-ring" :class="item.id === envelope.id ? 'border-l-primary bg-secondary/55' : 'border-l-transparent'" @click="selectEnvelope(item.id)">
							<div class="min-w-0"><p class="line-clamp-2 text-sm font-semibold">{{ item.name }}</p><p class="mt-1 line-clamp-2 text-xs leading-5 text-muted-fg">{{ item.subject }}</p></div>
							<div class="mt-3 flex items-center justify-between gap-3"><DomStatusPill :tone="item.statusTone" size="sm">{{ item.statusLabel }}</DomStatusPill><span class="shrink-0 text-[11px] text-muted-fg">{{ relativeTime(item.updatedAt) }}</span></div><p class="mt-2 text-[11px] text-muted-fg">{{ item.documentCount }} documents · {{ item.recipientCount }} recipients</p>
						</button>
					</nav>
					<DomEmptyState v-if="!filteredEnvelopes.length" class="m-auto px-5 py-10" title="No matching envelopes" description="Try another lifecycle or search term." />
				</aside>

				<main class="min-h-0 min-w-0 flex-1 flex-col" :class="activeMobileView === 'document' ? 'flex' : 'hidden xl:flex'">
					<section class="shrink-0 border-b border-border px-4 py-3 sm:px-5">
						<div class="flex flex-wrap items-start justify-between gap-3"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><h2 class="truncate text-lg font-semibold">{{ envelope.name }}</h2><DomStatusPill :tone="envelope.statusTone" size="sm">{{ envelope.statusLabel }}</DomStatusPill><DomBadge tone="neutral" variant="outline">rev {{ envelope.revision }}</DomBadge></div><p class="mt-1 truncate text-xs text-muted-fg">{{ envelope.subject }}</p></div><div v-if="envelopeIsDraft" class="flex shrink-0 gap-2"><DomButton size="sm" variant="secondary" @click="openFieldDialog">Add field</DomButton><DomButton size="sm" variant="ghost" @click="inspectorTab = 'readiness'; activeMobileView = 'details'">{{ envelope.preflight.score }}% ready</DomButton></div><div v-else class="text-right text-xs text-muted-fg"><p>{{ envelope.completedRecipientCount }}/{{ envelope.recipientCount }} signed</p><p class="mt-1">{{ envelopeIsCompleted ? `Completed ${formatTime(envelope.completedAt)}` : `Expires ${formatTime(envelope.expiresAt)}` }}</p></div></div>
						<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[minmax(14rem,1fr)_9rem]"><DomSelect v-model="selectedDocumentId" label="Document" :options="documentOptions" width="min-w-[22rem]" @update:model-value="chooseDocument"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="selectedPage" label="Page" :options="pageOptions" width="min-w-[12rem]"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect></div>
					</section>

					<section class="min-h-0 flex-1 overflow-y-auto bg-secondary/25 p-3 sm:p-5">
						<article v-if="selectedDocument" class="relative mx-auto min-h-[40rem] w-full max-w-[38rem] overflow-hidden border border-slate-200 bg-white px-7 py-8 text-slate-950 shadow-xl sm:min-h-[44rem] sm:px-12 sm:py-10">
							<header class="border-b border-slate-200 pb-5"><div class="flex items-start justify-between gap-6"><div><p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{{ selectedDocument.content.eyebrow }}</p><h3 class="mt-2 text-xl font-semibold sm:text-2xl">{{ selectedDocument.content.title }}</h3><p class="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">{{ selectedDocument.content.subtitle }}</p></div><div class="shrink-0 text-right text-[10px] leading-5 text-slate-500"><p>{{ selectedDocument.version }}</p><p>Page {{ selectedPage }} of {{ selectedDocument.pages }}</p></div></div></header>
							<div class="mt-6 space-y-4 text-xs leading-6 text-slate-700 sm:text-sm sm:leading-7"><p v-for="paragraph in selectedDocument.content.paragraphs" :key="paragraph">{{ paragraph }}</p></div>
							<dl class="mt-6 divide-y divide-slate-200 border-y border-slate-200 text-xs sm:text-sm"><div v-for="term in selectedDocument.content.terms" :key="term.label" class="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-4 py-3"><dt class="font-medium text-slate-500">{{ term.label }}</dt><dd class="font-semibold">{{ term.value }}</dd></div></dl>
							<p class="mt-6 text-xs leading-6 text-slate-600 sm:text-sm">{{ selectedDocument.content.note }}</p>
							<footer class="absolute inset-x-7 bottom-7 grid grid-cols-2 gap-8 text-[10px] text-slate-500 sm:inset-x-12 sm:bottom-9"><div class="border-t border-slate-300 pt-2">Company signature</div><div class="border-t border-slate-300 pt-2">Recipient signature</div></footer>
							<button v-for="field in selectedDocumentFields" :key="field.id" type="button" class="absolute min-w-28 border border-slate-700 bg-slate-100/95 px-2 py-1.5 text-left text-[10px] font-semibold text-slate-950 shadow-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-slate-900" :style="{ left: `${field.x}%`, top: `${field.y}%`, transform: 'translate(-8%, -50%)' }" :aria-label="field.label" @click="chooseRecipient(field.recipientId); inspectorTab = 'recipients'; activeMobileView = 'details'"><span class="block">{{ field.typeLabel }}</span><span class="mt-0.5 block text-slate-600">{{ envelope.recipients.find((recipient) => recipient.id === field.recipientId)?.name }}</span></button>
						</article>

						<div class="mx-auto mt-4 w-full max-w-[38rem] border-y border-border bg-canvas/85">
							<div class="flex items-center justify-between gap-3 px-3 py-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Fields on page {{ selectedPage }}</p><p class="mt-1 text-xs text-muted-fg">{{ selectedDocumentFields.length }} certificate-backed controls</p></div><DomButton v-if="envelopeIsDraft" size="sm" variant="ghost" @click="openFieldDialog">Add another</DomButton></div>
							<div v-if="selectedDocumentFields.length" class="divide-y divide-border"><div v-for="field in selectedDocumentFields" :key="field.id" class="flex items-center justify-between gap-3 px-3 py-3"><div class="min-w-0"><p class="truncate text-sm font-medium">{{ field.label }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ field.required ? 'Required' : 'Optional' }} · {{ field.position.replaceAll('_', ' ') }}</p></div><DomButton v-if="envelopeIsDraft" size="sm" variant="ghost" @click="removeField(field)">Remove</DomButton></div></div>
							<DomEmptyState v-else class="py-8" title="No fields on this page" description="Choose another page or add a signing field." />
						</div>
					</section>
				</main>

				<aside class="min-h-0 w-full shrink-0 flex-col border-l border-border bg-secondary/10 xl:flex xl:w-88" :class="activeMobileView === 'details' ? 'flex' : 'hidden'">
					<DomTabs v-model="inspectorTab" :tabs="inspectorTabs" variant="page" fill class="min-h-0 flex-1">
						<template #recipients>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Signing order</p><p class="mt-1 text-sm font-semibold">{{ envelope.recipientCount }} required recipients</p></div><DomBadge tone="neutral" variant="outline">{{ envelope.completedRecipientCount }} signed</DomBadge></div>
								<div class="mt-3 divide-y divide-border border-y border-border"><button v-for="recipient in envelope.recipients" :key="recipient.id" type="button" class="w-full border-l-2 px-3 py-3 text-left transition hover:bg-secondary/45" :class="recipient.id === selectedRecipient.id ? 'border-l-primary bg-secondary/45' : 'border-l-transparent'" @click="chooseRecipient(recipient.id)"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-sm font-medium">{{ recipient.order }}. {{ recipient.name }}</p><p class="mt-1 truncate text-xs text-muted-fg">{{ recipient.email || 'Email required before sending' }}</p></div><DomStatusPill :tone="recipient.statusTone" size="sm">{{ recipient.statusLabel }}</DomStatusPill></div><p class="mt-2 text-[11px] text-muted-fg">{{ recipient.roleLabel }} · {{ recipient.required ? 'required' : 'optional' }}</p></button></div>

								<div v-if="selectedRecipient" class="mt-5"><div class="flex items-center justify-between gap-3"><div><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Recipient contract</p><h3 class="mt-1 text-lg font-semibold">{{ selectedRecipient.name }}</h3></div><span class="font-mono text-[11px] text-muted-fg">order {{ selectedRecipient.order }}</span></div>
									<div v-if="envelopeIsDraft" class="mt-4 grid gap-4"><DomTextInput v-model="recipientDraft.name" label="Recipient name" :errors="fieldErrors.name || []" /><DomEmailInput v-model="recipientDraft.email" label="Recipient email" :errors="fieldErrors.email || []" /><DomSelect v-model="recipientDraft.role" label="Recipient role" :options="bootstrap.options.roles" :errors="fieldErrors.role || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><div class="divide-y divide-border border-y border-border"><DomCheckbox v-model="recipientDraft.required" class="py-3" label="Required recipient" description="The envelope cannot complete without this person." :errors="fieldErrors.required || []" /><DomCheckbox v-model="recipientDraft.identityCheck" class="py-3" label="Provider identity check" description="Record additional verification in the certificate." /></div><DomButton class="w-full" :loading="busy" @click="saveRecipient">Save recipient</DomButton></div>
									<div v-else class="mt-4"><DomAlert :tone="selectedRecipient.status === 'completed' ? 'success' : selectedRecipient.status === 'queued' ? 'info' : 'warning'" variant="soft" :title="selectedRecipient.statusLabel" :description="selectedRecipient.status === 'completed' ? `Signed ${formatTime(selectedRecipient.completedAt)} · ${selectedRecipient.evidenceHash}` : selectedRecipient.status === 'queued' ? 'Signing order has not reached this recipient yet.' : `Invited ${formatTime(selectedRecipient.invitedAt)} · signing link active.`" /><div v-if="selectedRecipientCanAct" class="mt-4 grid grid-cols-2 gap-2"><DomButton size="sm" variant="secondary" @click="openReminderDialog">Send reminder</DomButton><DomButton size="sm" @click="signDialogOpen = true">Simulate signing</DomButton></div></div>
									<div class="mt-6"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Assigned fields</p><div class="mt-2 divide-y divide-border border-y border-border"><div v-for="field in selectedRecipientFields" :key="field.id" class="py-3"><p class="text-sm font-medium">{{ field.typeLabel }}</p><p class="mt-1 text-xs text-muted-fg">{{ envelope.documents.find((document) => document.id === field.documentId)?.name }} · page {{ field.page }} · {{ field.required ? 'required' : 'optional' }}</p></div><p v-if="!selectedRecipientFields.length" class="py-4 text-sm text-muted-fg">No fields assigned.</p></div></div>
								</div>
							</div>
						</template>

						<template #readiness>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<DomAlert :tone="envelope.preflight.ready ? 'success' : 'warning'" variant="soft" :title="envelope.preflight.ready ? 'Ready for provider handoff' : `${envelope.preflight.total - envelope.preflight.passed} blocking check remains`" :description="`${envelope.preflight.passed} of ${envelope.preflight.total} authoritative checks are passing at revision ${envelope.revision}.`" />
								<div class="mt-4 divide-y divide-border border-y border-border"><div v-for="check in envelope.preflight.checks" :key="check.key" class="flex items-start gap-3 py-3"><DomStatusPill class="mt-0.5" :tone="check.done ? 'success' : 'warning'" size="sm">{{ check.done ? 'Pass' : 'Block' }}</DomStatusPill><div><p class="text-sm font-medium">{{ check.label }}</p><p class="mt-1 text-xs leading-5 text-muted-fg">{{ check.detail }}</p></div></div></div>
								<DomButton class="mt-4 w-full" size="sm" variant="secondary" :loading="busy" @click="runPreflight">Run server preflight</DomButton>

								<div class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Document versions</p><div class="mt-2 divide-y divide-border border-y border-border"><div v-for="document in envelope.documents" :key="document.id" class="py-3"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-sm font-medium">{{ document.name }} {{ document.version }}</p><p class="mt-1 truncate font-mono text-[10px] text-muted-fg">{{ document.checksum }}</p></div><DomStatusPill :tone="document.statusTone" size="sm">{{ document.statusLabel }}</DomStatusPill></div><DomButton v-if="envelopeIsDraft && document.status === 'needs_review'" class="mt-3" size="sm" @click="openApprovalDialog(document.id)">Review exact version</DomButton></div></div></div>

								<div v-if="envelopeIsDraft" class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Delivery contract</p><div class="mt-4 grid gap-4"><DomTextInput v-model="settingsDraft.subject" label="Email subject" :errors="fieldErrors.subject || []" /><DomTextareaInput v-model="settingsDraft.message" label="Recipient message" :rows="4" :errors="fieldErrors.message || []" /><DomSelect v-model="settingsDraft.deliveryMode" label="Delivery mode" :options="bootstrap.options.deliveryModes" :errors="fieldErrors.deliveryMode || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="settingsDraft.reminderCadence" label="Reminder cadence" :options="bootstrap.options.reminders" :errors="fieldErrors.reminderCadence || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="settingsDraft.expiresInDays" label="Signing window" :options="bootstrap.options.expiries" :errors="fieldErrors.expiresInDays || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomToggle v-model="settingsDraft.signingOrder" label="Enforce signing order" description="Invite each recipient only when the previous signer completes." :disabled="settingsDraft.deliveryMode !== 'sequential'" /><DomToggle v-model="settingsDraft.declineReasonRequired" label="Require decline reason" description="Preserve useful evidence when a recipient declines." /><DomButton class="w-full" :loading="busy" @click="saveSettings">Save delivery contract</DomButton></div></div>
								<DomButton v-if="['draft', 'sent'].includes(envelope.status)" class="mt-7 w-full" size="sm" variant="ghost" @click="openVoidDialog">Void envelope</DomButton>
							</div>
						</template>

						<template #evidence>
							<div class="h-full min-h-0 overflow-y-auto p-4">
								<DomAlert v-if="latestReceipt" tone="success" variant="soft" :title="latestReceipt.action.replaceAll('_', ' ')" :description="`${latestReceipt.id} · revision ${latestReceipt.revision} · ${formatTime(latestReceipt.createdAt)}`" />
								<div v-if="envelope.providerEnvelopeId" class="mt-4 border-y border-border py-4"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Provider envelope</p><p class="mt-2 break-all font-mono text-xs">{{ envelope.providerEnvelopeId }}</p><p class="mt-2 text-xs leading-5 text-muted-fg">{{ envelopeIsCompleted ? `Completed ${formatTime(envelope.completedAt)}` : `Signing links expire ${formatTime(envelope.expiresAt)}` }}</p></div>
								<div v-if="envelopeIsCompleted" class="mt-5"><div class="flex items-center justify-between gap-3"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Completion certificate</p><DomButton size="sm" variant="ghost" :loading="busy" @click="loadCertificate">Refresh</DomButton></div><DomJsonViewer v-if="certificateEvidence" class="mt-3" :value="certificateEvidence" title="Certificate evidence" :filename="`${envelope.id}-certificate.json`" :preview-lines="12" density="compact" /></div>
								<div class="mt-7"><p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Immutable activity</p><div class="mt-2 divide-y divide-border border-y border-border"><div v-for="event in envelope.events" :key="event.id" class="py-3"><div class="flex items-start justify-between gap-3"><p class="text-sm font-medium">{{ event.title }}</p><span class="shrink-0 text-[11px] text-muted-fg">{{ relativeTime(event.createdAt) }}</span></div><p class="mt-1 text-xs leading-5 text-muted-fg">{{ event.detail }}</p><p class="mt-1 text-[11px] text-muted-fg">{{ event.actor }}</p></div></div></div>
							</div>
						</template>
					</DomTabs>
				</aside>
			</div>

			<DomDialog v-model="addFieldDialogOpen" title="Add a signing field" description="Place a certificate-backed field using a canonical page position that survives responsive preview scaling.">
				<div class="grid gap-4 sm:grid-cols-2"><DomSelect v-model="addFieldDraft.documentId" label="Document" :options="documentOptions" :errors="fieldErrors.documentId || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="addFieldDraft.recipientId" label="Recipient" :options="recipientOptions" :errors="fieldErrors.recipientId || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="addFieldDraft.type" label="Field type" :options="bootstrap.options.fieldTypes" :errors="fieldErrors.type || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomSelect v-model="addFieldDraft.position" label="Position" :options="bootstrap.options.positions" :errors="fieldErrors.position || []"><template #option="{ option }"><div><p class="font-medium">{{ option.label }}</p><p class="mt-0.5 text-xs opacity-70">{{ option.description }}</p></div></template></DomSelect><DomTextInput v-model="addFieldDraft.page" type="number" label="Page number" :errors="fieldErrors.page || []" /><div class="flex items-end"><DomCheckbox v-model="addFieldDraft.required" class="pb-2" label="Required field" description="Block recipient completion until this field is signed." /></div></div>
				<template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="addField">Add field</DomButton></template>
			</DomDialog>

			<DomDialog v-model="approveDialogOpen" title="Approve exact document version" :description="`${selectedDocument?.name || ''} ${selectedDocument?.version || ''} · ${selectedDocument?.checksum || ''}`">
				<DomAlert tone="warning" variant="soft" title="The provider receives a frozen checksum" description="A later file replacement must create a new version and pass approval again." /><div class="mt-4"><DomTextareaInput v-model="approvalDraft.reason" label="Approval evidence" :rows="3" :errors="fieldErrors.reason || []" /></div><div class="mt-4 border-y border-border py-4"><DomCheckbox v-model="approvalDraft.acknowledged" label="I reviewed this exact version and checksum" description="The approval is added to the immutable envelope activity." :errors="fieldErrors.acknowledged || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Keep blocked</DomButton><DomButton :loading="busy" @click="approveDocument">Approve version</DomButton></template>
			</DomDialog>

			<DomDialog v-model="sendDialogOpen" title="Send this envelope?" description="The server will freeze document checksums, create provider signing links, and preserve an immutable send receipt.">
				<DomAlert :tone="envelope.preflight.ready ? 'success' : 'warning'" variant="soft" :title="envelope.preflight.ready ? 'Server preflight is ready' : 'Blocking checks remain'" :description="`${envelope.preflight.passed} of ${envelope.preflight.total} checks pass at revision ${envelope.revision}.`" /><div class="mt-4 divide-y divide-border border-y border-border"><div v-for="check in envelope.preflight.checks" :key="check.key" class="flex items-center justify-between gap-3 py-3"><p class="text-sm">{{ check.label }}</p><DomStatusPill :tone="check.done ? 'success' : 'warning'" size="sm">{{ check.done ? 'Pass' : 'Block' }}</DomStatusPill></div></div><div class="mt-4"><DomCheckbox v-model="sendAcknowledged" label="I verified recipients, versions, fields, and delivery settings" description="Sending creates active signing links and moves the envelope out of draft." :errors="fieldErrors.acknowledged || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Keep draft</DomButton><DomButton :loading="busy" :disabled="!envelope.preflight.ready" @click="sendEnvelope">Send envelope</DomButton></template>
			</DomDialog>

			<DomDialog v-model="reminderDialogOpen" :title="`Remind ${selectedRecipient?.name || 'recipient'}?`" description="Queue a provider reminder without changing the original invitation or signature evidence.">
				<DomTextareaInput v-model="reminderDraft.reason" label="Operator reason" :rows="3" :errors="fieldErrors.reason || []" /><div class="mt-4 border-y border-border py-4"><DomCheckbox v-model="reminderDraft.acknowledged" label="This reminder is appropriate" description="A cooldown prevents accidental repeated delivery." :errors="fieldErrors.acknowledged || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="sendReminder">Queue reminder</DomButton></template>
			</DomDialog>

			<DomDialog v-model="signDialogOpen" :title="`Simulate ${selectedRecipient?.name || 'recipient'} signing?`" description="This deterministic callback represents the external provider completing identity, fields, and certificate evidence.">
				<DomAlert tone="info" variant="soft" title="Demo provider callback" description="No real signature image or identity document is collected. The API stores only status, time, and an audit checksum." /><div class="mt-4 border-y border-border py-4"><DomCheckbox v-model="signAcknowledged" label="Accept the deterministic provider callback" description="Sequential envelopes invite the next recipient only after this callback succeeds." :errors="fieldErrors.acknowledged || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Cancel</DomButton><DomButton :loading="busy" @click="simulateSignature">Accept callback</DomButton></template>
			</DomDialog>

			<DomDialog v-model="voidDialogOpen" :title="`Void ${envelope.name}?`" description="Invalidate active signing links while retaining document versions, recipient evidence, and activity.">
				<DomTextInput v-model="voidDraft.confirmSubject" :label="`Type ${envelope.subject} to confirm`" :errors="fieldErrors.confirmSubject || []" /><div class="mt-4"><DomTextareaInput v-model="voidDraft.reason" label="Audit reason" :rows="3" :errors="fieldErrors.reason || []" /></div><div class="mt-4 border-y border-border py-4"><DomCheckbox v-model="voidDraft.acknowledged" label="I understand active signing links will stop" description="Completed recipient evidence remains immutable." :errors="fieldErrors.acknowledged || []" /></div>
				<template #footer><DomButton variant="secondary" data-close>Keep envelope</DomButton><DomButton variant="danger" :loading="busy" @click="voidEnvelope">Void envelope</DomButton></template>
			</DomDialog>

			<DomDialog v-model="resetDialogOpen" title="Reset document signing?" description="This clears process-local envelope changes, provider receipts, callbacks, reminders, and activity, then restores the seeded workspace.">
				<template #footer><DomButton variant="secondary" data-close>Keep workspace</DomButton><DomButton variant="danger" :loading="busy" @click="resetWorkspace">Reset demo</DomButton></template>
			</DomDialog>
		</div>

		<DomEmptyState v-else class="h-full" title="Signing workspace unavailable" description="Reload the preview to retry the repository-local bootstrap API." />
	</div>
</template>
