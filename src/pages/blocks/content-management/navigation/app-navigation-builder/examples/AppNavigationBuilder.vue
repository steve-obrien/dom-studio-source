<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomAppShell,
	DomAppTopBar,
	DomAvatar,
	DomButton,
	DomDialog,
	DomDrawer,
	DomIconButton,
	DomIconSelector,
	DomProfileMenu,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTagCombobox,
	DomTextInput,
	DomTextareaInput,
	DomToggle,
} from '@getdom/studio/vue';
import NavigationInspector from '../components/NavigationInspector.vue';
import NavigationTreePanel from '../components/NavigationTreePanel.vue';
import PreviewMenuItem from '../components/PreviewMenuItem.vue';

const menuIcon = 'M4 7h16M4 12h16M4 17h16';
const inspectIcon = 'M12 5v14M5 12h14';
const closeIcon = 'M6 6l12 12M18 6 6 18';

const bootstrap = ref(null);
const draft = ref(null);
const treeItems = ref([]);
const validation = ref({ issues: [], blockerCount: 0, warningCount: 0, status: 'ready', checks: [] });
const preview = ref({ items: [], meta: { visibleCount: 0, hiddenCount: 0 } });
const selectedItemId = ref('ops-console');
const editorDraft = ref(null);
const previewAudience = ref('member');
const previewDevice = ref('desktop');
const loading = ref(true);
const previewLoading = ref(false);
const saving = ref(false);
const validating = ref(false);
const publishing = ref(false);
const reordering = ref(false);
const message = ref('');
const errorMessage = ref('');
const navigatorOpen = ref(false);
const inspectorOpen = ref(false);
const previewMobileNavOpen = ref(false);
const addDialogOpen = ref(false);
const archiveDialogOpen = ref(false);
const publishDialogOpen = ref(false);
const publishReceipt = ref(null);
const releaseNote = ref('Fix operations destination and refresh audience navigation.');
const archiveReason = ref('This destination is no longer part of the primary application journey.');
const archiveTargetLabel = ref('');
const addDraft = ref(createNewItemDraft());

const selectedItem = computed(getSelectedItem);
const selectedPath = computed(getSelectedPath);
const selectedIssues = computed(getSelectedIssues);
const editorDirty = computed(getEditorDirty);
const selectedHasChildren = computed(getSelectedHasChildren);
const validationTone = computed(getValidationTone);
const validationLabel = computed(getValidationLabel);
const previewFrameClasses = computed(getPreviewFrameClasses);
const parentOptions = computed(getParentOptions);
const previewSelectedItem = computed(getPreviewSelectedItem);
const selectedVisibleInPreview = computed(getSelectedVisibleInPreview);

watch(selectedItem, synchronizeEditorDraft, { immediate: true });
watch([previewAudience, previewDevice], refreshPreviewFromControls);
onMounted(loadWorkspace);

/**
 * Return the selected item from the nested navigation tree.
 *
 * @returns {Record<string, unknown>|null} Selected navigation item.
 */
function getSelectedItem() {
	return findItem(treeItems.value, selectedItemId.value);
}

/**
 * Return the selected item breadcrumb path.
 *
 * @returns {string} Human-readable navigation path.
 */
function getSelectedPath() {
	return itemPath(treeItems.value, selectedItemId.value).map(getItemLabel).join(' / ');
}

/**
 * Return server-owned issues associated with the selected navigation item.
 *
 * @returns {Array<Record<string, unknown>>} Selected item issues.
 */
function getSelectedIssues() {
	return (validation.value?.issues || []).filter(isSelectedIssue);
}

/**
 * Compare the editable form with the latest server-backed item state.
 *
 * @returns {boolean} True when the inspector contains unsaved edits.
 */
function getEditorDirty() {
	if (!selectedItem.value || !editorDraft.value) return false;
	return JSON.stringify(editableSnapshot(selectedItem.value)) !== JSON.stringify(editableSnapshot(editorDraft.value));
}

/**
 * Check whether the selected item owns active child destinations.
 *
 * @returns {boolean} True when the selected item has children.
 */
function getSelectedHasChildren() {
	return Boolean(selectedItem.value?.children?.length);
}

/**
 * Map the current validation report to a DOM Studio status tone.
 *
 * @returns {string} Status tone.
 */
function getValidationTone() {
	if (validation.value?.blockerCount) return 'danger';
	if (validation.value?.warningCount) return 'warning';
	return 'success';
}

/**
 * Return the concise status label shown in the editor toolbar.
 *
 * @returns {string} Validation status label.
 */
function getValidationLabel() {
	if (validation.value?.blockerCount) return `${validation.value.blockerCount} blocker${validation.value.blockerCount === 1 ? '' : 's'}`;
	if (draft.value?.status === 'published') return `Version ${draft.value.publishedVersion} live`;
	return 'Ready to publish';
}

/**
 * Size the app-shell preview to its selected target without overflowing the iframe.
 *
 * @returns {Array<string>} Preview frame classes.
 */
function getPreviewFrameClasses() {
	const base = 'relative mx-auto h-full min-h-[32rem] transition-[width,max-width] duration-200';
	if (previewDevice.value === 'mobile') return [base, 'w-full max-w-[24rem]'];
	if (previewDevice.value === 'compact') return [base, 'w-full max-w-3xl'];
	return [base, 'w-full max-w-5xl'];
}

/**
 * Build valid parent options for the add-item dialog.
 *
 * @returns {Array<Record<string, string>>} Parent select options.
 */
function getParentOptions() {
	const options = [{ value: 'root', label: 'Top level', description: 'Place beside the primary destinations.' }];
	for (const item of flattenItems(treeItems.value)) {
		if (itemPath(treeItems.value, item.id).length >= 3) continue;
		options.push({ value: item.id, label: item.label, description: item.url });
	}
	return options;
}

/**
 * Return the selected item when it survives the current server preview policy.
 *
 * @returns {Record<string, unknown>|null} Visible preview item.
 */
function getPreviewSelectedItem() {
	return findItem(preview.value.items || [], selectedItemId.value) || flattenItems(preview.value.items || [])[0] || null;
}

/**
 * Check whether the editor selection is visible to the active preview audience.
 *
 * @returns {boolean} True when the selected item is present in the preview tree.
 */
function getSelectedVisibleInPreview() {
	return Boolean(findItem(preview.value.items || [], selectedItemId.value));
}

/**
 * Synchronize the inspector with a newly selected server-backed item.
 *
 * @param {Record<string, unknown>|null} item Selected navigation item.
 * @returns {void}
 */
function synchronizeEditorDraft(item) {
	editorDraft.value = item ? editableSnapshot(item) : null;
}

/**
 * Refresh the server-filtered preview after an audience or device change.
 *
 * @returns {Promise<void>} Resolves after the preview refresh completes.
 */
async function refreshPreviewFromControls() {
	previewMobileNavOpen.value = false;
	await loadPreview();
}

/**
 * Load the complete navigation workspace and its initial policy preview.
 *
 * @returns {Promise<void>} Resolves after the editor is ready.
 */
async function loadWorkspace() {
	loading.value = true;
	errorMessage.value = '';
	try {
		applyResponsivePreviewDefault();
		const result = await apiRequest('/api/block-demos/app-navigation-builder/bootstrap');
		bootstrap.value = result;
		draft.value = result.draft;
		treeItems.value = result.items;
		validation.value = result.validation;
		if (!findItem(result.items, selectedItemId.value)) selectedItemId.value = result.items[0]?.id || '';
		await loadPreview();
	} catch (error) {
		errorMessage.value = error.message;
	} finally {
		loading.value = false;
	}
}

/**
 * Choose a useful initial app-shell target for the iframe or mobile viewport.
 *
 * @returns {void}
 */
function applyResponsivePreviewDefault() {
	if (typeof window === 'undefined') return;
	if (window.matchMedia('(max-width: 639px)').matches) {
		previewDevice.value = 'mobile';
		return;
	}
	if (window.matchMedia('(max-width: 1023px)').matches) previewDevice.value = 'compact';
}

/**
 * Load the server-owned menu visible to the selected preview persona.
 *
 * @returns {Promise<void>} Resolves after the preview is updated.
 */
async function loadPreview() {
	if (!bootstrap.value) return;
	previewLoading.value = true;
	try {
		const query = new URLSearchParams({
			audience: previewAudience.value,
			device: previewDevice.value,
		});
		preview.value = await apiRequest(`/api/block-demos/app-navigation-builder/preview?${query}`);
	} catch (error) {
		errorMessage.value = error.message;
	} finally {
		previewLoading.value = false;
	}
}

/**
 * Select one navigation item and expose its inspector on constrained screens.
 *
 * @param {string} itemId Stable navigation item identifier.
 * @returns {void}
 */
function selectItem(itemId) {
	selectedItemId.value = String(itemId);
	navigatorOpen.value = false;
	if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches) inspectorOpen.value = true;
}

/**
 * Save the selected item through the optimistic API contract.
 *
 * @returns {Promise<void>} Resolves after the server accepts or rejects the edit.
 */
async function saveSelectedItem() {
	if (!editorDraft.value || !draft.value) return;
	saving.value = true;
	clearFeedback();
	try {
		const result = await apiRequest(`/api/block-demos/app-navigation-builder/items/${encodeURIComponent(editorDraft.value.id)}`, {
			method: 'PATCH',
			body: { ...editableSnapshot(editorDraft.value), revision: draft.value.revision },
		});
		applyMutation(result);
		message.value = result.message;
		await loadPreview();
	} catch (error) {
		handleApiError(error);
	} finally {
		saving.value = false;
	}
}

/**
 * Persist a tree reorder produced by pointer drag or keyboard commands.
 *
 * @param {Array<Record<string, unknown>>} items Reordered nested tree.
 * @returns {Promise<void>} Resolves after the server persists the hierarchy.
 */
async function persistReorder(items) {
	if (!draft.value || reordering.value) return;
	const previousItems = treeItems.value;
	treeItems.value = items;
	reordering.value = true;
	clearFeedback();
	try {
		const result = await apiRequest('/api/block-demos/app-navigation-builder/reorder', {
			method: 'POST',
			body: { items: compactTree(items), revision: draft.value.revision },
		});
		applyMutation(result);
		message.value = result.message;
		await loadPreview();
	} catch (error) {
		treeItems.value = previousItems;
		handleApiError(error);
	} finally {
		reordering.value = false;
	}
}

/**
 * Open the add-item flow with a useful parent default.
 *
 * @returns {void}
 */
function openAddDialog() {
	addDraft.value = createNewItemDraft(selectedItem.value?.id || 'root');
	addDialogOpen.value = true;
	navigatorOpen.value = false;
}

/**
 * Add a destination to the active navigation draft.
 *
 * @returns {Promise<void>} Resolves after the server creates the item.
 */
async function createItem() {
	if (!draft.value) return;
	saving.value = true;
	clearFeedback();
	try {
		const result = await apiRequest('/api/block-demos/app-navigation-builder/items', {
			method: 'POST',
			body: { ...addDraft.value, revision: draft.value.revision },
		});
		applyMutation(result);
		selectedItemId.value = result.item.id;
		addDialogOpen.value = false;
		message.value = result.message;
		await loadPreview();
	} catch (error) {
		handleApiError(error);
	} finally {
		saving.value = false;
	}
}

/**
 * Open the archive confirmation for the selected leaf item.
 *
 * @returns {void}
 */
function openArchiveDialog() {
	archiveTargetLabel.value = selectedItem.value?.label || 'This item';
	archiveReason.value = 'This destination is no longer part of the primary application journey.';
	archiveDialogOpen.value = true;
}

/**
 * Archive the selected leaf item with an audit reason.
 *
 * @returns {Promise<void>} Resolves after the server archives the item.
 */
async function archiveSelectedItem() {
	if (!selectedItem.value || !draft.value) return;
	saving.value = true;
	clearFeedback();
	try {
		const result = await apiRequest(`/api/block-demos/app-navigation-builder/items/${encodeURIComponent(selectedItem.value.id)}/archive`, {
			method: 'POST',
			body: { revision: draft.value.revision, reason: archiveReason.value },
		});
		applyMutation(result);
		selectedItemId.value = treeItems.value[0]?.id || '';
		archiveDialogOpen.value = false;
		inspectorOpen.value = false;
		message.value = result.message;
		await loadPreview();
	} catch (error) {
		handleApiError(error);
	} finally {
		saving.value = false;
	}
}

/**
 * Run route, audience, feature-flag, and hierarchy checks on the server.
 *
 * @returns {Promise<boolean>} True when the validation request succeeds.
 */
async function runValidation() {
	if (!draft.value) return false;
	validating.value = true;
	clearFeedback();
	try {
		const result = await apiRequest('/api/block-demos/app-navigation-builder/validate', {
			method: 'POST',
			body: { revision: draft.value.revision },
		});
		validation.value = result.validation;
		draft.value = result.draft;
		message.value = result.message;
		return true;
	} catch (error) {
		handleApiError(error);
		return false;
	} finally {
		validating.value = false;
	}
}

/**
 * Refresh validation and open the publish review dialog.
 *
 * @returns {Promise<void>} Resolves after the review dialog opens.
 */
async function openPublishDialog() {
	publishReceipt.value = null;
	const loaded = await runValidation();
	if (loaded) publishDialogOpen.value = true;
}

/**
 * Publish an immutable navigation version after all server checks pass.
 *
 * @returns {Promise<void>} Resolves after publish succeeds or fails.
 */
async function publishDraft() {
	if (!draft.value) return;
	publishing.value = true;
	clearFeedback();
	try {
		const result = await apiRequest('/api/block-demos/app-navigation-builder/publish', {
			method: 'POST',
			body: { revision: draft.value.revision, releaseNote: releaseNote.value },
		});
		applyMutation(result);
		publishReceipt.value = result.receipt;
		message.value = result.message;
	} catch (error) {
		handleApiError(error);
	} finally {
		publishing.value = false;
	}
}

/**
 * Apply a successful API mutation as the new client source of truth.
 *
 * @param {Record<string, unknown>} result Mutation response.
 * @returns {void}
 */
function applyMutation(result) {
	if (result.draft) draft.value = result.draft;
	if (result.items) treeItems.value = result.items;
	if (result.validation) validation.value = result.validation;
	const nextSelected = findItem(treeItems.value, selectedItemId.value);
	if (!nextSelected) selectedItemId.value = treeItems.value[0]?.id || '';
	synchronizeEditorDraft(findItem(treeItems.value, selectedItemId.value));
}

/**
 * Keep the inspector drawer open after teleported DOM Studio controls commit.
 *
 * @returns {void}
 */
function keepInspectorDrawerOpen() {
	inspectorOpen.value = true;
	setTimeout(() => { inspectorOpen.value = true; }, 24);
}

/**
 * Toggle the mobile app-shell menu inside the live preview.
 *
 * @returns {void}
 */
function togglePreviewNavigation() {
	previewMobileNavOpen.value = !previewMobileNavOpen.value;
}

/**
 * Close the publish dialog and clear any previous receipt.
 *
 * @returns {void}
 */
function closePublishDialog() {
	publishDialogOpen.value = false;
	publishReceipt.value = null;
}

/**
 * Clear transient success and error feedback before a new request.
 *
 * @returns {void}
 */
function clearFeedback() {
	message.value = '';
	errorMessage.value = '';
}

/**
 * Surface an API error and synchronize conflict state when available.
 *
 * @param {Error & { payload?: Record<string, unknown> }} error Request error.
 * @returns {void}
 */
function handleApiError(error) {
	errorMessage.value = error.message;
	if (error.payload?.draft) draft.value = error.payload.draft;
	if (error.payload?.items) treeItems.value = error.payload.items;
}

/**
 * Request one demo API route and convert non-success responses into rich errors.
 *
 * @param {string} path API route.
 * @param {{ method?: string, body?: Record<string, unknown> }} [options={}] Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed API payload.
 */
async function apiRequest(path, options = {}) {
	const response = await fetch(path, {
		method: options.method || 'GET',
		headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const payload = await response.json();
	if (!response.ok) {
		const error = new Error(payload.message || 'The navigation request could not be completed.');
		error.payload = payload;
		throw error;
	}
	return payload;
}

/**
 * Return the first item matching an identifier in a nested tree.
 *
 * @param {Array<Record<string, unknown>>} items Nested items.
 * @param {string} itemId Stable identifier.
 * @returns {Record<string, unknown>|null} Matching item or null.
 */
function findItem(items, itemId) {
	for (const item of items || []) {
		if (String(item.id) === String(itemId)) return item;
		const child = findItem(item.children || [], itemId);
		if (child) return child;
	}
	return null;
}

/**
 * Return the ancestor path for one nested item.
 *
 * @param {Array<Record<string, unknown>>} items Nested items.
 * @param {string} itemId Stable identifier.
 * @param {Array<Record<string, unknown>>} [parents=[]] Parent accumulator.
 * @returns {Array<Record<string, unknown>>} Ancestor and selected items.
 */
function itemPath(items, itemId, parents = []) {
	for (const item of items || []) {
		const nextParents = [...parents, item];
		if (String(item.id) === String(itemId)) return nextParents;
		const childPath = itemPath(item.children || [], itemId, nextParents);
		if (childPath.length) return childPath;
	}
	return [];
}

/**
 * Flatten a nested tree while preserving its visible order.
 *
 * @param {Array<Record<string, unknown>>} items Nested items.
 * @returns {Array<Record<string, unknown>>} Flat item list.
 */
function flattenItems(items) {
	const rows = [];
	for (const item of items || []) rows.push(item, ...flattenItems(item.children || []));
	return rows;
}

/**
 * Return a serializable tree containing only identifiers and children.
 *
 * @param {Array<Record<string, unknown>>} items Nested tree items.
 * @returns {Array<Record<string, unknown>>} Compact reorder payload.
 */
function compactTree(items) {
	return (items || []).map(compactTreeItem);
}

/**
 * Serialize one item for the reorder API.
 *
 * @param {Record<string, unknown>} item Tree item.
 * @returns {Record<string, unknown>} Compact tree item.
 */
function compactTreeItem(item) {
	return { id: item.id, children: compactTree(item.children || []) };
}

/**
 * Return only fields editable through the item inspector.
 *
 * @param {Record<string, unknown>} item Navigation item.
 * @returns {Record<string, unknown>} Editable item snapshot.
 */
function editableSnapshot(item) {
	return {
		id: item.id,
		label: item.label || '',
		url: item.url || '',
		description: item.description || '',
		icon: item.icon || '',
		visibility: item.visibility || 'everyone',
		audience: [...(item.audience || [])],
		featureFlag: item.featureFlag || '',
		requiresAuth: item.requiresAuth !== false,
		openInNewTab: item.openInNewTab === true,
	};
}

/**
 * Create a fresh add-item form model.
 *
 * @param {string} [parentId='root'] Default parent identifier.
 * @returns {Record<string, unknown>} Add-item draft.
 */
function createNewItemDraft(parentId = 'root') {
	return {
		parentId,
		label: 'Help center',
		url: '/app/help',
		description: 'Guides, product updates, and contact options.',
		visibility: 'everyone',
		audience: ['all-users'],
		featureFlag: '',
		requiresAuth: true,
		openInNewTab: false,
		icon: 'M5 5h14v14H5V5Zm3 4h8M8 12h8M8 15h5',
	};
}

/**
 * Return a navigation item label for path rendering.
 *
 * @param {Record<string, unknown>} item Navigation item.
 * @returns {string} Item label.
 */
function getItemLabel(item) {
	return String(item.label || 'Untitled');
}

/**
 * Test whether one issue belongs to the selected navigation item.
 *
 * @param {Record<string, unknown>} issue Validation issue.
 * @returns {boolean} True when the issue belongs to the selected item.
 */
function isSelectedIssue(issue) {
	return String(issue.itemId) === String(selectedItemId.value);
}

/**
 * Format a timestamp for compact editor chrome.
 *
 * @param {string|null|undefined} value ISO timestamp.
 * @returns {string} Localized timestamp label.
 */
function formatTimestamp(value) {
	if (!value) return 'Not yet';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
</script>

<template>
	<div class="flex h-dvh min-h-[38rem] w-full flex-col overflow-hidden border border-border bg-canvas text-canvas-fg">
		<header class="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-canvas px-3 sm:px-4">
			<DomIconButton
				class="md:hidden"
				label="Open navigation hierarchy"
				size="sm"
				:icon="menuIcon"
				@click="navigatorOpen = true"
			/>
			<div class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">N</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold tracking-tight">Navigation studio</p>
				<p class="hidden truncate text-[11px] text-muted-fg sm:block">Northstar · Primary app · Production</p>
			</div>
			<div class="hidden sm:block">
				<DomStatusPill :tone="validationTone" :label="validationLabel" size="sm" />
			</div>
			<div class="hidden md:block">
				<DomButton variant="secondary" size="sm" :loading="validating" @click="runValidation">Run checks</DomButton>
			</div>
			<DomButton size="sm" @click="openPublishDialog">Publish</DomButton>
			<div class="hidden lg:block">
				<DomProfileMenu
					name="Maya Chen"
					email="maya@northstar.tools"
					initials="MC"
					:show-email="false"
					:theme-control="false"
				/>
			</div>
		</header>

		<div v-if="errorMessage || message" class="shrink-0 border-b border-border px-3 py-2 sm:px-4">
			<DomAlert
				:tone="errorMessage ? 'danger' : 'success'"
				variant="toast"
				:title="errorMessage ? 'Navigation update failed' : 'Navigation updated'"
				:description="errorMessage || message"
				dismissible
				@dismiss="clearFeedback"
			/>
		</div>

		<div v-if="loading" class="grid min-h-0 flex-1 gap-3 p-4 md:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)_21rem]">
			<DomSkeleton class="h-full min-h-80" />
			<DomSkeleton class="h-full min-h-80" />
			<DomSkeleton class="hidden h-full min-h-80 xl:block" />
		</div>

		<main
			v-else
			class="grid min-h-0 flex-1 md:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)_21rem]"
		>
			<aside class="hidden min-h-0 border-r border-border md:block">
				<NavigationTreePanel
					:items="treeItems"
					:selected-id="selectedItemId"
					:validation="validation"
					:reordering="reordering"
					@add="openAddDialog"
					@select="selectItem"
					@reorder="persistReorder"
				/>
			</aside>

			<section class="flex min-h-0 min-w-0 flex-col bg-secondary/35">
				<div class="flex min-h-14 shrink-0 items-center gap-2 overflow-x-auto border-b border-border bg-canvas px-3 sm:px-4">
					<span class="hidden shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg lg:inline">Preview as</span>
					<DomSelect
						v-model="previewAudience"
						class="min-w-0 flex-1 sm:flex-none"
						aria-label="Preview audience"
						:options="bootstrap.previewAudienceOptions"
						width="min-w-[12rem]"
					/>
					<DomSelect
						v-model="previewDevice"
						class="min-w-0 flex-1 sm:flex-none"
						aria-label="Preview device"
						:options="bootstrap.deviceOptions"
						width="min-w-[11rem]"
					/>
					<div class="hidden min-w-2 flex-1 sm:block"></div>
					<span class="hidden shrink-0 text-xs text-muted-fg sm:inline">
						{{ preview.meta.visibleCount }} visible · {{ preview.meta.hiddenCount }} filtered
					</span>
					<div class="hidden sm:block xl:hidden">
						<DomIconButton
							label="Edit selected destination"
							size="sm"
							:icon="inspectIcon"
							@click="inspectorOpen = true"
						/>
					</div>
				</div>

				<div class="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
					<div :class="previewFrameClasses">
						<DomAppShell variant="card" class="border border-border shadow-xl shadow-black/10">
							<template #top>
								<DomAppTopBar
									title="Northstar"
									:subtitle="`${previewAudience.replace('-', ' ')} preview · ${bootstrap.workspace.domain}`"
								>
									<template v-if="previewDevice === 'mobile'" #leading>
										<DomIconButton label="Open preview navigation" size="sm" :icon="menuIcon" @click="togglePreviewNavigation" />
									</template>
									<template #trailing>
										<DomAvatar name="Ari Gupta" initials="AG" size="sm" />
									</template>
								</DomAppTopBar>
							</template>

							<div class="flex h-full min-h-0">
								<aside
									v-if="previewDevice !== 'mobile'"
									class="min-h-0 shrink-0 overflow-y-auto border-r border-border bg-canvas p-2"
									:class="previewDevice === 'compact' ? 'w-44' : 'w-56'"
								>
									<p class="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-fg">Workspace</p>
									<nav class="grid gap-0.5" aria-label="Server-filtered application preview">
										<PreviewMenuItem
											v-for="item in preview.items"
											:key="item.id"
											:item="item"
											:selected-id="selectedItemId"
											:compact="previewDevice === 'compact'"
											@select="selectItem"
										/>
									</nav>
								</aside>

								<div class="min-w-0 flex-1 overflow-y-auto bg-canvas">
									<div class="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-7">
										<DomAlert
											v-if="!selectedVisibleInPreview"
											class="mb-5"
											tone="info"
											variant="soft"
											title="Audience preview applied"
											:description="`${selectedItem?.label || 'This destination'} is hidden for this audience. Showing the first available destination instead.`"
										/>
										<div class="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
											<div>
												<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">{{ previewSelectedItem?.url || '/app' }}</p>
												<h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{{ previewSelectedItem?.label || 'Workspace overview' }}</h1>
												<p class="mt-2 max-w-xl text-sm leading-6 text-muted-fg">{{ previewSelectedItem?.description || 'Your workspace activity and next actions.' }}</p>
											</div>
											<DomButton size="sm">Create project</DomButton>
										</div>

										<div class="grid gap-6 py-6">
											<section>
												<div class="flex items-center justify-between gap-3">
													<h2 class="text-base font-semibold">Current work</h2>
													<DomButton variant="ghost" size="xs">View all</DomButton>
												</div>
												<div class="mt-3 divide-y divide-border border-y border-border">
													<div class="flex items-center gap-3 py-3">
														<DomAvatar name="Atlas rollout" initials="AR" size="sm" />
														<div class="min-w-0 flex-1">
															<p class="truncate text-sm font-medium">Atlas rollout</p>
															<p class="text-xs text-muted-fg">Design review · Today</p>
														</div>
														<DomStatusPill tone="success" label="On track" size="sm" />
													</div>
													<div class="flex items-center gap-3 py-3">
														<DomAvatar name="Beacon migration" initials="BM" size="sm" />
														<div class="min-w-0 flex-1">
															<p class="truncate text-sm font-medium">Beacon migration</p>
															<p class="text-xs text-muted-fg">Engineering · Tomorrow</p>
														</div>
														<DomStatusPill tone="warning" label="At risk" size="sm" />
													</div>
													<div class="flex items-center gap-3 py-3">
														<DomAvatar name="Comet launch" initials="CL" size="sm" />
														<div class="min-w-0 flex-1">
															<p class="truncate text-sm font-medium">Comet launch</p>
															<p class="text-xs text-muted-fg">Content · Friday</p>
														</div>
														<DomStatusPill tone="primary" label="Review" size="sm" />
													</div>
												</div>
											</section>

											<aside class="border-t border-border pt-5">
												<div class="flex items-end justify-between gap-4">
													<div>
														<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">This week</p>
														<p class="mt-2 text-3xl font-semibold tracking-tight">82%</p>
													</div>
													<p class="max-w-44 text-right text-xs leading-5 text-muted-fg">Milestones completed on time</p>
												</div>
												<div class="mt-4 grid grid-cols-3 divide-x divide-border border-y border-border py-3 text-center text-xs">
													<div><strong class="block text-base">12</strong><span class="text-muted-fg">Projects</span></div>
													<div><strong class="block text-base">4</strong><span class="text-muted-fg">Reviews</span></div>
													<div><strong class="block text-base">18</strong><span class="text-muted-fg">Online</span></div>
												</div>
											</aside>
										</div>
									</div>
								</div>
							</div>

							<template #overlay>
								<div v-if="previewDevice === 'mobile' && previewMobileNavOpen" class="pointer-events-auto absolute inset-0 flex bg-black/35">
									<aside class="flex h-full w-[82%] max-w-72 flex-col border-r border-border bg-canvas shadow-xl">
										<div class="flex items-center justify-between border-b border-border px-3 py-3">
											<div>
												<p class="text-sm font-semibold">Northstar</p>
												<p class="text-xs text-muted-fg">Workspace navigation</p>
											</div>
											<DomIconButton label="Close preview navigation" size="sm" :icon="closeIcon" @click="togglePreviewNavigation" />
										</div>
										<nav class="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Mobile application preview">
											<PreviewMenuItem
												v-for="item in preview.items"
												:key="item.id"
												:item="item"
												:selected-id="selectedItemId"
												@select="selectItem"
											/>
										</nav>
									</aside>
									<button type="button" class="min-w-0 flex-1" aria-label="Close preview navigation" @click="togglePreviewNavigation"></button>
								</div>
							</template>
						</DomAppShell>
					</div>
				</div>

				<footer class="flex min-h-13 shrink-0 items-center justify-between gap-3 border-t border-border bg-canvas px-3 xl:hidden">
					<div class="min-w-0">
						<p class="truncate text-sm font-medium">{{ selectedItem?.label }}</p>
						<p class="truncate text-xs text-muted-fg">{{ selectedIssues.length ? `${selectedIssues.length} issue${selectedIssues.length === 1 ? '' : 's'}` : 'Ready to publish' }}</p>
					</div>
					<DomButton variant="secondary" size="sm" @click="inspectorOpen = true">Edit destination</DomButton>
				</footer>
			</section>

			<aside class="hidden min-h-0 border-l border-border xl:block">
				<NavigationInspector
					v-if="editorDraft"
					v-model="editorDraft"
					:visibility-options="bootstrap.visibilityOptions"
					:audience-options="bootstrap.audienceOptions"
					:icon-options="bootstrap.iconOptions"
					:issues="selectedIssues"
					:path="selectedPath"
					:saving="saving"
					:dirty="editorDirty"
					:has-children="selectedHasChildren"
					@save="saveSelectedItem"
					@archive="openArchiveDialog"
				/>
			</aside>
		</main>

		<DomDrawer v-model="navigatorOpen" side="left" width="min(22rem, 92vw)" title="Navigation hierarchy" :static="true">
			<NavigationTreePanel
				:items="treeItems"
				:selected-id="selectedItemId"
				:validation="validation"
				:reordering="reordering"
				@add="openAddDialog"
				@select="selectItem"
				@reorder="persistReorder"
			/>
		</DomDrawer>

		<DomDrawer v-model="inspectorOpen" side="right" width="min(25rem, 94vw)" title="Destination inspector" :static="true">
			<NavigationInspector
				v-if="editorDraft"
				v-model="editorDraft"
				:visibility-options="bootstrap?.visibilityOptions || []"
				:audience-options="bootstrap?.audienceOptions || []"
				:icon-options="bootstrap?.iconOptions || []"
				:issues="selectedIssues"
				:path="selectedPath"
				:saving="saving"
				:dirty="editorDirty"
				:has-children="selectedHasChildren"
				@save="saveSelectedItem"
				@archive="openArchiveDialog"
				@floating-interaction="keepInspectorDrawerOpen"
			/>
		</DomDrawer>

		<DomDialog
			v-model="addDialogOpen"
			title="Add navigation destination"
			description="Create a real draft item, then validate it against the application router."
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<DomTextInput v-model="addDraft.label" label="Menu label" placeholder="Help center" />
				<DomTextInput v-model="addDraft.url" label="Destination" placeholder="/app/help" />
				<DomSelect
					v-model="addDraft.parentId"
					label="Parent"
					:options="parentOptions"
					width="min-w-[18rem]"
				/>
				<DomSelect
					v-model="addDraft.visibility"
					label="Visibility"
					:options="bootstrap?.visibilityOptions || []"
					width="min-w-[18rem]"
				/>
				<div class="sm:col-span-2">
					<DomTextareaInput v-model="addDraft.description" label="Internal description" :rows="3" />
				</div>
				<div class="sm:col-span-2">
					<DomIconSelector
						v-model="addDraft.icon"
						label="Navigation icon"
						kind="custom"
						:items="bootstrap?.iconOptions || []"
						:include-built-ins="false"
						:clearable="false"
					/>
				</div>
				<div v-if="addDraft.visibility === 'roles' || addDraft.visibility === 'admins'" class="sm:col-span-2">
					<DomTagCombobox
						v-model="addDraft.audience"
						label="Allowed audiences"
						:options="bootstrap?.audienceOptions || []"
					/>
				</div>
				<DomToggle v-model="addDraft.requiresAuth" label="Requires sign in" />
				<DomToggle v-model="addDraft.openInNewTab" label="Open in a new tab" />
			</div>
			<template #footer>
				<DomButton variant="secondary" size="sm" @click="addDialogOpen = false">Cancel</DomButton>
				<DomButton size="sm" :loading="saving" @click="createItem">Add destination</DomButton>
			</template>
		</DomDialog>

		<DomDialog
			v-model="archiveDialogOpen"
			title="Archive navigation item?"
			:description="`${archiveTargetLabel} will leave the draft tree and every audience preview.`"
		>
			<DomTextareaInput v-model="archiveReason" label="Archive reason" :rows="3" />
			<template #footer>
				<DomButton variant="secondary" size="sm" @click="archiveDialogOpen = false">Keep item</DomButton>
				<DomButton variant="danger" size="sm" :loading="saving" @click="archiveSelectedItem">Archive item</DomButton>
			</template>
		</DomDialog>

		<DomDialog
			v-model="publishDialogOpen"
			:title="publishReceipt ? `Version ${publishReceipt.version} is live` : 'Review navigation publish'"
			:description="publishReceipt ? 'The API returned an immutable deployment receipt.' : 'Publish the validated menu used by the production app shell.'"
		>
			<div v-if="publishReceipt" class="space-y-4">
				<DomAlert tone="success" title="Navigation published" :description="`${publishReceipt.itemCount} destinations are live in production.`" />
				<dl class="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border bg-secondary/35 p-4 text-sm">
					<div><dt class="text-xs text-muted-fg">Receipt</dt><dd class="mt-1 font-mono">{{ publishReceipt.id }}</dd></div>
					<div><dt class="text-xs text-muted-fg">Checksum</dt><dd class="mt-1 font-mono">{{ publishReceipt.checksum }}</dd></div>
					<div><dt class="text-xs text-muted-fg">Published</dt><dd class="mt-1">{{ formatTimestamp(publishReceipt.publishedAt) }}</dd></div>
					<div><dt class="text-xs text-muted-fg">Editor</dt><dd class="mt-1">{{ publishReceipt.publishedBy }}</dd></div>
				</dl>
			</div>
			<div v-else class="space-y-4">
				<DomAlert
					:tone="validation.blockerCount ? 'danger' : 'success'"
					:title="validation.blockerCount ? `${validation.blockerCount} blocker${validation.blockerCount === 1 ? '' : 's'} must be resolved` : 'All required checks passed'"
					:description="validation.blockerCount ? 'Select a marked item in the hierarchy, fix its destination, and run checks again.' : `Version ${draft?.publishedVersion + 1} can be published to ${bootstrap?.workspace.environment}.`"
				/>
				<div class="grid gap-2">
					<div v-for="check in validation.checks" :key="check.key" class="flex items-center justify-between border-b border-border py-2 text-sm">
						<span>{{ check.label }}</span>
						<DomStatusPill :tone="check.healthy ? 'success' : 'danger'" :label="check.healthy ? 'Passed' : 'Blocked'" size="sm" />
					</div>
				</div>
				<DomTextareaInput v-model="releaseNote" label="Release note" :rows="3" />
			</div>
			<template #footer>
				<DomButton variant="secondary" size="sm" @click="closePublishDialog">{{ publishReceipt ? 'Done' : 'Keep editing' }}</DomButton>
				<DomButton
					v-if="!publishReceipt"
					size="sm"
					:loading="publishing"
					:disabled="validation.blockerCount > 0"
					@click="publishDraft"
				>
					Publish version {{ draft?.publishedVersion + 1 }}
				</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
