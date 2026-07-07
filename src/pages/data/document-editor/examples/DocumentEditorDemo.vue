<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import DomButton from '../../../components/button/DomButton.vue';
import DomDialog from '../../../components/dialog/DomDialog.vue';
import DomMediaBrowser from '../../media-browser/DomMediaBrowser.vue';
import DomJsonViewer from '../../../dev/json-viewer/DomJsonViewer.vue';
import DomDocumentEditor from '../DomDocumentEditor.vue';
import { createMediaBrowserMockApi } from '../../media-browser/examples/mediaBrowserMockApi.js';
import { defineMediaBrowserStore } from '../../media-browser/examples/useMediaBrowserDemoStore.js';
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
const mediaDialogOpen = ref(false);
const currentEditorPayload = ref(null);
const selectedImages = computed(() => selectedItems.value.filter(isImageMediaItem));
const status = computed(() => {
	if (loading.value) return 'Loading document';
	if (saving.value) return 'Saving';
	if (savedAt.value) return `Saved revision ${revision.value}`;
	return 'Draft';
});
const collaborators = [
	{ id: 'author-mia', name: 'Mia', color: '#0f766e', type: 'human' },
	{ id: 'ai-editor', name: 'AI', color: '#2563eb', type: 'ai' },
];

onMounted(loadDemo);

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
 * @returns {void}
 */
function openMediaPicker() {
	mediaStore.setSelectedKeys([]);
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
	editorRef.value?.insertImage?.({ item });
	mediaDialogOpen.value = false;
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
		<div class="flex w-full min-w-0 flex-wrap items-center gap-3 rounded-lg border border-border bg-canvas p-3">
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold text-canvas-fg">{{ title }}</p>
				<p class="mt-1 truncate text-xs text-muted-fg">
					Draft copy for the July product launch.
				</p>
			</div>
			<DomButton class="w-full justify-center sm:w-auto" size="sm" variant="primary" :loading="saving" @click="saveDocument">Save snapshot</DomButton>
		</div>

		<DomDocumentEditor
			v-if="content"
			ref="editorRef"
			:model-value="content"
			:title="title"
			:status="status"
			:collaborators="collaborators"
			:ai-user="collaborators[1]"
			autofocus
			@change="handleEditorChange"
			@media-request="openMediaPicker"
			@rewrite-request="handleRewriteRequest"
		/>
		<div v-else class="rounded-lg border border-border bg-canvas p-6 text-sm text-muted-fg">
			Loading document...
		</div>

		<div class="grid gap-4 lg:grid-cols-2">
			<DomJsonViewer
				label="Last request"
				:value="lastRequest || {}"
				:default-depth="2"
				:max-lines="12"
			/>
			<DomJsonViewer
				label="Last response"
				:value="lastResponse || {}"
				:default-depth="2"
				:max-lines="12"
			/>
		</div>

		<DomDialog
			v-model="mediaDialogOpen"
			title="Insert image"
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
					Insert image
				</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
