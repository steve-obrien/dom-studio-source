<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomDialog,
	DomDrawer,
	DomFileUpload,
	DomIconButton,
	DomMediaBrowser,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTextInput,
	DomToggle,
} from '@getdom/studio/vue';
import AssetMetadataPanel from '../components/AssetMetadataPanel.vue';

const bootstrap = ref(null);
const assets = ref([]);
const assetCache = ref({});
const loading = ref(true);
const actionBusy = ref(false);
const requestError = ref('');
const actionFeedback = ref(null);
const activeCollection = ref('all');
const selectedType = ref('all');
const selectedStatus = ref('active');
const selectedSort = ref('recent');
const searchQuery = ref('');
const selectedKeys = ref([]);
const browserMode = ref('grid');
const filterOpen = ref(false);
const inspectorOpen = ref(false);
const uploadOpen = ref(false);
const previewOpen = ref(false);
const previewAsset = ref(null);
const archiveOpen = ref(false);
const archiveAsset = ref(null);
const archiveReason = ref('Replaced by the current approved library asset.');
const uploadFiles = ref([]);
const simulateUploadFailure = ref(false);
const uploadFeedback = ref(null);
const insertionReceipt = ref(null);
let searchTimer = null;
let requestSequence = 0;

const collectionOptions = computed(() => bootstrap.value?.collectionOptions || []);
const typeOptions = computed(() => bootstrap.value?.typeOptions || []);
const statusOptions = computed(() => bootstrap.value?.statusOptions || []);
const sortOptions = computed(() => bootstrap.value?.sortOptions || []);
const currentUser = computed(() => bootstrap.value?.currentUser || { name: 'Content editor', initials: 'CE' });
const mediaItems = computed(() => assets.value.map(toMediaBrowserItem));
const selectedAssets = computed(() => selectedKeys.value
	.map((id) => assetCache.value[id])
	.filter(Boolean));
const activeAsset = computed(() => {
	const lastSelected = selectedKeys.value[selectedKeys.value.length - 1];
	return assetCache.value[lastSelected] || null;
});
const selectionIssueCount = computed(() => selectedAssets.value.filter((asset) => asset.status !== 'Approved').length);
const selectionReady = computed(() => selectedAssets.value.length > 0 && selectionIssueCount.value === 0);
const activeCollectionLabel = computed(() => collectionOptions.value
	.find((option) => option.value === activeCollection.value)?.label || 'All assets');
const resultLabel = computed(() => {
	if (loading.value) return 'Refreshing assets';
	return `${assets.value.length} asset${assets.value.length === 1 ? '' : 's'}`;
});
const browserBreadcrumbs = computed(() => [{
	label: activeCollectionLabel.value,
	path: '/',
	ulid: `collection-${activeCollection.value}`,
}]);
const selectedUpload = computed(() => uploadFiles.value[0] || null);
const insertButtonLabel = computed(() => {
	if (actionBusy.value) return 'Checking selection';
	if (!selectedAssets.value.length) return 'Insert assets';
	if (selectionIssueCount.value) return `Review ${selectionIssueCount.value} issue${selectionIssueCount.value === 1 ? '' : 's'}`;
	return `Insert ${selectedAssets.value.length} asset${selectedAssets.value.length === 1 ? '' : 's'}`;
});

onMounted(initializeWorkspace);
onBeforeUnmount(clearSearchTimer);

watch([activeCollection, selectedType, selectedStatus, selectedSort], () => {
	loadAssets();
});

watch(searchQuery, () => {
	clearSearchTimer();
	searchTimer = setTimeout(loadAssets, 220);
});

/**
 * Loads the media-library contract and first server-filtered result set.
 *
 * @returns {Promise<void>} Resolves after initial data settles.
 */
async function initializeWorkspace() {
	loading.value = true;
	requestError.value = '';
	try {
		const [bootstrapPayload, assetPayload] = await Promise.all([
			requestJson('/api/block-demos/media-asset-library/bootstrap'),
			requestJson('/api/block-demos/media-asset-library/assets'),
		]);
		bootstrap.value = bootstrapPayload;
		applyAssetList(assetPayload.assets || []);
		if (!selectedKeys.value.length && assets.value.length) selectedKeys.value = [assets.value[0].id];
	} catch (error) {
		requestError.value = error.message;
	} finally {
		loading.value = false;
	}
}

/**
 * Reloads assets using the current search, collection, type, status, and sort state.
 *
 * @returns {Promise<void>} Resolves after the latest request is applied.
 */
async function loadAssets() {
	if (!bootstrap.value) return;
	const sequence = ++requestSequence;
	loading.value = true;
	requestError.value = '';
	try {
		const params = new URLSearchParams({
			collection: activeCollection.value,
			type: selectedType.value,
			status: selectedStatus.value,
			sort: selectedSort.value,
			query: searchQuery.value.trim(),
		});
		const payload = await requestJson(`/api/block-demos/media-asset-library/assets?${params}`);
		if (sequence !== requestSequence) return;
		applyAssetList(payload.assets || []);
	} catch (error) {
		if (sequence !== requestSequence) return;
		requestError.value = error.message;
	} finally {
		if (sequence === requestSequence) loading.value = false;
	}
}

/**
 * Applies a server result while retaining selected records hidden by filters.
 *
 * @param {Array<Record<string, unknown>>} rows Server asset rows.
 */
function applyAssetList(rows) {
	assets.value = rows;
	const nextCache = { ...assetCache.value };
	for (const asset of rows) nextCache[asset.id] = asset;
	assetCache.value = nextCache;
}

/**
 * Applies one mutation response to visible rows and the persistent selection cache.
 *
 * @param {Record<string, unknown>} asset Updated asset.
 */
function applyAsset(asset) {
	assetCache.value = { ...assetCache.value, [asset.id]: asset };
	assets.value = assets.value.map((row) => (row.id === asset.id ? asset : row));
}

/**
 * Adapts the API asset contract to the reusable DomMediaBrowser item contract.
 *
 * @param {Record<string, unknown>} asset API asset.
 * @returns {Record<string, unknown>} DomMediaBrowser item.
 */
function toMediaBrowserItem(asset) {
	return {
		ulid: asset.id,
		type: 'file',
		name: asset.title,
		path: `/${asset.collectionLabel}/${asset.name}`,
		parent_id: `collection-${asset.collection}`,
		file_uuid: asset.id,
		file: {
			ulid: asset.id,
			name: asset.name,
			mimeType: asset.mimeType,
			size: asset.size,
			publicUrl: asset.publicUrl,
			thumbnailUrl: asset.thumbnailUrl,
			meta: {
				alt: asset.alt,
				width: asset.width,
				height: asset.height,
			},
		},
		asset,
	};
}

/**
 * Updates the controlled selection and clears stale insertion proof.
 *
 * @param {Array<string>} keys Selected media ids.
 */
function updateSelection(keys) {
	selectedKeys.value = Array.isArray(keys) ? keys : [];
	insertionReceipt.value = null;
	actionFeedback.value = null;
}

/**
 * Opens the responsive inspector for the active selection.
 */
function openInspector() {
	if (!activeAsset.value) return;
	inspectorOpen.value = true;
}

/**
 * Reopens the metadata drawer after a teleported select completes its click cycle.
 */
function keepInspectorDrawerOpen() {
	window.setTimeout(reopenInspectorDrawer, 0);
}

/**
 * Restores the controlled metadata drawer state.
 */
function reopenInspectorDrawer() {
	inspectorOpen.value = true;
}

/**
 * Keeps the filter drawer mounted while a rich select commits its value.
 */
function keepFilterDrawerOpen() {
	window.setTimeout(reopenFilterDrawer, 0);
}

/**
 * Restores the controlled filter drawer state.
 */
function reopenFilterDrawer() {
	filterOpen.value = true;
}

/**
 * Opens a large preview from a DomMediaBrowser activation payload.
 *
 * @param {{ item?: Record<string, unknown> }} payload Browser open payload.
 */
function openPreviewFromPayload(payload) {
	const asset = payload?.item?.asset;
	if (asset) openPreview(asset);
}

/**
 * Opens a large preview for one server-backed asset.
 *
 * @param {Record<string, unknown>} asset Media asset.
 */
function openPreview(asset) {
	previewAsset.value = asset;
	previewOpen.value = true;
}

/**
 * Saves inspector metadata with optimistic revision protection.
 *
 * @param {Record<string, unknown>} metadata Editable metadata payload.
 * @returns {Promise<void>} Resolves after the mutation settles.
 */
async function saveMetadata(metadata) {
	if (!activeAsset.value) return;
	actionBusy.value = true;
	actionFeedback.value = null;
	try {
		const payload = await requestJson(`/api/block-demos/media-asset-library/assets/${activeAsset.value.id}`, {
			method: 'PATCH',
			body: metadata,
		});
		applyAsset(payload.asset);
		actionFeedback.value = {
			tone: payload.asset.status === 'Approved' ? 'success' : 'warning',
			title: payload.asset.status === 'Approved' ? 'Publishing checks passed' : 'Metadata saved',
			description: payload.message,
		};
		await refreshBootstrap();
	} catch (error) {
		if (error.currentAsset) applyAsset(error.currentAsset);
		actionFeedback.value = {
			tone: 'danger',
			title: error.status === 409 ? 'Asset changed' : 'Metadata was not saved',
			description: error.message,
		};
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Opens the archive confirmation for one active asset.
 *
 * @param {Record<string, unknown>} asset Media asset.
 */
function requestArchive(asset) {
	archiveAsset.value = asset;
	archiveReason.value = 'Replaced by the current approved library asset.';
	archiveOpen.value = true;
}

/**
 * Archives the confirmed asset and refreshes the current server query.
 *
 * @returns {Promise<void>} Resolves after the archive mutation settles.
 */
async function confirmArchive() {
	if (!archiveAsset.value) return;
	actionBusy.value = true;
	try {
		const payload = await requestJson(`/api/block-demos/media-asset-library/assets/${archiveAsset.value.id}/archive`, {
			method: 'POST',
			body: {
				revision: archiveAsset.value.revision,
				reason: archiveReason.value,
			},
		});
		applyAsset(payload.asset);
		selectedKeys.value = selectedKeys.value.filter((id) => id !== payload.asset.id);
		archiveOpen.value = false;
		inspectorOpen.value = false;
		actionFeedback.value = {
			tone: 'success',
			title: 'Asset archived',
			description: payload.message,
		};
		await Promise.all([loadAssets(), refreshBootstrap()]);
	} catch (error) {
		actionFeedback.value = {
			tone: 'danger',
			title: 'Asset was not archived',
			description: error.message,
		};
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Restores an archived asset and reloads library counts and results.
 *
 * @param {Record<string, unknown>} asset Archived asset.
 * @returns {Promise<void>} Resolves after the restore mutation settles.
 */
async function restoreAsset(asset) {
	actionBusy.value = true;
	try {
		const payload = await requestJson(`/api/block-demos/media-asset-library/assets/${asset.id}/restore`, {
			method: 'POST',
			body: { revision: asset.revision },
		});
		applyAsset(payload.asset);
		actionFeedback.value = {
			tone: 'success',
			title: 'Asset restored',
			description: payload.message,
		};
		await Promise.all([loadAssets(), refreshBootstrap()]);
	} catch (error) {
		actionFeedback.value = {
			tone: 'danger',
			title: 'Asset was not restored',
			description: error.message,
		};
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Seeds DomFileUpload with a realistic file record for the working demo journey.
 */
function useDemoUpload() {
	uploadFiles.value = [{
		name: 'q3-launch-cut.jpg',
		size: 984220,
		type: 'image/jpeg',
		mimeType: 'image/jpeg',
	}];
	uploadFeedback.value = null;
}

/**
 * Runs the server-owned upload pipeline and selects the created review asset.
 *
 * @returns {Promise<void>} Resolves after upload success or recoverable failure.
 */
async function uploadAsset() {
	if (!selectedUpload.value) return;
	actionBusy.value = true;
	uploadFeedback.value = null;
	try {
		const file = selectedUpload.value;
		const payload = await requestJson('/api/block-demos/media-asset-library/uploads', {
			method: 'POST',
			body: {
				name: file.name,
				size: file.size,
				mimeType: file.type || file.mimeType,
				simulateFailure: simulateUploadFailure.value,
			},
		});
		activeCollection.value = 'uploads';
		selectedStatus.value = 'active';
		assetCache.value = { ...assetCache.value, [payload.asset.id]: payload.asset };
		selectedKeys.value = [payload.asset.id];
		uploadOpen.value = false;
		uploadFiles.value = [];
		simulateUploadFailure.value = false;
		actionFeedback.value = {
			tone: 'success',
			title: 'Upload processed',
			description: payload.message,
		};
		await Promise.all([loadAssets(), refreshBootstrap()]);
		inspectorOpen.value = true;
	} catch (error) {
		uploadFeedback.value = {
			tone: 'danger',
			title: error.status === 503 ? 'Scanner unavailable' : 'Upload was not accepted',
			description: error.message,
		};
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Validates the selected ids on the server and records an insertion receipt.
 *
 * @returns {Promise<void>} Resolves after insertion validation settles.
 */
async function insertSelection() {
	if (!selectedAssets.value.length) return;
	actionBusy.value = true;
	actionFeedback.value = null;
	try {
		const payload = await requestJson('/api/block-demos/media-asset-library/selections', {
			method: 'POST',
			body: {
				assetIds: selectedKeys.value,
				destination: 'Homepage hero',
			},
		});
		insertionReceipt.value = payload.receipt;
		for (const asset of payload.assets || []) applyAsset(asset);
		actionFeedback.value = {
			tone: 'success',
			title: 'Assets inserted',
			description: `${payload.message} Receipt ${payload.receipt.id}.`,
		};
	} catch (error) {
		actionFeedback.value = {
			tone: 'danger',
			title: 'Selection needs review',
			description: error.details?.[0]?.message || error.message,
		};
	} finally {
		actionBusy.value = false;
	}
}

/**
 * Reloads collection counts after mutations without replacing current assets.
 *
 * @returns {Promise<void>} Resolves after bootstrap refresh.
 */
async function refreshBootstrap() {
	bootstrap.value = await requestJson('/api/block-demos/media-asset-library/bootstrap');
}

/**
 * Clears the pending debounced search request.
 */
function clearSearchTimer() {
	if (!searchTimer) return;
	clearTimeout(searchTimer);
	searchTimer = null;
}

/**
 * Performs a JSON request and raises response details as a rich Error object.
 *
 * @param {string} url API URL.
 * @param {{ method?: string, body?: Record<string, unknown> }} options Request options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		method: options.method || 'GET',
		headers: options.body ? { 'content-type': 'application/json' } : undefined,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
	const payload = await response.json();
	if (response.ok && !payload.error) return payload;
	const error = new Error(payload.error || 'The media service did not complete the request.');
	error.status = response.status;
	error.details = payload.details || [];
	error.currentAsset = payload.asset || null;
	throw error;
}

/**
 * Maps an asset status to a semantic DOM Studio status tone.
 *
 * @param {string} status Asset status.
 * @returns {string} DOM Studio tone.
 */
function statusTone(status) {
	if (status === 'Approved') return 'success';
	if (status === 'Archived') return 'neutral';
	return 'warning';
}

/**
 * Formats the selected asset count for the sticky action bar.
 *
 * @returns {string} Selection summary.
 */
function selectionSummary() {
	if (!selectedAssets.value.length) return 'Choose up to 6 assets';
	const size = selectedAssets.value.reduce((sum, asset) => sum + Number(asset.size || 0), 0);
	const sizeLabel = size >= 1024 * 1024
		? `${(size / (1024 * 1024)).toFixed(1)} MB`
		: `${Math.max(1, Math.round(size / 1024))} KB`;
	return `${selectedAssets.value.length} selected · ${sizeLabel}`;
}
</script>

<template>
	<div class="flex h-dvh min-h-[38rem] w-full min-w-0 flex-col overflow-hidden bg-secondary/20 text-canvas-fg">
		<header class="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-canvas px-3 sm:px-4">
			<div class="flex min-w-0 items-center gap-3">
				<DomIconButton
					class="lg:hidden"
					label="Open collections and filters"
					icon="M4 6h16M7 12h10M10 18h4"
					variant="secondary"
					@click="filterOpen = true"
				/>
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold">Atlas Media</p>
					<p class="truncate text-[11px] text-muted-fg">Brand workspace · Production</p>
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="hidden sm:contents">
					<DomStatusPill tone="success" size="sm">Synced</DomStatusPill>
					<DomButton size="sm" @click="uploadOpen = true">Upload asset</DomButton>
				</span>
				<span class="sm:hidden">
					<DomIconButton label="Upload asset" icon="M12 16V5M8 9l4-4 4 4M5 19h14" variant="primary" @click="uploadOpen = true" />
				</span>
				<DomAvatar :name="currentUser.name" :initials="currentUser.initials" size="sm" />
			</div>
		</header>

		<div class="grid min-h-0 flex-1 lg:grid-cols-[12.5rem_minmax(0,1fr)] xl:grid-cols-[12.5rem_minmax(0,1fr)_20rem]">
			<aside class="hidden min-h-0 border-r border-border bg-canvas lg:flex lg:flex-col">
				<div class="border-b border-border p-3">
					<DomButton class="w-full" @click="uploadOpen = true">Upload asset</DomButton>
				</div>
				<nav class="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Media collections">
					<p class="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-fg">Collections</p>
					<button
						v-for="collection in collectionOptions"
						:key="collection.value"
						type="button"
						class="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
						:class="activeCollection === collection.value ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-fg hover:bg-secondary hover:text-canvas-fg'"
						:aria-current="activeCollection === collection.value ? 'page' : undefined"
						@click="activeCollection = collection.value"
					>
						<span class="truncate">{{ collection.label }}</span>
						<span class="shrink-0 text-xs tabular-nums">{{ collection.count }}</span>
					</button>
					<button
						type="button"
						class="mt-2 flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
						:class="selectedStatus === 'archived' ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-fg hover:bg-secondary hover:text-canvas-fg'"
						@click="selectedStatus = 'archived'"
					>
						<span>Archive</span>
					</button>
				</nav>
				<div class="border-t border-border p-3 text-xs leading-5 text-muted-fg">
					<p class="font-semibold text-canvas-fg">Ingestion pipeline</p>
					<p class="mt-1">Virus scan, duplicate checks, and metadata extraction are active.</p>
				</div>
			</aside>

			<main class="flex min-h-0 min-w-0 flex-col bg-canvas">
				<div class="shrink-0 border-b border-border px-3 py-3 sm:px-4">
					<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								<h1 class="truncate text-lg font-semibold tracking-tight sm:text-xl">{{ activeCollectionLabel }}</h1>
								<DomBadge variant="outline" size="sm">{{ resultLabel }}</DomBadge>
							</div>
							<p class="mt-1 hidden text-sm text-muted-fg sm:block">Find approved media, review metadata, and insert it without leaving the editor.</p>
						</div>
						<div class="flex min-w-0 items-end gap-2">
							<DomTextInput v-model="searchQuery" class="min-w-0 flex-1 md:w-72" label="Search media" placeholder="Search names, tags, or owners" />
							<DomButton class="lg:hidden" variant="secondary" @click="filterOpen = true">Filters</DomButton>
						</div>
					</div>

					<div class="mt-3 hidden grid-cols-3 gap-2 lg:grid">
						<DomSelect v-model="selectedType" label="File type" :options="typeOptions" width="w-64">
							<template #option="{ option }">
								<span class="block">
									<span class="block font-semibold">{{ option.label }}</span>
									<span class="block text-xs opacity-75">{{ option.description }}</span>
								</span>
							</template>
						</DomSelect>
						<DomSelect v-model="selectedStatus" label="Readiness" :options="statusOptions" width="w-64">
							<template #option="{ option }">
								<span class="block">
									<span class="block font-semibold">{{ option.label }}</span>
									<span class="block text-xs opacity-75">{{ option.description }}</span>
								</span>
							</template>
						</DomSelect>
						<DomSelect v-model="selectedSort" label="Sort" :options="sortOptions" width="w-64">
							<template #option="{ option }">
								<span class="block">
									<span class="block font-semibold">{{ option.label }}</span>
									<span class="block text-xs opacity-75">{{ option.description }}</span>
								</span>
							</template>
						</DomSelect>
					</div>
				</div>

				<div v-if="requestError" class="shrink-0 border-b border-border p-3 sm:p-4">
					<DomAlert tone="danger" variant="outline" title="Media library unavailable" :description="requestError">
						<template #actions><DomButton size="sm" variant="secondary" @click="initializeWorkspace">Retry</DomButton></template>
					</DomAlert>
				</div>

				<div v-if="actionFeedback" class="shrink-0 border-b border-border p-3 xl:hidden">
					<DomAlert :tone="actionFeedback.tone" variant="outline" :title="actionFeedback.title" :description="actionFeedback.description" />
				</div>

				<div class="min-h-0 flex-1 overflow-auto bg-secondary/15">
					<div v-if="loading && !assets.length" class="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3 sm:p-4">
						<DomSkeleton v-for="index in 6" :key="index" class="aspect-[4/3]" />
					</div>
					<DomMediaBrowser
						v-else
						class="asset-browser"
						:items="mediaItems"
						:breadcrumbs="browserBreadcrumbs"
						:selected-keys="selectedKeys"
						:mode="browserMode"
						:loading="loading"
						:inspector="false"
						:can-upload="false"
						:can-create-folder="false"
						:can-rename="false"
						:can-move="false"
						:selectable-types="['file']"
						selection-mode="multiple"
						title="Media library results"
						empty-text="No assets match these filters. Try another collection or readiness state."
						@update:selected-keys="updateSelection"
						@update:mode="browserMode = $event"
						@open="openPreviewFromPayload"
					>
						<template #toolbar="{ mode, setMode }">
							<div class="flex items-center gap-1">
								<DomIconButton label="List view" icon="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" size="sm" :active="mode === 'list'" @click="setMode('list')" />
								<DomIconButton label="Grid view" icon="M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z" size="sm" :active="mode === 'grid'" @click="setMode('grid')" />
							</div>
						</template>
						<template #item="{ item }">
							<div class="relative aspect-[4/3] overflow-hidden bg-secondary">
								<img :src="item.asset.thumbnailUrl" alt="" class="size-full object-cover" loading="lazy" decoding="async" />
								<div class="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-gradient-to-b from-black/65 to-transparent p-2 text-white">
									<DomBadge size="sm" variant="solid">{{ item.asset.collectionLabel }}</DomBadge>
									<DomStatusPill :tone="statusTone(item.asset.status)" size="sm" :dot="false">{{ item.asset.status }}</DomStatusPill>
								</div>
								<p v-if="item.asset.usage" class="absolute bottom-2 right-2 rounded-md bg-black/65 px-2 py-1 text-[11px] font-medium text-white">{{ item.asset.usage }} uses</p>
							</div>
						</template>
						<template #empty>
							<div class="grid min-h-72 place-items-center p-6 text-center">
								<div class="max-w-72">
									<p class="font-semibold">No assets found</p>
									<p class="mt-2 text-sm leading-6 text-muted-fg">Try another collection, search term, file type, or readiness state.</p>
									<DomButton class="mt-4" size="sm" variant="secondary" @click="searchQuery = ''; selectedType = 'all'; selectedStatus = 'active'">Clear filters</DomButton>
								</div>
							</div>
						</template>
					</DomMediaBrowser>
				</div>

				<footer class="z-10 flex shrink-0 items-center justify-between gap-3 border-t border-border bg-canvas px-3 py-2.5 shadow-[0_-8px_24px_rgb(0_0_0/0.05)] sm:px-4">
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold">{{ selectionSummary() }}</p>
						<p class="truncate text-xs text-muted-fg">
							{{ selectionIssueCount ? `${selectionIssueCount} selected asset${selectionIssueCount === 1 ? '' : 's'} need review` : (insertionReceipt ? `Receipt ${insertionReceipt.id}` : 'Server checks run before insertion') }}
						</p>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						<DomButton class="xl:hidden" variant="secondary" :disabled="!activeAsset" @click="openInspector">Inspect</DomButton>
						<DomButton :loading="actionBusy" :disabled="!selectedAssets.length" @click="insertSelection">{{ insertButtonLabel }}</DomButton>
					</div>
				</footer>
			</main>

			<aside class="hidden min-h-0 border-l border-border bg-canvas xl:flex xl:flex-col">
				<AssetMetadataPanel
					:asset="activeAsset"
					:busy="actionBusy"
					:feedback="actionFeedback"
					@save="saveMetadata"
					@preview="openPreview"
					@request-archive="requestArchive"
					@restore="restoreAsset"
				/>
			</aside>
		</div>

		<DomDrawer v-model="filterOpen" title="Collections and filters" side="left" width="min(94vw, 24rem)" :static="true">
			<div class="space-y-5 p-1">
				<div>
					<p class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Collections</p>
					<div class="grid grid-cols-2 gap-2">
						<button
							v-for="collection in collectionOptions"
							:key="collection.value"
							type="button"
							class="rounded-md border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
							:class="activeCollection === collection.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-canvas hover:bg-secondary'"
							@click="activeCollection = collection.value"
						>
							<span class="block font-semibold">{{ collection.label }}</span>
							<span class="mt-1 block text-xs text-muted-fg">{{ collection.count }} assets</span>
						</button>
					</div>
				</div>
				<DomSelect v-model="selectedType" label="File type" :options="typeOptions" width="w-[min(calc(100vw-2rem),22rem)]" @update:model-value="keepFilterDrawerOpen" />
				<DomSelect v-model="selectedStatus" label="Readiness" :options="statusOptions" width="w-[min(calc(100vw-2rem),22rem)]" @update:model-value="keepFilterDrawerOpen" />
				<DomSelect v-model="selectedSort" label="Sort" :options="sortOptions" width="w-[min(calc(100vw-2rem),22rem)]" @update:model-value="keepFilterDrawerOpen" />
			</div>
			<template #footer>
				<div class="flex items-center justify-between gap-3">
					<span class="text-sm text-muted-fg">{{ resultLabel }}</span>
					<DomButton data-close>Show results</DomButton>
				</div>
			</template>
		</DomDrawer>

		<DomDrawer v-model="inspectorOpen" title="Asset inspector" side="right" width="min(96vw, 27rem)" :static="true">
			<AssetMetadataPanel
				:asset="activeAsset"
				:busy="actionBusy"
				:feedback="actionFeedback"
				@save="saveMetadata"
				@preview="openPreview"
				@request-archive="requestArchive"
				@restore="restoreAsset"
				@floating-interaction="keepInspectorDrawerOpen"
			/>
		</DomDrawer>

		<DomDialog v-model="uploadOpen" title="Upload a media asset" description="The demo API runs validation, a recoverable scanner state, and creates a review-ready record." width="min(94vw, 36rem)">
			<div class="space-y-4">
				<DomAlert v-if="uploadFeedback" :tone="uploadFeedback.tone" variant="outline" :title="uploadFeedback.title" :description="uploadFeedback.description">
					<template #actions>
						<DomButton v-if="simulateUploadFailure" size="sm" variant="secondary" @click="simulateUploadFailure = false">Turn off failure and retry</DomButton>
					</template>
				</DomAlert>
				<DomFileUpload
					v-model="uploadFiles"
					label="Local file"
					description="Images, MP4 video, or PDF up to 25 MB. Demo uploads persist until the server restarts."
					accept="image/*,video/mp4,.pdf"
					:multiple="false"
					:max-files="1"
					:max-size="25 * 1024 * 1024"
				/>
				<div class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-secondary/25 p-3">
					<div>
						<p class="text-sm font-semibold">Need a file for the demo?</p>
						<p class="mt-1 text-xs text-muted-fg">Load a realistic image metadata record without choosing a local file.</p>
					</div>
					<DomButton size="sm" variant="secondary" @click="useDemoUpload">Use demo file</DomButton>
				</div>
				<DomToggle
					v-model="simulateUploadFailure"
					label="Simulate scanner outage"
					description="Exercises recoverable provider failure without creating a partial asset."
				/>
			</div>
			<template #footer>
				<DomButton data-close variant="secondary">Cancel</DomButton>
				<DomButton :loading="actionBusy" :disabled="!selectedUpload" @click="uploadAsset">Upload and review</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="archiveOpen" title="Archive this asset?" description="Archived assets leave active publishing results but keep their metadata and audit history." width="min(94vw, 32rem)">
			<div class="space-y-4">
				<DomAlert v-if="archiveAsset?.usage" tone="warning" variant="outline" title="Existing placements remain" :description="`${archiveAsset.usage} current placement${archiveAsset.usage === 1 ? '' : 's'} will keep their existing file reference.`" />
				<DomTextInput v-model="archiveReason" label="Archive reason" description="Recorded in the asset activity log." />
			</div>
			<template #footer>
				<DomButton data-close variant="secondary">Cancel</DomButton>
				<DomButton variant="danger" :loading="actionBusy" @click="confirmArchive">Archive asset</DomButton>
			</template>
		</DomDialog>

		<DomDialog v-model="previewOpen" :title="previewAsset?.title || 'Asset preview'" description="Full preview with server-backed publishing metadata." width="min(96vw, 72rem)">
			<div v-if="previewAsset" class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
				<img :src="previewAsset.publicUrl" :alt="previewAsset.alt || ''" class="max-h-[68vh] w-full bg-secondary object-contain" />
				<div class="space-y-4 text-sm">
					<DomStatusPill :tone="statusTone(previewAsset.status)">{{ previewAsset.status }}</DomStatusPill>
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Alt text</p>
						<p class="mt-1 leading-6">{{ previewAsset.alt || 'No alt text supplied.' }}</p>
					</div>
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">License</p>
						<p class="mt-1">{{ previewAsset.license }}</p>
					</div>
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Used in</p>
						<p class="mt-1">{{ previewAsset.placements.length ? previewAsset.placements.join(', ') : 'No published placements' }}</p>
					</div>
				</div>
			</div>
			<template #footer><DomButton data-close>Done</DomButton></template>
		</DomDialog>
	</div>
</template>

<style scoped>
.asset-browser {
	min-height: 100%;
	border: 0;
	border-radius: 0;
	box-shadow: none;
}

.asset-browser :deep(> header) {
	background: var(--canvas);
}

.asset-browser :deep(> div) {
	min-height: 28rem;
}

@media (max-width: 639px) {
	.asset-browser :deep(> div),
	.asset-browser :deep([role='listbox']) {
		min-height: 24rem;
	}
}
</style>
