<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { storeToRefs } from 'pinia';
import * as Y from 'yjs';
import DomButton from '../../../components/button/DomButton.vue';
import DomDialog from '../../../components/dialog/DomDialog.vue';
import DomMediaBrowser from '../../media-browser/DomMediaBrowser.vue';
import DomJsonViewer from '../../../dev/json-viewer/DomJsonViewer.vue';
import DomBadge from '../../../visual/badge/DomBadge.vue';
import DomDocumentEditor from '../DomDocumentEditor.vue';
import DocumentEditorCollaborationPreview from './DocumentEditorCollaborationPreview.vue';
import { createMediaBrowserMockApi } from '../../media-browser/examples/mediaBrowserMockApi.js';
import { defineMediaBrowserStore } from '../../media-browser/examples/useMediaBrowserDemoStore.js';
import { DocumentEditorCollaborationProvider } from './documentEditorCollaborationClient.js';
import { useDocumentEditorDemoStore } from './useDocumentEditorDemoStore.js';

const documentStore = useDocumentEditorDemoStore();
const {
	content,
	title,
	revision,
	loading,
	saving,
	rewriting,
	savedAt,
	lastRequest,
	lastResponse,
} = storeToRefs(documentStore);
const useEditorMediaStore = defineMediaBrowserStore('document-editor-media-picker', {
	rootId: 'media_root_brand',
	baseUrl: '/api/media',
	filesBaseUrl: '/api/files',
	mode: 'grid',
	api: createMediaBrowserMockApi(),
});
const mediaStore = useEditorMediaStore();
const {
	items,
	breadcrumbs,
	currentPath,
	selectedKeys,
	selectedItems,
	mode,
	loading: mediaLoading,
	uploadProgress,
} = storeToRefs(mediaStore);
const editorRef = ref(null);
const editorInstance = shallowRef(null);
const mediaDialogOpen = ref(false);
const mediaRequest = shallowRef(null);
const currentEditorPayload = ref(null);
const collaborationDocument = shallowRef(null);
const collaborationProvider = shallowRef(null);
const collaboration = shallowRef(null);
const collaborationStatus = ref('connecting');
const assignedUser = ref(null);
const activeCollaborators = ref([]);
const selectedImages = computed(() => selectedItems.value.filter(isImageMediaItem));
const replacingImage = computed(() => typeof mediaRequest.value?.replaceImage === 'function');
const mediaDialogTitle = computed(() => replacingImage.value ? 'Change image' : 'Insert image');
const mediaActionLabel = computed(() => replacingImage.value ? 'Change image' : 'Insert image');
const remoteCollaborators = computed(() => activeCollaborators.value.filter((user) => user.id !== assignedUser.value?.id));
const status = computed(() => {
	if (loading.value) return 'Loading document';
	if (collaborationStatus.value !== 'connected') return 'Connecting collaborators';
	if (saving.value) return 'Saving';
	if (assignedUser.value) return `Live as ${assignedUser.value.name}`;
	if (savedAt.value) return `Saved revision ${revision.value}`;
	return 'Live demo';
});
const collaborationSummary = computed(() => {
	if (collaborationStatus.value === 'connected' && assignedUser.value) {
		const others = Math.max(0, activeCollaborators.value.length - 1);
		return others
			? `${others} other ${others === 1 ? 'person is' : 'people are'} editing this temporary document.`
			: 'You’re the only person here right now. Open another tab to edit together, or try the collaboration preview above.';
	}
	return 'Connecting to the temporary collaboration room.';
});
const aiUser = { id: 'ai-editor', name: 'AI editor', color: '#2563eb', type: 'ai' };

onMounted(loadDemo);
onBeforeUnmount(stopCollaboration);

/**
 * Loads the document and media folder used by the demo.
 *
 * @returns {Promise<void>} Resolves when initial data has loaded.
 */
async function loadDemo() {
	await Promise.all([
		documentStore.load(),
		mediaStore.loadFolder('/Images'),
	]);
	startCollaboration();
}

/**
 * Creates the browser-only Yjs document and connects it to the demo WebSocket.
 *
 * @returns {void}
 */
function startCollaboration() {
	stopCollaboration();
	const document = new Y.Doc();
	const provider = new DocumentEditorCollaborationProvider({
		document,
		connect: false,
	});
	collaborationDocument.value = document;
	collaborationProvider.value = provider;
	provider.on('status', handleCollaborationStatus);
	provider.on('user', handleAssignedUser);
	provider.on('presence', handleCollaborationPresence);
	provider.on('synced', initializeCollaborationDocument);
	provider.on('initialize', initializeCollaborationDocument);
	provider.on('reset', handleCollaborationReset);
	provider.connect();
}

/**
 * Disconnects the demo provider and releases its ephemeral Yjs document.
 *
 * @returns {void}
 */
function stopCollaboration() {
	collaborationProvider.value?.destroy();
	collaborationDocument.value?.destroy();
	collaborationProvider.value = null;
	collaborationDocument.value = null;
	collaboration.value = null;
	editorInstance.value = null;
}

/**
 * Mirrors provider connection state into the demo status label.
 *
 * @param {{ status?: string }} payload Provider status event.
 * @returns {void}
 */
function handleCollaborationStatus(payload = {}) {
	collaborationStatus.value = payload.status || 'disconnected';
}

/**
 * Applies the username assigned by the WebSocket server to the editor config.
 *
 * @param {Record<string, unknown>|null} user Assigned guest identity.
 * @returns {void}
 */
function handleAssignedUser(user) {
	assignedUser.value = user;
	if (!user || !collaborationDocument.value || !collaborationProvider.value) return;
	collaboration.value = {
		document: collaborationDocument.value,
		provider: collaborationProvider.value,
		field: 'body',
		user,
	};
	initializeCollaborationDocument();
}

/**
 * Updates the visible collaborator avatars from server presence.
 *
 * @param {{ users?: Array<Record<string, unknown>> }} payload Presence event.
 * @returns {void}
 */
function handleCollaborationPresence(payload = {}) {
	activeCollaborators.value = Array.isArray(payload.users) ? payload.users : [];
}

/**
 * Reloads the page after the server discards the temporary collaboration room.
 *
 * @returns {void}
 */
function handleCollaborationReset() {
	window.location.reload();
}

/**
 * Stores the mounted editor instance and initializes an empty collaboration room.
 *
 * @param {{ editor?: Record<string, unknown> }} payload Editor ready event.
 * @returns {void}
 */
function handleEditorReady(payload = {}) {
	editorInstance.value = payload.editor || null;
	initializeCollaborationDocument();
}

/**
 * Seeds only the first client in an empty room with the normal demo document.
 *
 * @returns {void}
 */
function initializeCollaborationDocument() {
	const provider = collaborationProvider.value;
	const document = collaborationDocument.value;
	const instance = editorInstance.value;
	if (!provider?.synced || !provider.shouldInitialize || !document || !instance || !content.value) return;
	if (document.getXmlFragment('body').length > 0) {
		provider.markInitialized();
		return;
	}
	const initialized = instance.commands?.setContent?.(content.value);
	if (initialized !== false) provider.markInitialized();
}

/**
 * Stores the latest editor payload locally and in the demo store.
 *
 * @param {{ json: Record<string, unknown>, html: string, text: string }} payload Editor change payload.
 * @returns {void}
 */
function handleEditorChange(payload) {
	currentEditorPayload.value = payload;
	documentStore.setContent(payload.json);
}

/**
 * Saves the latest editor payload through the demo API.
 *
 * @returns {Promise<void>} Resolves when saving settles.
 */
async function saveDocument() {
	const payload = currentEditorPayload.value || editorRef.value?.savePayload?.();
	if (!payload) return;
	await documentStore.save({
		content: payload.json,
		html: payload.html,
		text: payload.text,
	});
}

/**
 * Opens the media picker when the editor image tool requests media.
 *
 * @param {Record<string, unknown>} payload Media request emitted by the editor.
 * @returns {void}
 */
function openMediaPicker(payload = {}) {
	mediaRequest.value = payload;
	const mediaId = String(payload.image?.mediaId || '');

	mediaStore.setSelectedKeys(mediaId ? [mediaId] : []);
	mediaDialogOpen.value = true;
}

/**
 * Inserts the selected media item into the editor as an image.
 *
 * @returns {void}
 */
function insertSelectedImage() {
	const item = selectedImages.value[0];
	if (!item) return;
	const replaceImage = mediaRequest.value?.replaceImage;

	if (typeof replaceImage === 'function') {
		replaceImage({ item });
	} else {
		editorRef.value?.insertImage?.({ item });
	}

	mediaDialogOpen.value = false;
	mediaRequest.value = null;
}

/**
 * Navigates the media picker to a requested folder.
 *
 * @param {{ path: string }} payload Navigation payload.
 * @returns {Promise<void>} Resolves after the folder loads.
 */
function navigateMedia(payload) {
	return mediaStore.loadFolder(payload.path);
}

/**
 * Requests a mock AI rewrite and responds to the editor with the suggestion.
 *
 * @param {Record<string, unknown>} payload Rewrite request payload.
 * @returns {Promise<void>} Resolves when the suggestion is available.
 */
async function handleRewriteRequest(payload) {
	const suggestion = await documentStore.rewrite({
		selectedText: payload.selectedText,
		instruction: payload.instruction,
	});
	if (!suggestion) return;
	payload.respond?.(suggestion);
}

/**
 * Checks whether a media row can be inserted as an image.
 *
 * @param {Record<string, unknown>} item Media browser row.
 * @returns {boolean} True when the row is an image file.
 */
function isImageMediaItem(item) {
	return item?.type === 'file' && String(item.file?.mimeType || '').startsWith('image/');
}
</script>

<template>
	<div class="w-full min-w-0 space-y-4">
		<div class="flex flex-wrap items-center gap-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
			<svg class="size-6 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87" />
				<circle cx="9" cy="7" r="4" />
			</svg>
			<div class="min-w-0 flex-1 basis-56">
				<h3 class="text-sm font-semibold text-canvas-fg">Realtime collaborative editing</h3>
				<p class="mt-1 text-sm leading-6 text-muted-fg">Two views of the same sample document, with live edits, named cursors, and shared selections. Alex is a demo participant, so you can try editing together on your own.</p>
			</div>
		</div>

		<DocumentEditorCollaborationPreview />

		<div class="flex w-full min-w-0 flex-wrap items-center gap-3 rounded-lg border border-border bg-canvas p-3">
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold text-canvas-fg">{{ title }}</p>
				<p class="mt-1 text-xs leading-5 text-muted-fg">
					{{ collaborationSummary }} The room resets every 15 minutes or after its last tab disconnects.
				</p>
			</div>
			<DomBadge
				v-if="assignedUser"
				:label="assignedUser.name"
				tone="success"
				variant="soft"
				size="sm"
			/>
			<DomButton class="w-full justify-center sm:w-auto" size="sm" variant="primary" :loading="saving" @click="saveDocument">Save snapshot</DomButton>
		</div>

		<DomDocumentEditor
			v-if="content && collaboration"
			ref="editorRef"
			:model-value="content"
			:title="title"
			:status="status"
			:collaboration="collaboration"
			:collaborators="remoteCollaborators"
			:ai-user="aiUser"
			@change="handleEditorChange"
			@media-request="openMediaPicker"
			@ready="handleEditorReady"
			@rewrite-request="handleRewriteRequest"
		/>
		<div v-else class="rounded-lg border border-border bg-canvas p-6 text-sm text-muted-fg">
			Connecting the temporary document room...
		</div>

		<div class="grid gap-4 lg:grid-cols-2">
			<DomJsonViewer
				class="lg:col-span-2"
				title="document.content"
				description="Updates live from the editor change payload."
				:value="content || {}"
				:expanded-depth="2"
				:preview-lines="16"
				density="compact"
			/>
			<DomJsonViewer
				title="Last request"
				:value="lastRequest || {}"
				:expanded-depth="2"
				:preview-lines="12"
				density="compact"
			/>
			<DomJsonViewer
				title="Last response"
				:value="lastResponse || {}"
				:expanded-depth="2"
				:preview-lines="12"
				density="compact"
			/>
		</div>

		<DomDialog
			v-model="mediaDialogOpen"
			:title="mediaDialogTitle"
			description="Choose an image from the same media browser used by upload and picker workflows."
			width="min(96vw, 76rem)"
			height="min(90dvh, 48rem)"
		>
			<DomMediaBrowser
				:items="items"
				:breadcrumbs="breadcrumbs"
				:current-path="currentPath"
				:selected-keys="selectedKeys"
				:mode="mode"
				:loading="mediaLoading"
				:upload-progress="uploadProgress || null"
				:selectable-types="['file']"
				:inspector="false"
				selection-mode="single"
				title="Editor image library"
				empty-text="Drop an image here or navigate to another folder."
				@update:selected-keys="mediaStore.setSelectedKeys"
				@update:mode="mediaStore.setMode"
				@navigate="navigateMedia"
				@create-folder="mediaStore.createFolder"
				@rename="mediaStore.renameItem"
				@move="mediaStore.moveItems"
				@upload="mediaStore.uploadFiles"
				@make-folder-with-items="mediaStore.makeFolderWithItems"
			/>

			<template #footer>
				<div class="mr-auto min-w-0 text-left text-xs text-muted-fg">
					<span v-if="selectedImages.length">Selected {{ selectedImages[0].name }}</span>
					<span v-else>Select an image file to insert it into the document.</span>
				</div>
				<DomButton type="button" size="sm" variant="secondary" data-close>Cancel</DomButton>
				<DomButton type="button" size="sm" variant="primary" :disabled="!selectedImages.length" @click="insertSelectedImage">
					{{ mediaActionLabel }}
				</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
