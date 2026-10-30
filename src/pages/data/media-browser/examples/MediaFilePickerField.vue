<script setup>
import { computed, onMounted, ref, useId } from 'vue';
import { storeToRefs } from 'pinia';
import DomButton from '../../../components/button/DomButton.vue';
import DomDialog from '../../../components/dialog/DomDialog.vue';
import DomField from '../../../forms/field/DomField.vue';
import DomMediaBrowser from '../DomMediaBrowser.vue';
import { createMediaBrowserMockApi } from './mediaBrowserMockApi.js';
import { defineMediaBrowserStore } from './useMediaBrowserDemoStore.js';

const props = defineProps({
	modelValue: {
		type: [String, Array],
		default: '',
	},
	multiple: {
		type: Boolean,
		default: false,
	},
	name: {
		type: String,
		default: 'media_id',
	},
	label: {
		type: String,
		default: 'Featured media',
	},
	description: {
		type: String,
		default: 'The form stores the selected media row id while the browser stays responsible for navigation and uploads.',
	},
	initialPath: {
		type: String,
		default: '/Images',
	},
	accept: {
		type: [String, Array],
		default: '',
	},
	storeId: {
		type: String,
		default: '',
	},
	testId: {
		type: String,
		default: 'media-file-picker',
	},
});
const emit = defineEmits(['update:modelValue']);

const instanceId = useId();
const controlId = `media-file-picker-${instanceId}`;
const useMediaFilePickerStore = defineMediaBrowserStore(`media-browser-file-picker-${props.storeId || instanceId}`, {
	rootId: 'media_root_brand',
	baseUrl: '/api/media',
	filesBaseUrl: '/api/files',
	mode: 'grid',
	api: createMediaBrowserMockApi(),
});
const store = useMediaFilePickerStore();
const {
	items,
	breadcrumbs,
	currentPath,
	selectedKeys,
	selectedItems,
	mode,
	loading,
	uploadProgress,
} = storeToRefs(store);
const dialogOpen = ref(false);
const committedIds = computed(() => normalizeModelValue(props.modelValue, props.multiple));
const committedItems = computed(() => committedIds.value.map((id) => store.state.rowsById[id]).filter(Boolean));
const committedFiles = computed(() => committedItems.value.filter((item) => item?.type === 'file'));
const selectedName = computed(() => selectionName(committedItems.value, props.multiple));
const selectedFileUuid = computed(() => committedFiles.value[0]?.file_uuid || committedFiles.value[0]?.file?.ulid || '');
const selectedFileUuidList = computed(() => committedFiles.value.map((item) => item.file_uuid || item.file?.ulid).filter(Boolean));
const selectedFiles = computed(() => selectedItems.value.filter((item) => item?.type === 'file'));
const browserSelectionMode = computed(() => props.multiple ? 'multiple' : 'single');
const committedIdLabel = computed(() => committedIds.value.length ? committedIds.value.join(', ') : `No media id${props.multiple ? 's' : ''}`);

onMounted(loadInitialFolder);

/**
 * Loads the initial picker folder for the first dialog open.
 *
 * @returns {Promise<void>} Resolves when the folder request completes.
 */
function loadInitialFolder() {
	return store.loadFolder(props.initialPath);
}

/**
 * Opens the picker dialog and mirrors the committed form value into draft selection.
 */
function openPicker() {
	store.setSelectedKeys(committedIds.value);
	dialogOpen.value = true;
	if (normalizePath(currentPath.value) !== normalizePath(props.initialPath) && !committedItems.value.length) {
		store.loadFolder(props.initialPath);
	}
}

/**
 * Commits the currently selected browser file into the form value.
 */
function commitSelection() {
	const ids = selectedFiles.value.map((item) => item.ulid).filter(Boolean);
	if (!ids.length) return;
	emit('update:modelValue', props.multiple ? ids : ids[0]);
	dialogOpen.value = false;
}

/**
 * Clears the committed media id from the form control.
 */
function clearSelection() {
	store.setSelectedKeys([]);
	emit('update:modelValue', props.multiple ? [] : '');
}

/**
 * Loads the folder requested by the dialog media browser.
 *
 * @param {{ path: string }} payload Navigation payload.
 * @returns {Promise<void>} Resolves when the folder request completes.
 */
function navigatePicker(payload) {
	return store.loadFolder(payload.path);
}

/**
 * Normalizes a media path for comparisons.
 *
 * @param {string} path Media folder path.
 * @returns {string} Normalized path.
 */
function normalizePath(path) {
	const value = String(path || '/').replace(/\/+/g, '/').replace(/\/$/, '');
	return value.startsWith('/') ? value || '/' : `/${value}`;
}

/**
 * Normalizes the controlled form value into an array of media row ids.
 *
 * @param {string|Array<string>} value Controlled form value.
 * @param {boolean} multiple Whether the picker is array-valued.
 * @returns {Array<string>} Normalized media row ids.
 */
function normalizeModelValue(value, multiple) {
	if (multiple) {
		return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
	}
	return value ? [String(value)] : [];
}

/**
 * Builds the compact field label for the committed selection.
 *
 * @param {Array<Record<string, unknown>>} records Selected media records.
 * @param {boolean} multiple Whether the picker is array-valued.
 * @returns {string} Human-readable selection label.
 */
function selectionName(records, multiple) {
	if (!records.length) return multiple ? 'No files selected' : 'No file selected';
	if (!multiple || records.length === 1) return records[0]?.name || 'Selected file';
	return `${records.length} files selected`;
}
</script>

<template>
	<form class="max-w-2xl space-y-4" :data-testid="`${testId}-field`" @submit.prevent>
		<DomField :label="label" :description="description" :html-for="controlId">
			<div class="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2">
				<template v-if="multiple">
					<input
						v-for="id in committedIds"
						:key="id"
						:data-testid="`${testId}-value`"
						:name="`${name}[]`"
						type="hidden"
						:value="id"
					/>
				</template>
				<input v-else :data-testid="`${testId}-value`" :name="name" type="hidden" :value="committedIds[0] || ''" />
				<div class="min-w-0 flex-1 px-2 py-1">
					<p class="truncate text-sm font-semibold text-canvas-fg">{{ selectedName }}</p>
					<p class="mt-0.5 truncate font-mono text-xs text-muted-fg">
						{{ committedIdLabel }}
						<span v-if="!multiple && selectedFileUuid"> - file {{ selectedFileUuid }}</span>
						<span v-else-if="multiple && selectedFileUuidList.length"> - {{ selectedFileUuidList.length }} file records</span>
					</p>
				</div>
				<DomButton :id="controlId" :data-testid="`${testId}-open`" type="button" size="sm" variant="primary" @click="openPicker">
					{{ multiple ? 'Select files' : 'Select file' }}
				</DomButton>
				<DomButton type="button" size="sm" variant="secondary" :disabled="!committedIds.length" @click="clearSelection">
					Clear
				</DomButton>
			</div>
		</DomField>

		<DomDialog
			v-model="dialogOpen"
			:title="multiple ? 'Select media files' : 'Select media file'"
			description="Choose an existing file, use Upload files, or drag files into the browser."
			width="min(96vw, 76rem)"
			height="min(90dvh, 48rem)"
		>
			<DomMediaBrowser
				:items="items"
				:breadcrumbs="breadcrumbs"
				:current-path="currentPath"
				:selected-keys="selectedKeys"
				:mode="mode"
				:loading="loading"
				:upload-progress="uploadProgress || null"
				:selectable-types="['file']"
				:accept="accept"
				:inspector="false"
				:selection-mode="browserSelectionMode"
				:can-create-folder="false"
				:can-rename="false"
				:can-move="false"
				title="File picker media"
				empty-text="Drop files here or navigate to another folder."
				@update:selected-keys="store.setSelectedKeys"
				@update:mode="store.setMode"
				@navigate="navigatePicker"
				@upload="store.uploadFiles"
			/>

			<template #footer>
				<div class="mr-auto min-w-0 text-left text-xs text-muted-fg">
					<span v-if="selectedFiles.length && multiple">{{ selectedFiles.length }} files selected</span>
					<span v-else-if="selectedFiles.length">Selected {{ selectedFiles[0].name }}</span>
					<span v-else>{{ multiple ? 'Select one or more files to update the form value.' : 'Select a file to update the form value.' }}</span>
				</div>
				<DomButton type="button" size="sm" variant="secondary" data-close>
					Cancel
				</DomButton>
				<DomButton :data-testid="`${testId}-use`" type="button" size="sm" variant="primary" :disabled="!selectedFiles.length" @click="commitSelection">
					{{ multiple ? 'Use selected files' : 'Use selected file' }}
				</DomButton>
			</template>
		</DomDialog>
	</form>
</template>
