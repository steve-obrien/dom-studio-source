<script>
/**
 * @typedef {object} MediaBrowserFileRecord
 * @property {string} ulid Stable file row id.
 * @property {string} name Display filename.
 * @property {string} mimeType Browser or server MIME type.
 * @property {string} [diskPath] Storage adapter path.
 * @property {number} [size] File size in bytes.
 * @property {string} [publicUrl] Public URL when the file is externally readable.
 * @property {string} [thumbnailUrl] Thumbnail URL for previewable media.
 * @property {string} [previewUrl] Temporary browser preview URL while a file is uploading.
 * @property {Record<string, unknown>} [meta] Extra file metadata such as dimensions, alt text, or duration.
 */

/**
 * @typedef {object} MediaBrowserItem
 * @property {string} ulid Stable media row id.
 * @property {'root'|'dir'|'file'} type Media row type.
 * @property {string} path Slash-prefixed path within the active root.
 * @property {string|null} [parent_id] Parent media row id.
 * @property {string|null} [file_uuid] File row id for file media rows.
 * @property {string} [name] Optional display name override.
 * @property {MediaBrowserFileRecord} [file] Joined file row when type is file.
 * @property {'idle'|'saving'|'uploading'|'complete'|'error'} [status] Optimistic sync or upload status.
 * @property {number} [uploadProgress] Upload percentage from 0 to 100.
 * @property {string} [temporaryId] Client id used before the server confirms a permanent row.
 * @property {Record<string, unknown>} [meta] Media-row metadata.
 */

/**
 * @typedef {object} MediaBrowserBreadcrumb
 * @property {string} label Text rendered in the breadcrumb button.
 * @property {string} path Slash-prefixed folder path.
 * @property {string|null} [ulid] Folder media row id when known.
 */

/**
 * @typedef {object} MediaBrowserDroppedFile
 * @property {File} file Browser File object.
 * @property {string} name File name.
 * @property {string} relativePath Path relative to the dropped folder, when available.
 * @property {Array<string>} pathSegments Relative path split into folder and file segments.
 */

/**
 * @typedef {object} MediaBrowserItemPayload
 * @property {MediaBrowserItem} item Item associated with the event.
 * @property {MouseEvent|KeyboardEvent|DragEvent} event Native event.
 */

/**
 * @typedef {object} MediaBrowserSelectionPayload
 * @property {Array<string>} selectedKeys Selected media row ids.
 * @property {Array<MediaBrowserItem>} selectedItems Selected media rows.
 */

/**
 * @typedef {object} MediaBrowserMovePayload
 * @property {Array<MediaBrowserItem>} items Media rows being moved.
 * @property {MediaBrowserItem} target Folder receiving the rows.
 * @property {DragEvent} event Native drop event.
 */

/**
 * @typedef {object} MediaBrowserUploadPayload
 * @property {Array<MediaBrowserDroppedFile>} files Browser files selected through the upload button or dropped onto the browser.
 * @property {MediaBrowserItem|null} target Folder that received the drop, or null for the current folder.
 * @property {string} path Current folder path.
 * @property {Event} event Native file input or drop event.
 */

/**
 * @typedef {object} MediaBrowserDetailPayload
 * @property {MediaBrowserItem} item Media row opened in detail mode.
 * @property {'folder'|'image'|'pdf'|'default'} kind Resolved renderer kind.
 * @property {'dialog'|'inline'} mode Detail placement.
 * @property {MouseEvent|KeyboardEvent|null} event Native activation event when available.
 */

export const mediaBrowserProps = {
	items: {
		type: Array,
		default: () => [],
		_edit: { description: 'Media rows for the current folder. Rows usually come from the Pinia store after a folder API request.' },
	},
	breadcrumbs: {
		type: Array,
		default: () => [],
		_edit: { description: 'Clickable folder path segments. When omitted, the component derives labels from currentPath.' },
	},
	currentPath: {
		type: String,
		default: '/',
		_edit: { description: 'Slash-prefixed folder path currently being rendered.' },
	},
	selectedKeys: {
		type: Array,
		default: () => [],
		_edit: { description: 'Controlled media row ids selected in the browser.' },
	},
	mode: {
		type: String,
		default: 'grid',
		validator: (value) => ['grid', 'list'].includes(value),
		_edit: { options: ['grid', 'list'], description: 'Visual display mode.' },
	},
	loading: {
		type: Boolean,
		default: false,
		_edit: { description: 'Show the current folder as loading while the store waits for the API.' },
	},
	toolbar: {
		type: Boolean,
		default: true,
		_edit: { description: 'Render the built-in breadcrumb and action toolbar.' },
	},
	title: {
		type: String,
		default: 'Media browser',
		_edit: { description: 'Accessible title for the browser surface.' },
	},
	emptyText: {
		type: String,
		default: 'Drop files here or create a folder to start this library.',
		_edit: { description: 'Message shown when the current folder has no media rows.' },
	},
	inspector: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show an inspector panel for the active selection.' },
	},
	canUpload: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the upload affordance, allow files to be selected, and accept external file or folder drops.' },
	},
	canCreateFolder: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show create-folder actions and emit create-folder events.' },
	},
	canRename: {
		type: Boolean,
		default: true,
		_edit: { description: 'Allow selected rows to enter inline rename mode.' },
	},
	canMove: {
		type: Boolean,
		default: true,
		_edit: { description: 'Allow internal rows to be dragged onto folders.' },
	},
	rubberBand: {
		type: Boolean,
		default: true,
		_edit: { description: 'Allow click-drag rectangle selection across visible rows.' },
	},
	selectionMode: {
		type: String,
		default: 'multiple',
		validator: (value) => ['single', 'multiple'].includes(value),
		_edit: { options: ['single', 'multiple'], description: 'Selection behavior for picker and library workflows.' },
	},
	selectableTypes: {
		type: Array,
		default: () => ['dir', 'file'],
		_edit: { description: 'Media row types that can be selected. Use ["file"] with accept="image/*" for an image picker.' },
	},
	accept: {
		type: [String, Array],
		default: '',
		_edit: { description: 'Accepted file MIME patterns or extensions for file selection, such as image/* or .pdf.' },
	},
	itemComponents: {
		type: Object,
		default: () => ({}),
		_edit: { description: 'Component map keyed by folder, image, pdf, or default for custom item renderers.' },
	},
	inspectorComponents: {
		type: Object,
		default: () => ({}),
		_edit: { description: 'Component map keyed by folder, image, pdf, or default for custom inspector renderers.' },
	},
	detailComponents: {
		type: Object,
		default: () => ({}),
		_edit: { description: 'Component map keyed by folder, image, pdf, or default. Values may be a component or { component, mode }.' },
	},
	detailMode: {
		type: String,
		default: 'dialog',
		validator: (value) => ['dialog', 'inline'].includes(value),
		_edit: { options: ['dialog', 'inline'], description: 'Default placement when a detail component does not define its own mode.' },
	},
	renameDelay: {
		type: Number,
		default: 260,
		_edit: { description: 'Delay in milliseconds before a selected filename click enters rename mode, leaving double-click open intact.' },
	},
	uploadProgress: {
		type: Number,
		default: null,
		_edit: { description: 'Overall upload progress. When omitted, progress is inferred from uploading rows.' },
	},
};
</script>

<script setup>
import { computed, markRaw, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import DomButton from '../../components/button/DomButton.vue';
import DomContextMenu from '../../components/context-menu/DomContextMenu.vue';
import DomDialog from '../../components/dialog/DomDialog.vue';
import DomEmptyState from '../../visual/empty-state/DomEmptyState.vue';
import DomProgress from '../../visual/progress/DomProgress.vue';
import DomRadialProgress from '../../visual/progress/DomRadialProgress.vue';
import DomSkeleton from '../../visual/skeleton/DomSkeleton.vue';
import DomToggleButtonGroup from '../../forms/toggle-button-group/DomToggleButtonGroup.vue';

defineOptions({
	__doc: {
		name: 'Media browser',
		tag: '<DomMediaBrowser>',
		description: 'A folder-aware media library surface for server-backed files, optimistic Pinia stores, custom file renderers, drag and drop, upload progress, and picker workflows.',
		icon: 'M4 7h6l2 2h8v9H4V7Zm3 6h10M8 16h4',
		events: [
			{ name: 'update:selectedKeys', payload: 'Array<string>', description: 'Fired when the user changes the selected media rows.' },
			{ name: 'update:mode', payload: '\'grid\' | \'list\'', description: 'Fired when the user switches between grid and list layout.' },
			{ name: 'selection-change', payload: 'MediaBrowserSelectionPayload', typeRef: 'MediaBrowserSelectionPayload', description: 'Fired with selected keys and resolved rows.' },
			{ name: 'navigate', payload: '({ path, item, breadcrumb, event })', description: 'Fired when the user opens a folder or breadcrumb.' },
			{ name: 'create-folder', payload: '({ path })', description: 'Fired when the built-in new-folder action is activated.' },
			{ name: 'rename', payload: '({ item, name })', description: 'Fired after inline rename is committed.' },
			{ name: 'move', payload: 'MediaBrowserMovePayload', typeRef: 'MediaBrowserMovePayload', description: 'Fired when one or more selected rows are dropped onto a folder.' },
			{ name: 'upload', payload: 'MediaBrowserUploadPayload', typeRef: 'MediaBrowserUploadPayload', description: 'Fired when files are selected through the upload button or files and folders are dropped onto the current browser or a folder.' },
			{ name: 'metadata-update', payload: '({ item, meta })', description: 'Fired when the default inspector commits editable metadata such as image alt text.' },
			{ name: 'make-folder-with-items', payload: '({ items, path })', description: 'Fired from the context menu when the selection should be grouped into a new folder.' },
			{ name: 'context-action', payload: '({ action, items, path })', description: 'Fired for context menu actions after built-in handling.' },
			{ name: 'detail-open', payload: 'MediaBrowserDetailPayload', typeRef: 'MediaBrowserDetailPayload', description: 'Fired when a row with a detail component opens in dialog or inline mode.' },
			{ name: 'detail-close', payload: 'MediaBrowserDetailPayload', typeRef: 'MediaBrowserDetailPayload', description: 'Fired when the current detail component closes.' },
			{ name: 'open', payload: 'MediaBrowserItemPayload', typeRef: 'MediaBrowserItemPayload', description: 'Fired when a non-folder row is opened.' },
			{ name: 'item-click', payload: 'MediaBrowserItemPayload', typeRef: 'MediaBrowserItemPayload', description: 'Fired before selection handling when a visible row is clicked.' },
		],
		slots: [
			{ name: 'toolbar', payload: '{ selectedItems, selectedKeys, mode, currentPath, setMode, viewModeOptions }', description: 'Replace or extend the toolbar for detached picker controls.' },
			{ name: 'item', payload: '{ item, kind, selected, disabled, mode, rename }', description: 'Replace the full item body.' },
			{ name: 'inspector', payload: '{ item, kind, file, selectedItems }', description: 'Replace the inspector panel body.' },
			{ name: 'detail', payload: '{ item, kind, file, mode, close }', description: 'Replace a detail component body for dialog or inline rendering.' },
			{ name: 'empty', description: 'Custom empty-folder state.' },
		],
		keyboard: [
			{ keys: 'Enter on folder', action: 'Navigate into the folder.' },
			{ keys: 'Enter / Space on file', action: 'Select the file.' },
			{ keys: 'F2 on selected row', action: 'Start inline rename.' },
			{ keys: 'Enter in rename input', action: 'Commit the rename.' },
			{ keys: 'Esc in rename input', action: 'Cancel the rename.' },
		],
	},
});

const props = defineProps(mediaBrowserProps);
const emit = defineEmits([
	'update:selectedKeys',
	'update:mode',
	'selection-change',
	'navigate',
	'create-folder',
	'rename',
	'move',
	'upload',
	'metadata-update',
	'make-folder-with-items',
	'context-action',
	'detail-open',
	'detail-close',
	'open',
	'item-click',
]);

const titleId = `dom-media-browser-${useId()}`;
const viewport = ref(null);
const uploadInput = ref(null);
const renamingKey = ref('');
const renameDraft = ref('');
const dragTargetKey = ref('');
const breadcrumbDropPath = ref('');
const dropTargetMode = ref('');
const draggingKeys = ref([]);
const externalDropActive = ref(false);
const bandSelection = ref(null);
const inspectorDraft = ref({});
const inlineDetailKey = ref('');
const dialogDetailKey = ref('');
const detailDialogOpen = ref(false);
const dragDataType = 'application/x-dom-media-browser-items';
const viewModeOptions = [
	{
		label: 'List',
		value: 'list',
		tooltip: 'List view',
		ariaLabel: 'List view',
		icon: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
	},
	{
		label: 'Grid',
		value: 'grid',
		tooltip: 'Grid view',
		ariaLabel: 'Grid view',
		icon: 'M7 7h4v4H7V7Zm6 0h4v4h-4V7ZM7 13h4v4H7v-4Zm6 0h4v4h-4v-4Z',
	},
];
const folderIconPaths = {
	back: 'M8 22c0-4.4 3.6-8 8-8h21.6c3.3 0 5.2 1.1 7.6 3.6l5 5.2H80c4.4 0 8 3.6 8 8v4H8V22Z',
	front: 'M7.3 33.2c-.7-5 3.2-9.2 8.2-9.2H37c3.2 0 4.9 1.1 7.1 3.3l3.4 3.4c1.8 1.8 3.5 2.7 6.1 2.7h27c5.2 0 9.1 4.7 8.1 9.8l-5 25.8c-.8 3.9-4.2 6.8-8.2 6.8H20.7c-4.1 0-7.6-3-8.2-7.1L7.3 33.2Z',
	shadow: 'M22 75c13.2 4 40.7 4 54 0',
};
let renameClickTimer = null;
let previousUserSelect = '';

const sourceItems = computed(() => Array.isArray(props.items) ? props.items : []);
const selectedKeySet = computed(() => new Set(props.selectedKeys.map(String)));
const selectedItems = computed(() => sourceItems.value.filter((item) => selectedKeySet.value.has(itemKey(item))));
const draggingKeySet = computed(() => new Set(draggingKeys.value.map(String)));
const draggingCount = computed(() => draggingKeys.value.length);
const activeItem = computed(() => selectedItems.value[0] || null);
const currentPath = computed(() => normalizeFolderPath(props.currentPath));
const resolvedBreadcrumbs = computed(getResolvedBreadcrumbs);
const renderMode = computed(() => props.mode === 'list' ? 'list' : 'grid');
const uploadingItems = computed(() => sourceItems.value.filter((item) => isUploading(item)));
const inferredUploadProgress = computed(() => averageProgress(uploadingItems.value));
const overallUploadProgress = computed(() => {
	const value = Number(props.uploadProgress);
	return Number.isFinite(value) ? clampProgress(value) : inferredUploadProgress.value;
});
const hasUploadProgress = computed(() => uploadingItems.value.length > 0 || overallUploadProgress.value > 0);
const showEmptyLoading = computed(() => props.loading && sourceItems.value.length === 0);
const loadingLabel = computed(() => (sourceItems.value.length ? 'Refreshing folder' : 'Loading folder'));
const inlineDetailItem = computed(() => findItemByKey(inlineDetailKey.value));
const inlineDetailConfig = computed(() => detailConfigFor(inlineDetailItem.value));
const dialogDetailItem = computed(() => findItemByKey(dialogDetailKey.value));
const dialogDetailConfig = computed(() => detailConfigFor(dialogDetailItem.value));
const dialogDetailTitle = computed(() => detailTitle(dialogDetailItem.value, dialogDetailConfig.value));
const uploadAccept = computed(() => Array.isArray(props.accept) ? props.accept.join(',') : props.accept);
const hasContextMenuActions = computed(() => props.canCreateFolder || props.canRename);
const selectionSummary = computed(() => {
	const count = selectedItems.value.length;
	if (!count) return 'No items selected';
	if (count === 1) return `${itemName(selectedItems.value[0])} selected`;
	return `${count} items selected`;
});
const contextMenuItems = computed(() => {
	const items = [];

	if (props.canCreateFolder) {
		items.push({ label: 'New folder', value: 'new-folder' });
	}

	if (props.canRename) {
		items.push({ label: 'Rename', value: 'rename', disabled: selectedItems.value.length !== 1 });
	}

	if (props.canCreateFolder) {
		items.push({ label: 'Make new folder with items...', value: 'folder-from-selection', disabled: selectedItems.value.length === 0 });
	}

	if (items.length) items.push({ separator: true });

	items.push(
		{ label: 'Grid view', value: 'mode-grid', type: 'radio', checked: renderMode.value === 'grid' },
		{ label: 'List view', value: 'mode-list', type: 'radio', checked: renderMode.value === 'list' },
	);

	return items;
});

watch(activeItem, (item) => {
	inspectorDraft.value = {
		alt: imageAltText(item),
	};
}, { immediate: true });

watch(currentPath, clearInlineDetail);

onBeforeUnmount(() => {
	clearRenameTimer();
	removeBandListeners();
});

/**
 * Resolves breadcrumbs and appends the active inline detail item when present.
 *
 * @returns {Array<MediaBrowserBreadcrumb>} Breadcrumbs rendered in the toolbar.
 */
function getResolvedBreadcrumbs() {
	const breadcrumbs = normalizeBreadcrumbs(props.breadcrumbs, currentPath.value);
	if (!inlineDetailItem.value) return breadcrumbs;
	return [
		...breadcrumbs,
		{
			label: itemName(inlineDetailItem.value),
			path: inlineDetailPath(inlineDetailItem.value),
			ulid: itemKey(inlineDetailItem.value),
			detail: true,
		},
	];
}

/**
 * Finds a visible item by its stable key.
 *
 * @param {string} key Media row key.
 * @returns {MediaBrowserItem|null} Matching visible item.
 */
function findItemByKey(key) {
	if (!key) return null;
	return sourceItems.value.find((item) => itemKey(item) === String(key)) || null;
}

/**
 * Returns a stable string key for a media row.
 *
 * @param {MediaBrowserItem} item Media row to identify.
 * @returns {string} Stable key used for selection, dragging, and DOM attributes.
 */
function itemKey(item) {
	return String(item?.ulid ?? item?.temporaryId ?? '');
}

/**
 * Resolves the display name for a media row.
 *
 * @param {MediaBrowserItem} item Media row to label.
 * @returns {string} Human-readable name.
 */
function itemName(item) {
	if (!item) return '';
	return item.name || item.file?.name || pathBasename(item.path) || (item.type === 'root' ? 'Root' : 'Untitled');
}

/**
 * Returns the file record associated with a media row.
 *
 * @param {MediaBrowserItem} item Media row that may join a file record.
 * @returns {MediaBrowserFileRecord|null} Joined file row or null.
 */
function itemFile(item) {
	return item?.file && typeof item.file === 'object' ? item.file : null;
}

/**
 * Resolves the MIME type for a media row.
 *
 * @param {MediaBrowserItem} item Media row that may be backed by a file.
 * @returns {string} MIME type or an empty string.
 */
function itemMime(item) {
	return String(itemFile(item)?.mimeType || item?.mimeType || item?.mime_type || '').toLowerCase();
}

/**
 * Resolves the item renderer bucket for built-in and custom components.
 *
 * @param {MediaBrowserItem} item Media row to classify.
 * @returns {'folder'|'image'|'pdf'|'default'} Renderer bucket.
 */
function itemKind(item) {
	if (item?.type === 'root' || item?.type === 'dir') return 'folder';
	const mime = itemMime(item);
	if (mime.startsWith('image/')) return 'image';
	if (mime === 'application/pdf' || mime.endsWith('/pdf')) return 'pdf';
	return 'default';
}

/**
 * Resolves a custom item component for a media row.
 *
 * @param {MediaBrowserItem} item Media row to render.
 * @returns {unknown} Vue component or null.
 */
function itemComponentFor(item) {
	const components = props.itemComponents || {};
	const component = components[itemKind(item)] || components.default || null;
	return component ? markRaw(component) : null;
}

/**
 * Resolves a custom inspector component for a media row.
 *
 * @param {MediaBrowserItem} item Media row to inspect.
 * @returns {unknown} Vue component or null.
 */
function inspectorComponentFor(item) {
	const components = props.inspectorComponents || {};
	const component = components[itemKind(item)] || components.default || null;
	return component ? markRaw(component) : null;
}

/**
 * Resolves a detail component config for a media row.
 *
 * @param {MediaBrowserItem} item Media row to open.
 * @returns {Record<string, unknown>|null} Detail config or null.
 */
function detailConfigFor(item) {
	if (!item || itemKind(item) === 'folder') return null;
	const components = props.detailComponents || {};
	const entry = components[itemKind(item)] || components.default || null;
	if (!entry) return null;
	if (isDetailConfig(entry)) {
		const component = entry.component || null;
		return {
			...entry,
			component: rawComponent(component),
			mode: normalizeDetailMode(entry.mode || props.detailMode),
		};
	}
	return {
		component: rawComponent(entry),
		mode: normalizeDetailMode(props.detailMode),
	};
}

/**
 * Marks object-based Vue components as raw while leaving string component names alone.
 *
 * @param {unknown} component Detail component candidate.
 * @returns {unknown} Component value suitable for Vue's dynamic component.
 */
function rawComponent(component) {
	return component && typeof component === 'object' ? markRaw(component) : component;
}

/**
 * Checks whether a detail map entry is a config object rather than a component.
 *
 * @param {unknown} value Detail map value.
 * @returns {boolean} True when the value looks like a detail config.
 */
function isDetailConfig(value) {
	return Boolean(
		value
		&& typeof value === 'object'
		&& (
			hasOwn(value, 'component')
			|| hasOwn(value, 'mode')
			|| hasOwn(value, 'title')
			|| hasOwn(value, 'size')
			|| hasOwn(value, 'width')
			|| hasOwn(value, 'height')
		),
	);
}

/**
 * Checks whether an object owns a key.
 *
 * @param {object} value Object to inspect.
 * @param {string} key Property key.
 * @returns {boolean} True when the object owns the key.
 */
function hasOwn(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key);
}

/**
 * Normalizes a detail placement value.
 *
 * @param {unknown} mode Configured detail mode.
 * @returns {'dialog'|'inline'} Supported detail mode.
 */
function normalizeDetailMode(mode) {
	return mode === 'inline' ? 'inline' : 'dialog';
}

/**
 * Resolves the title for the dialog detail surface.
 *
 * @param {MediaBrowserItem|null} item Detail item.
 * @param {Record<string, unknown>|null} config Detail config.
 * @returns {string} Dialog title.
 */
function detailTitle(item, config) {
	if (!item) return '';
	if (typeof config?.title === 'function') return String(config.title(item) || '');
	if (typeof config?.title === 'string') return config.title;
	return itemName(item);
}

/**
 * Builds a breadcrumb-safe pseudo path for an inline detail item.
 *
 * @param {MediaBrowserItem} item Detail item.
 * @returns {string} Detail path marker.
 */
function inlineDetailPath(item) {
	return `${currentPath.value}#${encodeURIComponent(itemKey(item))}`;
}

/**
 * Checks whether the row is currently uploading.
 *
 * @param {MediaBrowserItem} item Media row to inspect.
 * @returns {boolean} True when the row reports upload progress.
 */
function isUploading(item) {
	return item?.status === 'uploading' || (Number(item?.uploadProgress) > 0 && Number(item?.uploadProgress) < 100);
}

/**
 * Clamps a progress value into the browser's accepted percentage range.
 *
 * @param {number} value Raw progress value.
 * @returns {number} Percentage from 0 to 100.
 */
function clampProgress(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return 0;
	return Math.min(100, Math.max(0, Math.round(number)));
}

/**
 * Averages progress from visible uploading rows.
 *
 * @param {Array<MediaBrowserItem>} items Uploading rows.
 * @returns {number} Average progress percentage.
 */
function averageProgress(items) {
	if (!items.length) return 0;
	const total = items.reduce((sum, item) => sum + clampProgress(item.uploadProgress), 0);
	return Math.round(total / items.length);
}

/**
 * Normalizes a folder path to the slash-prefixed path contract.
 *
 * @param {string} value Path-like value.
 * @returns {string} Slash-prefixed folder path.
 */
function normalizeFolderPath(value) {
	const raw = String(value || '/').trim();
	const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
	return prefixed.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

/**
 * Normalizes supplied breadcrumbs or derives them from the current path.
 *
 * @param {Array<MediaBrowserBreadcrumb>} breadcrumbs User-supplied breadcrumbs.
 * @param {string} path Current folder path.
 * @returns {Array<MediaBrowserBreadcrumb>} Breadcrumb records.
 */
function normalizeBreadcrumbs(breadcrumbs, path) {
	if (Array.isArray(breadcrumbs) && breadcrumbs.length) {
		return breadcrumbs.map((crumb, index) => ({
			label: crumb.label || (index === 0 ? 'Root' : pathBasename(crumb.path)),
			path: normalizeFolderPath(crumb.path),
			ulid: crumb.ulid || null,
		}));
	}

	const segments = normalizeFolderPath(path).split('/').filter(Boolean);
	const crumbs = [{ label: 'Root', path: '/', ulid: null }];
	let cursor = '';
	for (const segment of segments) {
		cursor = `${cursor}/${segment}`;
		crumbs.push({
			label: decodePathSegment(segment),
			path: cursor,
			ulid: null,
		});
	}
	return crumbs;
}

/**
 * Returns the final path segment for a media path.
 *
 * @param {string} path Path-like value.
 * @returns {string} Final path segment.
 */
function pathBasename(path) {
	const segments = String(path || '').split('/').filter(Boolean);
	return decodePathSegment(segments[segments.length - 1] || '');
}

/**
 * Decodes a route-safe path segment for display.
 *
 * @param {string} segment Encoded path segment.
 * @returns {string} Display segment.
 */
function decodePathSegment(segment) {
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
}

/**
 * Updates the controlled selection and emits the derived payload.
 *
 * @param {Array<string>} keys Next selected row ids.
 */
function updateSelection(keys) {
	const cleanKeys = uniqueStrings(keys).filter((key) => sourceItems.value.some((item) => itemKey(item) === key));
	emit('update:selectedKeys', cleanKeys);
	emit('selection-change', {
		selectedKeys: cleanKeys,
		selectedItems: sourceItems.value.filter((item) => cleanKeys.includes(itemKey(item))),
	});
}

/**
 * Converts values into unique stable string ids.
 *
 * @param {Array<unknown>} values Candidate key values.
 * @returns {Array<string>} Unique string ids.
 */
function uniqueStrings(values) {
	return [...new Set(values.map((value) => String(value || '')).filter(Boolean))];
}

/**
 * Checks whether the item can be selected for the current picker contract.
 *
 * @param {MediaBrowserItem} item Media row to test.
 * @returns {boolean} True when the item can be selected.
 */
function isSelectable(item) {
	if (!item || !props.selectableTypes.map(String).includes(String(item.type))) return false;
	if (item.type !== 'file') return true;
	return acceptsFile(item);
}

/**
 * Tests a file row against the accept prop.
 *
 * @param {MediaBrowserItem} item Media row to test.
 * @returns {boolean} True when the row matches the accepted file filter.
 */
function acceptsFile(item) {
	const acceptRules = normalizeAcceptRules(props.accept);
	if (!acceptRules.length) return true;
	const name = itemName(item).toLowerCase();
	const mime = itemMime(item);
	return acceptRules.some((rule) => {
		if (rule.endsWith('/*')) return mime.startsWith(rule.slice(0, -1));
		if (rule.startsWith('.')) return name.endsWith(rule);
		return mime === rule;
	});
}

/**
 * Normalizes MIME and extension accept rules.
 *
 * @param {string|Array<string>} accept Accepted rules.
 * @returns {Array<string>} Lowercase accept rules.
 */
function normalizeAcceptRules(accept) {
	const values = Array.isArray(accept) ? accept : String(accept || '').split(',');
	return values.map((value) => String(value).trim().toLowerCase()).filter(Boolean);
}

/**
 * Handles click selection on a visible row.
 *
 * @param {MediaBrowserItem} item Clicked media row.
 * @param {MouseEvent} event Native click event.
 */
function selectItem(item, event) {
	clearInlineDetail();
	emit('item-click', { item, event });
	if (!isSelectable(item)) return;

	const key = itemKey(item);
	if (props.selectionMode === 'single') {
		updateSelection([key]);
		return;
	}

	if (event.metaKey || event.ctrlKey) {
		const next = selectedKeySet.value.has(key)
			? props.selectedKeys.filter((value) => String(value) !== key)
			: [...props.selectedKeys, key];
		updateSelection(next);
		return;
	}

	if (event.shiftKey && selectedItems.value.length) {
		updateSelection(rangeSelection(key));
		return;
	}

	updateSelection([key]);
}

/**
 * Selects an item before a context menu opens when it is not already selected.
 *
 * @param {MediaBrowserItem} item Media row under the context pointer.
 */
function selectForContext(item) {
	if (!hasContextMenuActions.value) return;
	if (selectedKeySet.value.has(itemKey(item)) || !isSelectable(item)) return;
	updateSelection([itemKey(item)]);
}

/**
 * Resolves a contiguous range between the first selected row and the target row.
 *
 * @param {string} targetKey Target row id.
 * @returns {Array<string>} Range-selected row ids.
 */
function rangeSelection(targetKey) {
	const keys = sourceItems.value.filter(isSelectable).map(itemKey);
	const anchor = keys.indexOf(itemKey(selectedItems.value[0]));
	const target = keys.indexOf(targetKey);
	if (anchor < 0 || target < 0) return [targetKey];
	const [start, end] = anchor < target ? [anchor, target] : [target, anchor];
	return keys.slice(start, end + 1);
}

/**
 * Handles keyboard activation for media rows.
 *
 * @param {MediaBrowserItem} item Focused media row.
 * @param {KeyboardEvent} event Native keyboard event.
 */
function onItemKeydown(item, event) {
	if (event.key === 'F2' && selectedKeySet.value.has(itemKey(item))) {
		event.preventDefault();
		beginRename(item);
		return;
	}

	if (event.key !== 'Enter' && event.key !== ' ') return;
	event.preventDefault();
	if (event.key === 'Enter' && itemKind(item) === 'folder') {
		navigateToItem(item, event);
		return;
	}
	if (event.key === 'Enter' && detailConfigFor(item)) {
		openItem(item, event);
		return;
	}
	selectItem(item, event);
}

/**
 * Handles row double-click behavior.
 *
 * @param {MediaBrowserItem} item Activated media row.
 * @param {MouseEvent} event Native double-click event.
 */
function openItem(item, event) {
	clearRenameTimer();
	if (itemKind(item) === 'folder') {
		navigateToItem(item, event);
		return;
	}

	emit('open', { item, event });
	const config = detailConfigFor(item);
	if (!config?.component) return;
	openDetail(item, config, event);
}

/**
 * Opens a media row in the configured detail placement.
 *
 * @param {MediaBrowserItem} item Media row to open.
 * @param {Record<string, unknown>} config Detail component config.
 * @param {MouseEvent|KeyboardEvent|null} event Native activation event.
 */
function openDetail(item, config, event = null) {
	const mode = normalizeDetailMode(config.mode);
	if (mode === 'inline') {
		dialogDetailKey.value = '';
		detailDialogOpen.value = false;
		inlineDetailKey.value = itemKey(item);
	} else {
		inlineDetailKey.value = '';
		dialogDetailKey.value = itemKey(item);
		detailDialogOpen.value = true;
	}
	emit('detail-open', {
		item,
		kind: itemKind(item),
		mode,
		event,
	});
}

/**
 * Closes the active inline detail view.
 */
function clearInlineDetail() {
	if (!inlineDetailItem.value) {
		inlineDetailKey.value = '';
		return;
	}
	emit('detail-close', {
		item: inlineDetailItem.value,
		kind: itemKind(inlineDetailItem.value),
		mode: 'inline',
		event: null,
	});
	inlineDetailKey.value = '';
}

/**
 * Closes the active dialog detail view.
 */
function clearDialogDetail() {
	if (dialogDetailItem.value) {
		emit('detail-close', {
			item: dialogDetailItem.value,
			kind: itemKind(dialogDetailItem.value),
			mode: 'dialog',
			event: null,
		});
	}
	dialogDetailKey.value = '';
	detailDialogOpen.value = false;
}

/**
 * Emits a folder navigation event for a media row.
 *
 * @param {MediaBrowserItem} item Folder row.
 * @param {MouseEvent|KeyboardEvent} event Native activation event.
 */
function navigateToItem(item, event) {
	clearInlineDetail();
	emit('navigate', {
		path: normalizeFolderPath(item.path),
		item,
		breadcrumb: null,
		event,
	});
}

/**
 * Emits a breadcrumb navigation event.
 *
 * @param {MediaBrowserBreadcrumb} breadcrumb Breadcrumb row.
 * @param {MouseEvent} event Native click event.
 */
function navigateToBreadcrumb(breadcrumb, event) {
	if (breadcrumb?.detail) return;
	clearInlineDetail();
	emit('navigate', {
		path: normalizeFolderPath(breadcrumb.path),
		item: null,
		breadcrumb,
		event,
	});
}

/**
 * Marks a breadcrumb as an internal drop target for parent-folder moves.
 *
 * @param {MediaBrowserBreadcrumb} breadcrumb Candidate breadcrumb target.
 * @param {DragEvent} event Native drag event.
 */
function onBreadcrumbDragOver(breadcrumb, event) {
	if (!canDropOnBreadcrumb(breadcrumb, event)) return;
	event.preventDefault();
	event.stopPropagation();
	breadcrumbDropPath.value = breadcrumbDropKey(breadcrumb);
	dropTargetMode.value = 'move';
	if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}

/**
 * Clears a breadcrumb drop target when the pointer leaves the crumb.
 *
 * @param {MediaBrowserBreadcrumb} breadcrumb Breadcrumb being left.
 * @param {DragEvent} event Native drag leave event.
 */
function onBreadcrumbDragLeave(breadcrumb, event) {
	if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
	if (breadcrumbDropPath.value === breadcrumbDropKey(breadcrumb)) clearDropTargets();
}

/**
 * Handles internal row drops onto a breadcrumb target.
 *
 * @param {MediaBrowserBreadcrumb} breadcrumb Breadcrumb receiving the drop.
 * @param {DragEvent} event Native drop event.
 */
function onBreadcrumbDrop(breadcrumb, event) {
	if (!canDropOnBreadcrumb(breadcrumb, event)) return;
	event.preventDefault();
	event.stopPropagation();
	const target = breadcrumbDropTarget(breadcrumb);
	clearDropTargets();
	emitMoveFromDrop(target, event);
}

/**
 * Checks whether a breadcrumb can receive the current internal drag.
 *
 * @param {MediaBrowserBreadcrumb} breadcrumb Breadcrumb to test.
 * @param {DragEvent} event Native drag event.
 * @returns {boolean} True when rows can be moved to the breadcrumb folder.
 */
function canDropOnBreadcrumb(breadcrumb, event) {
	if (!props.canMove || breadcrumb?.detail) return false;
	if (!dataTransferHasType(event, dragDataType)) return false;
	const targetPath = breadcrumbDropKey(breadcrumb);
	if (!targetPath || targetPath === currentPath.value) return false;
	const movedItems = draggedItemsFromEvent(event);
	return movedItems.length > 0 && !movedItems.some((item) => itemKey(item) === String(breadcrumb?.ulid || ''));
}

/**
 * Builds a folder-shaped target row from a breadcrumb.
 *
 * @param {MediaBrowserBreadcrumb} breadcrumb Breadcrumb target.
 * @returns {MediaBrowserItem} Folder-shaped target row.
 */
function breadcrumbDropTarget(breadcrumb) {
	const path = breadcrumbDropKey(breadcrumb);
	return {
		ulid: breadcrumb?.ulid || '',
		type: path === '/' ? 'root' : 'dir',
		path,
		parent_id: null,
		file_uuid: null,
		name: breadcrumb?.label || pathBasename(path) || 'Root',
	};
}

/**
 * Resolves the normalized folder path key for a breadcrumb.
 *
 * @param {MediaBrowserBreadcrumb} breadcrumb Breadcrumb target.
 * @returns {string} Normalized breadcrumb path.
 */
function breadcrumbDropKey(breadcrumb) {
	return normalizeFolderPath(breadcrumb?.path);
}

/**
 * Emits the create folder command for the current folder path.
 */
function emitCreateFolder() {
	if (!props.canCreateFolder) return;
	emit('create-folder', { path: currentPath.value });
}

/**
 * Starts inline rename mode for a media row.
 *
 * @param {MediaBrowserItem} item Media row to rename.
 */
function beginRename(item) {
	if (!props.canRename || !item) return;
	clearInlineDetail();
	renamingKey.value = itemKey(item);
	renameDraft.value = itemName(item);
	nextTick(focusRenameInput);
}

/**
 * Focuses the active rename input after it is rendered.
 */
function focusRenameInput() {
	viewport.value?.querySelector?.('[data-media-browser-rename]')?.focus();
	viewport.value?.querySelector?.('[data-media-browser-rename]')?.select();
}

/**
 * Selects an unselected name or starts rename when it is already selected.
 *
 * @param {MediaBrowserItem} item Media row represented by the clicked name.
 * @param {MouseEvent} event Native click event.
 */
function onNameClick(item, event) {
	if (!selectedKeySet.value.has(itemKey(item))) {
		selectItem(item, event);
		return;
	}
	scheduleRename(item);
}

/**
 * Starts rename after a small delay so double-click can open the item.
 *
 * @param {MediaBrowserItem} item Media row represented by the clicked name.
 */
function scheduleRename(item) {
	clearRenameTimer();
	const delay = Math.max(0, Number(props.renameDelay) || 0);
	renameClickTimer = globalThis.setTimeout(() => {
		beginRename(item);
	}, delay);
}

/**
 * Clears a pending delayed rename timer.
 */
function clearRenameTimer() {
	if (!renameClickTimer) return;
	globalThis.clearTimeout(renameClickTimer);
	renameClickTimer = null;
}

/**
 * Commits the current inline rename draft.
 *
 * @param {MediaBrowserItem} item Media row being renamed.
 */
function commitRename(item) {
	const name = renameDraft.value.trim();
	cancelRename();
	if (!name || name === itemName(item)) return;
	emit('rename', { item, name });
}

/**
 * Cancels inline rename mode.
 */
function cancelRename() {
	renamingKey.value = '';
	renameDraft.value = '';
}

/**
 * Switches display mode and emits the controlled update.
 *
 * @param {'grid'|'list'} mode Target display mode.
 */
function setMode(mode) {
	if (mode === renderMode.value) return;
	emit('update:mode', mode);
}

/**
 * Handles built-in context menu actions.
 *
 * @param {{ value: string }} payload DomContextMenu select payload.
 */
function onContextSelect(payload) {
	const action = payload?.value || '';
	if (action === 'new-folder') emitCreateFolder();
	if (action === 'rename' && selectedItems.value.length === 1) beginRename(selectedItems.value[0]);
	if (action === 'folder-from-selection') {
		emit('make-folder-with-items', {
			items: selectedItems.value,
			path: currentPath.value,
		});
	}
	if (action === 'mode-grid') setMode('grid');
	if (action === 'mode-list') setMode('list');

	emit('context-action', {
		action,
		items: selectedItems.value,
		path: currentPath.value,
	});
}

/**
 * Checks whether a row can be dragged internally.
 *
 * @param {MediaBrowserItem} item Media row to test.
 * @returns {boolean} True when internal dragging can start.
 */
function canDragItem(item) {
	return props.canMove && isSelectable(item) && item?.status !== 'uploading';
}

/**
 * Starts an internal media-row drag operation.
 *
 * @param {MediaBrowserItem} item Dragged media row.
 * @param {DragEvent} event Native drag start event.
 */
function onItemDragStart(item, event) {
	if (!canDragItem(item)) {
		event.preventDefault();
		return;
	}

	const key = itemKey(item);
	const isAlreadySelected = selectedKeySet.value.has(key);
	const items = isAlreadySelected ? selectedItems.value : [item];
	if (!isAlreadySelected) updateSelection([key]);
	draggingKeys.value = items.map(itemKey);

	const payload = {
		keys: items.map(itemKey),
		items: items.map(serializableItem),
	};

	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = 'move';
		event.dataTransfer.setData(dragDataType, JSON.stringify(payload));
		event.dataTransfer.setData('text/plain', items.map(itemName).join(', '));
	}
	setGroupedDragImage(event, items);
}

/**
 * Clears internal drag preview state.
 */
function onItemDragEnd() {
	clearDropTargets();
	draggingKeys.value = [];
}

/**
 * Marks a folder row as the current internal drop target.
 *
 * @param {MediaBrowserItem} item Candidate folder row.
 * @param {DragEvent} event Native drag event.
 */
function onFolderDragOver(item, event) {
	const canMoveHere = canDropOnFolder(item, event);
	const canUploadHere = canDropExternalOnFolder(item, event);
	if (!canMoveHere && !canUploadHere) return;
	event.preventDefault();
	event.stopPropagation();
	dragTargetKey.value = itemKey(item);
	dropTargetMode.value = canUploadHere ? 'upload' : 'move';
	externalDropActive.value = false;
	if (event.dataTransfer) event.dataTransfer.dropEffect = canUploadHere ? 'copy' : 'move';
}

/**
 * Clears a folder drop target when the pointer has left the row.
 *
 * @param {MediaBrowserItem} item Folder row that may be active.
 * @param {DragEvent} event Native drag leave event.
 */
function onFolderDragLeave(item, event) {
	if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
	if (dragTargetKey.value === itemKey(item)) clearDropTargets();
}

/**
 * Handles internal or external drops onto a folder row.
 *
 * @param {MediaBrowserItem} item Folder row receiving the drop.
 * @param {DragEvent} event Native drop event.
 */
async function onFolderDrop(item, event) {
	if (!canDropOnFolder(item, event) && !canDropExternalOnFolder(item, event)) return;
	event.preventDefault();
	event.stopPropagation();
	clearDropTargets();
	externalDropActive.value = false;

	if (hasExternalFiles(event)) {
		await emitUploadFromDrop(event, item);
		return;
	}

	emitMoveFromDrop(item, event);
}

/**
 * Checks whether a folder row can receive the current internal drag.
 *
 * @param {MediaBrowserItem} item Folder row to test.
 * @param {DragEvent} event Native drag event.
 * @returns {boolean} True when the drop should move selected rows.
 */
function canDropOnFolder(item, event) {
	if (!props.canMove || itemKind(item) !== 'folder') return false;
	if (!dataTransferHasType(event, dragDataType)) return false;
	const movedItems = draggedItemsFromEvent(event);
	return movedItems.length > 0 && !movedItems.some((movedItem) => itemKey(movedItem) === itemKey(item));
}

/**
 * Checks whether external files can be uploaded directly into a folder row.
 *
 * @param {MediaBrowserItem} item Folder row to test.
 * @param {DragEvent} event Native drag event.
 * @returns {boolean} True when the folder can receive browser files.
 */
function canDropExternalOnFolder(item, event) {
	return props.canUpload && itemKind(item) === 'folder' && hasExternalFiles(event);
}

/**
 * Emits a move event from an internal drag payload.
 *
 * @param {MediaBrowserItem} target Folder receiving selected rows.
 * @param {DragEvent} event Native drop event.
 */
function emitMoveFromDrop(target, event) {
	const movedItems = draggedItemsFromEvent(event);
	if (!movedItems.length) return;
	emit('move', {
		items: movedItems,
		target,
		event,
	});
}

/**
 * Resolves the current internal drag rows from payload first, then selection.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {Array<MediaBrowserItem>} Moved media rows.
 */
function draggedItemsFromEvent(event) {
	const payloadItems = itemsFromDragEvent(event);
	if (payloadItems.length) return payloadItems;
	const activeDragItems = sourceItems.value.filter((item) => draggingKeySet.value.has(itemKey(item)));
	return activeDragItems.length ? activeDragItems : selectedItems.value;
}

/**
 * Resolves media rows represented by a native data transfer payload.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {Array<MediaBrowserItem>} Moved media rows.
 */
function itemsFromDragEvent(event) {
	const payload = parseDragPayload(event);
	const keys = Array.isArray(payload.keys) ? payload.keys.map(String) : [];
	const serializedItems = Array.isArray(payload.items) ? payload.items : [];
	return keys
		.map((key) => (
			sourceItems.value.find((item) => itemKey(item) === key)
			|| serializedItems.find((item) => itemKey(item) === key)
		))
		.filter(Boolean);
}

/**
 * Serializes the row fields needed by non-Vue drag consumers.
 *
 * @param {MediaBrowserItem} item Media row to serialize.
 * @returns {Record<string, unknown>} Serializable row summary.
 */
function serializableItem(item) {
	return {
		ulid: item.ulid,
		type: item.type,
		path: item.path,
		parent_id: item.parent_id || null,
		file_uuid: item.file_uuid || null,
		name: itemName(item),
	};
}

/**
 * Parses the media-row drag payload from a native drop event.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {Record<string, unknown>} Parsed payload.
 */
function parseDragPayload(event) {
	try {
		const payload = event.dataTransfer?.getData(dragDataType);
		return payload ? JSON.parse(payload) : {};
	} catch {
		return {};
	}
}

/**
 * Clears folder and breadcrumb drop-target preview state.
 */
function clearDropTargets() {
	dragTargetKey.value = '';
	breadcrumbDropPath.value = '';
	dropTargetMode.value = '';
}

/**
 * Renders a compact native drag image that communicates grouped drags.
 *
 * @param {DragEvent} event Native drag start event.
 * @param {Array<MediaBrowserItem>} items Dragged rows.
 */
function setGroupedDragImage(event, items) {
	if (!event.dataTransfer || typeof document === 'undefined' || items.length <= 1) return;
	const preview = document.createElement('div');
	preview.textContent = `${items.length} items`;
	preview.style.position = 'fixed';
	preview.style.top = '-999px';
	preview.style.left = '-999px';
	preview.style.zIndex = '9999';
	preview.style.padding = '0.5rem 0.7rem';
	preview.style.borderRadius = '0.5rem';
	preview.style.border = '1px solid var(--primary)';
	preview.style.background = 'var(--canvas)';
	preview.style.color = 'var(--canvas-fg)';
	preview.style.boxShadow = 'var(--shadow-lg)';
	preview.style.font = '600 12px system-ui, sans-serif';
	preview.style.pointerEvents = 'none';
	document.body.appendChild(preview);
	event.dataTransfer.setDragImage(preview, 18, 18);
	globalThis.setTimeout(() => preview.remove(), 0);
}

/**
 * Resolves the visible drop label for an active folder target.
 *
 * @returns {string} Short target label.
 */
function dropTargetLabel() {
	if (dropTargetMode.value === 'upload') return 'Upload here';
	const count = draggingCount.value || selectedItems.value.length || 1;
	return count === 1 ? 'Move here' : `Move ${count} items here`;
}

/**
 * Checks whether a row is part of the current native drag source.
 *
 * @param {MediaBrowserItem} item Media row to test.
 * @returns {boolean} True when the row is being dragged.
 */
function isDraggedItem(item) {
	return draggingKeySet.value.has(itemKey(item));
}

/**
 * Handles drag-over state for external browser uploads.
 *
 * @param {DragEvent} event Native drag event.
 */
function onBrowserDragOver(event) {
	if (!props.canUpload || !hasExternalFiles(event)) return;
	event.preventDefault();
	externalDropActive.value = true;
	if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
}

/**
 * Clears the external drop preview when the pointer leaves the browser.
 *
 * @param {DragEvent} event Native drag leave event.
 */
function onBrowserDragLeave(event) {
	if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
	externalDropActive.value = false;
	clearDropTargets();
}

/**
 * Handles external files dropped onto the current folder surface.
 *
 * @param {DragEvent} event Native drop event.
 */
async function onBrowserDrop(event) {
	if (!props.canUpload || !hasExternalFiles(event)) return;
	event.preventDefault();
	externalDropActive.value = false;
	clearDropTargets();
	await emitUploadFromDrop(event, null);
}

/**
 * Emits an upload event after expanding files and folder drops.
 *
 * @param {DragEvent} event Native drop event.
 * @param {MediaBrowserItem|null} target Target folder row, or null for current folder.
 */
async function emitUploadFromDrop(event, target) {
	const files = await collectDroppedFiles(event.dataTransfer);
	if (!files.length) return;
	emit('upload', {
		files,
		target,
		path: target ? normalizeFolderPath(target.path) : currentPath.value,
		event,
	});
}

/**
 * Opens the native file chooser for the current media folder.
 */
function openUploadPicker() {
	if (!props.canUpload || !uploadInput.value) return;
	uploadInput.value.value = '';
	uploadInput.value.click();
}

/**
 * Emits files selected through the native chooser using the shared upload payload.
 *
 * @param {Event} event Native file input change event.
 */
function onUploadInputChange(event) {
	const input = event.target;
	const files = Array.from(input?.files || []).map((file) => normalizeDroppedFile({
		file,
		relativePath: file.webkitRelativePath || file.name,
	}));

	if (files.length) {
		emit('upload', {
			files,
			target: null,
			path: currentPath.value,
			event,
		});
	}

	if (input) input.value = '';
}

/**
 * Checks whether a drag event carries external files.
 *
 * @param {DragEvent} event Native drag event.
 * @returns {boolean} True when file data is present.
 */
function hasExternalFiles(event) {
	return dataTransferHasType(event, 'Files') || Boolean(event.dataTransfer?.files?.length);
}

/**
 * Checks whether a data transfer includes a type.
 *
 * @param {DragEvent} event Native drag event.
 * @param {string} type DataTransfer type.
 * @returns {boolean} True when the type exists.
 */
function dataTransferHasType(event, type) {
	return Array.from(event.dataTransfer?.types || []).includes(type);
}

/**
 * Collects browser files from a drop, including folders where supported.
 *
 * @param {DataTransfer|null} dataTransfer Native data transfer object.
 * @returns {Promise<Array<MediaBrowserDroppedFile>>} Dropped file records.
 */
async function collectDroppedFiles(dataTransfer) {
	if (!dataTransfer) return [];
	const itemEntries = Array.from(dataTransfer.items || [])
		.map((item) => item.webkitGetAsEntry?.())
		.filter(Boolean);

	if (itemEntries.length) {
		const nestedFiles = await Promise.all(itemEntries.map((entry) => collectEntryFiles(entry, '')));
		return nestedFiles.flat().map(normalizeDroppedFile);
	}

	return Array.from(dataTransfer.files || []).map((file) => normalizeDroppedFile({
		file,
		relativePath: file.webkitRelativePath || file.name,
	}));
}

/**
 * Recursively collects files from a dropped file-system entry.
 *
 * @param {FileSystemEntry} entry Browser file-system entry.
 * @param {string} prefix Relative path prefix.
 * @returns {Promise<Array<{ file: File, relativePath: string }>>} Dropped file records.
 */
function collectEntryFiles(entry, prefix) {
	if (entry.isFile) {
		return new Promise((resolve) => {
			entry.file(
				(file) => resolve([{ file, relativePath: `${prefix}${file.name}` }]),
				() => resolve([]),
			);
		});
	}

	if (!entry.isDirectory) return Promise.resolve([]);
	const directoryPrefix = `${prefix}${entry.name}/`;
	const reader = entry.createReader();
	return readAllDirectoryEntries(reader).then(async (entries) => {
		const nested = await Promise.all(entries.map((child) => collectEntryFiles(child, directoryPrefix)));
		return nested.flat();
	});
}

/**
 * Reads every entry from a browser directory reader.
 *
 * @param {FileSystemDirectoryReader} reader Browser directory reader.
 * @returns {Promise<Array<FileSystemEntry>>} Directory entries.
 */
function readAllDirectoryEntries(reader) {
	return new Promise((resolve) => {
		const entries = [];
		/**
		 * Reads one browser directory batch and continues until exhausted.
		 */
		const readBatch = () => {
			reader.readEntries((batch) => {
				if (!batch.length) {
					resolve(entries);
					return;
				}
				entries.push(...batch);
				readBatch();
			}, () => resolve(entries));
		};
		readBatch();
	});
}

/**
 * Normalizes a dropped browser file into the upload payload contract.
 *
 * @param {{ file: File, relativePath: string }} record Dropped file record.
 * @returns {MediaBrowserDroppedFile} Upload payload record.
 */
function normalizeDroppedFile(record) {
	const relativePath = String(record.relativePath || record.file.name || '').replace(/^\/+/, '');
	return {
		file: record.file,
		name: record.file.name,
		relativePath,
		pathSegments: relativePath.split('/').filter(Boolean),
	};
}

/**
 * Starts a rubber-band selection gesture when the pointer begins on empty space.
 *
 * @param {PointerEvent} event Native pointer event.
 */
function onViewportPointerDown(event) {
	if (!props.rubberBand || props.selectionMode !== 'multiple' || event.button !== 0) return;
	if (event.target instanceof Element && event.target.closest('[data-media-browser-item], button, input, textarea, a')) return;
	if (!viewport.value) return;

	const rect = viewport.value.getBoundingClientRect();
	bandSelection.value = {
		startX: event.clientX,
		startY: event.clientY,
		currentX: event.clientX,
		currentY: event.clientY,
		originLeft: rect.left,
		originTop: rect.top,
		additive: event.metaKey || event.ctrlKey,
		initialKeys: props.selectedKeys.map(String),
	};
	previousUserSelect = document.body.style.userSelect;
	document.body.style.userSelect = 'none';
	document.addEventListener('pointermove', updateBandSelection);
	document.addEventListener('pointerup', finishBandSelection);
	document.addEventListener('pointercancel', finishBandSelection);
}

/**
 * Updates the rubber-band rectangle and preview selection.
 *
 * @param {PointerEvent} event Native pointer event.
 */
function updateBandSelection(event) {
	if (!bandSelection.value) return;
	bandSelection.value = {
		...bandSelection.value,
		currentX: event.clientX,
		currentY: event.clientY,
	};
	updateSelection(keysInsideBand());
}

/**
 * Finishes the current rubber-band gesture.
 */
function finishBandSelection() {
	removeBandListeners();
	bandSelection.value = null;
}

/**
 * Removes document listeners used by rubber-band selection.
 */
function removeBandListeners() {
	if (typeof document === 'undefined') return;
	document.removeEventListener('pointermove', updateBandSelection);
	document.removeEventListener('pointerup', finishBandSelection);
	document.removeEventListener('pointercancel', finishBandSelection);
	document.body.style.userSelect = previousUserSelect;
}

/**
 * Resolves selectable item keys intersecting the rubber-band rectangle.
 *
 * @returns {Array<string>} Selected row ids.
 */
function keysInsideBand() {
	const band = bandSelection.value;
	if (!band || !viewport.value) return props.selectedKeys.map(String);
	const bandRect = normalizedRect(band.startX, band.startY, band.currentX, band.currentY);
	const keys = Array.from(viewport.value.querySelectorAll('[data-media-browser-item]'))
		.filter((element) => rectanglesIntersect(bandRect, element.getBoundingClientRect()))
		.map((element) => element.getAttribute('data-media-key'))
		.filter(Boolean);

	return band.additive ? uniqueStrings([...band.initialKeys, ...keys]) : uniqueStrings(keys);
}

/**
 * Builds a normalized DOMRect-like object from two pointer coordinates.
 *
 * @param {number} x1 Start x coordinate.
 * @param {number} y1 Start y coordinate.
 * @param {number} x2 Current x coordinate.
 * @param {number} y2 Current y coordinate.
 * @returns {{ left: number, right: number, top: number, bottom: number }} Normalized rectangle.
 */
function normalizedRect(x1, y1, x2, y2) {
	return {
		left: Math.min(x1, x2),
		right: Math.max(x1, x2),
		top: Math.min(y1, y2),
		bottom: Math.max(y1, y2),
	};
}

/**
 * Checks whether two rectangles overlap.
 *
 * @param {{ left: number, right: number, top: number, bottom: number }} a First rectangle.
 * @param {DOMRect} b Second rectangle.
 * @returns {boolean} True when rectangles overlap.
 */
function rectanglesIntersect(a, b) {
	return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

/**
 * Resolves inline style for the active rubber-band rectangle.
 *
 * @returns {Record<string, string>|null} Vue style object.
 */
function bandStyle() {
	const band = bandSelection.value;
	if (!band) return null;
	const rect = normalizedRect(band.startX, band.startY, band.currentX, band.currentY);
	return {
		left: `${rect.left - band.originLeft}px`,
		top: `${rect.top - band.originTop}px`,
		width: `${rect.right - rect.left}px`,
		height: `${rect.bottom - rect.top}px`,
	};
}

/**
 * Returns the default SVG path for an item kind.
 *
 * @param {MediaBrowserItem} item Media row to render.
 * @returns {string} SVG path data.
 */
function iconPath(item) {
	if (itemKind(item) === 'folder') return 'M3.75 7.5h6l1.5 2h9v7.75a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2V7.5Z';
	if (itemKind(item) === 'pdf') return 'M6 3.75h8l4 4v12.5H6V3.75Zm8 0v4h4M8.5 15.5h1.25a1.25 1.25 0 0 0 0-2.5H8.5v5M12.5 13v5h1.1a2.5 2.5 0 0 0 0-5h-1.1M16.75 13h2.5M16.75 15.5h2';
	return 'M7 3.75h7l3 3v13.5H7V3.75Zm7 0v3h3M9.5 12.5h5M9.5 15.5h3.5';
}

/**
 * Resolves a thumbnail URL for an image row.
 *
 * @param {MediaBrowserItem} item Media row to preview.
 * @returns {string} Thumbnail URL or empty string.
 */
function thumbnailUrl(item) {
	const file = itemFile(item);
	return file?.previewUrl || item?.previewUrl || file?.thumbnailUrl || file?.publicUrl || item?.thumbnailUrl || item?.publicUrl || '';
}

/**
 * Formats a file size for display.
 *
 * @param {number} size Raw byte count.
 * @returns {string} Human-readable size.
 */
function formatBytes(size) {
	const value = Number(size);
	if (!Number.isFinite(value) || value <= 0) return '—';
	const units = ['B', 'KB', 'MB', 'GB'];
	let amount = value;
	let unitIndex = 0;
	while (amount >= 1024 && unitIndex < units.length - 1) {
		amount /= 1024;
		unitIndex += 1;
	}
	return `${amount >= 10 || unitIndex === 0 ? Math.round(amount) : amount.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Resolves image alt text from joined file metadata.
 *
 * @param {MediaBrowserItem|null} item Media row to inspect.
 * @returns {string} Alt text value.
 */
function imageAltText(item) {
	return String(itemFile(item)?.meta?.alt || item?.meta?.alt || '');
}

/**
 * Commits a metadata edit from the default inspector.
 *
 * @param {string} key Metadata key.
 * @param {unknown} value Metadata value.
 */
function commitMetadata(key, value) {
	if (!activeItem.value) return;
	emit('metadata-update', {
		item: activeItem.value,
		meta: {
			[key]: value,
		},
	});
}
</script>

<template>
	<section
		class="overflow-hidden rounded-lg border border-border bg-canvas shadow-sm"
		:aria-labelledby="titleId"
		@dragover="onBrowserDragOver"
		@dragleave="onBrowserDragLeave"
		@drop="onBrowserDrop"
	>
		<header v-if="toolbar" class="border-b border-border bg-secondary/25 px-4 py-3">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="min-w-0">
					<h3 :id="titleId" class="text-sm font-semibold text-canvas-fg">{{ title }}</h3>
					<nav class="mt-2 flex min-w-0 flex-wrap items-center gap-1 text-sm" aria-label="Folder path">
						<template v-for="(crumb, index) in resolvedBreadcrumbs" :key="`${crumb.path}-${index}`">
							<button
								type="button"
								class="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-muted-fg transition hover:bg-secondary hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
								:class="[
									index === resolvedBreadcrumbs.length - 1 && 'bg-canvas text-canvas-fg ring-1 ring-border',
									breadcrumbDropPath === breadcrumbDropKey(crumb) && 'bg-primary/10 text-primary ring-2 ring-primary/45',
								]"
								@click="navigateToBreadcrumb(crumb, $event)"
								@dragover="onBreadcrumbDragOver(crumb, $event)"
								@dragleave="onBreadcrumbDragLeave(crumb, $event)"
								@drop="onBreadcrumbDrop(crumb, $event)"
							>
								<span>{{ crumb.label }}</span>
								<span
									v-if="breadcrumbDropPath === breadcrumbDropKey(crumb)"
									class="rounded-full bg-primary px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none text-primary-fg"
								>
									Move
								</span>
							</button>
							<span v-if="index < resolvedBreadcrumbs.length - 1" class="text-muted-fg/60">/</span>
						</template>
					</nav>
				</div>

				<div class="flex shrink-0 flex-wrap items-center gap-2">
					<slot
						name="toolbar"
						:selected-items="selectedItems"
						:selected-keys="selectedKeys"
						:mode="renderMode"
						:current-path="currentPath"
						:set-mode="setMode"
						:view-mode-options="viewModeOptions"
					>
						<DomButton
							v-if="canCreateFolder"
							size="sm"
							variant="secondary"
							@click="emitCreateFolder"
						>
							New folder
						</DomButton>
						<DomToggleButtonGroup
							:model-value="renderMode"
							:options="viewModeOptions"
							label="Media layout"
							chrome="none"
							size="icon-sm"
							variant="switch"
							@update:model-value="setMode"
						>
							<template #option="{ option }">
								<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
									<path :d="option.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								<span class="sr-only">{{ option.label }}</span>
							</template>
						</DomToggleButtonGroup>
					</slot>
				</div>
			</div>

			<div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-fg">
				<span>{{ selectionSummary }}</span>
				<span v-if="loading" class="inline-flex items-center gap-2">
					<span class="size-1.5 rounded-full bg-primary"></span>
					{{ loadingLabel }}
				</span>
				<span v-if="hasUploadProgress" class="inline-flex items-center gap-2">
					<span class="size-1.5 rounded-full bg-success"></span>
					{{ overallUploadProgress }}% uploading
				</span>
			</div>

			<DomProgress
				v-if="hasUploadProgress"
				class="mt-3"
				size="sm"
				label=""
				:value="overallUploadProgress"
				tone="success"
			/>
		</header>

		<div
			class="grid min-h-[32rem]"
			:class="inspector ? 'lg:grid-cols-[minmax(0,1fr)_18rem]' : 'lg:grid-cols-1'"
		>
			<DomContextMenu
				:items="contextMenuItems"
				:open-on-context-menu="hasContextMenuActions"
				width="min-w-60"
				@select="onContextSelect"
			>
				<div
					ref="viewport"
					class="relative min-h-[32rem] overflow-auto p-4 outline-none"
					:class="inspector ? 'lg:border-r lg:border-border' : ''"
					:aria-busy="loading ? 'true' : 'false'"
					@pointerdown="onViewportPointerDown"
				>
					<div
						v-if="externalDropActive && !dragTargetKey"
						class="pointer-events-none absolute inset-3 z-20 grid place-items-center rounded-lg border-2 border-dashed border-primary bg-primary/10 text-sm font-semibold text-primary"
					>
						Drop to upload into {{ currentPath }}
					</div>

					<div
						v-if="canUpload && !inlineDetailItem"
						class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-secondary/25 px-3 py-2.5"
						data-media-browser-upload
					>
						<div class="flex min-w-0 items-center gap-3">
							<div class="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
								<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
									<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</div>
							<div class="min-w-0">
								<p class="text-sm font-semibold text-canvas-fg">Drag and drop files here</p>
								<p class="truncate text-xs text-muted-fg">Uploads will be added to {{ currentPath }}</p>
							</div>
						</div>
						<DomButton type="button" size="sm" variant="secondary" @click.stop="openUploadPicker">
							Upload files
						</DomButton>
						<input
							ref="uploadInput"
							type="file"
							class="hidden"
							:accept="uploadAccept"
							multiple
							@change="onUploadInputChange"
						/>
					</div>

					<slot v-if="!sourceItems.length && !loading && !inlineDetailItem" name="empty">
						<DomEmptyState
							class="mt-10"
							:title="currentPath === '/' ? 'No media yet' : 'This folder is empty'"
							:description="emptyText"
							icon="M4 7h6l2 2h8v9H4V7Zm3 6h10M8 16h4"
						/>
					</slot>

					<div
						v-if="showEmptyLoading && renderMode === 'grid'"
						class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4"
						aria-label="Loading media thumbnails"
					>
						<div v-for="index in 8" :key="index" class="flex min-h-[14.5rem] flex-col rounded-lg bg-secondary/35 p-3">
							<DomSkeleton class="min-h-32 flex-1" label="Loading media thumbnail" />
							<DomSkeleton class="mt-3" variant="text" :lines="2" label="Loading media details" />
						</div>
					</div>

					<div
						v-else-if="showEmptyLoading"
						class="overflow-hidden rounded-lg border border-border"
						aria-label="Loading media rows"
					>
						<div class="grid grid-cols-[2.5rem_minmax(12rem,1fr)_9rem_7rem] bg-secondary/45 px-3 py-2 text-xs font-semibold uppercase text-muted-fg">
							<div></div>
							<div>Name</div>
							<div>Type</div>
							<div class="text-right">Size</div>
						</div>
						<div
							v-for="index in 8"
							:key="index"
							class="grid min-h-14 grid-cols-[2.5rem_minmax(12rem,1fr)_9rem_7rem] items-center gap-3 border-t border-border px-3 py-2"
						>
							<DomSkeleton variant="circle" width="2rem" height="2rem" label="Loading media icon" />
							<DomSkeleton variant="text" :lines="2" label="Loading media row name" />
							<DomSkeleton height="0.75rem" label="Loading media type" />
							<DomSkeleton height="0.75rem" label="Loading media size" />
						</div>
					</div>

					<div v-else-if="inlineDetailItem && inlineDetailConfig?.component" class="min-h-[28rem]">
						<slot
							name="detail"
							:item="inlineDetailItem"
							:kind="itemKind(inlineDetailItem)"
							:file="itemFile(inlineDetailItem)"
							mode="inline"
							:close="clearInlineDetail"
						>
							<component
								:is="inlineDetailConfig.component"
								:item="inlineDetailItem"
								:kind="itemKind(inlineDetailItem)"
								:file="itemFile(inlineDetailItem)"
								mode="inline"
								@close="clearInlineDetail"
							/>
						</slot>
					</div>

					<div
						v-else-if="renderMode === 'grid'"
						class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4"
						role="listbox"
						:aria-label="title"
						:aria-multiselectable="selectionMode === 'multiple' ? 'true' : 'false'"
					>
						<article
							v-for="item in sourceItems"
							:key="itemKey(item)"
							class="group relative flex min-h-[14.5rem] flex-col overflow-hidden rounded-lg border border-transparent bg-secondary/35 p-3 text-center outline-none transition hover:bg-secondary/45 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/60"
							:class="[
								selectedKeySet.has(itemKey(item)) && 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/25',
								dragTargetKey === itemKey(item) && 'scale-[1.01] border-primary bg-primary/15 shadow-lg ring-2 ring-primary/45',
								isDraggedItem(item) && 'opacity-60 ring-2 ring-primary/15',
								!isSelectable(item) && item.type === 'file' && 'opacity-55',
							]"
							role="option"
							tabindex="0"
							data-media-browser-item
							:data-media-key="itemKey(item)"
							:aria-selected="selectedKeySet.has(itemKey(item)) ? 'true' : 'false'"
							:draggable="canDragItem(item)"
							@click="selectItem(item, $event)"
							@dblclick="openItem(item, $event)"
							@contextmenu="selectForContext(item)"
							@keydown="onItemKeydown(item, $event)"
							@dragstart="onItemDragStart(item, $event)"
							@dragend="onItemDragEnd"
							@dragover="onFolderDragOver(item, $event)"
							@dragleave="onFolderDragLeave(item, $event)"
							@drop="onFolderDrop(item, $event)"
						>
							<div
								v-if="dragTargetKey === itemKey(item) && itemKind(item) === 'folder'"
								class="pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-lg border border-primary/60 bg-primary/15 text-xs font-semibold text-primary backdrop-blur-[1px]"
							>
								{{ dropTargetLabel() }}
							</div>

							<slot
								name="item"
								:item="item"
								:kind="itemKind(item)"
								:selected="selectedKeySet.has(itemKey(item))"
								:disabled="!isSelectable(item)"
								:mode="renderMode"
								:rename="() => beginRename(item)"
							>
								<component
									v-if="itemComponentFor(item)"
									:is="itemComponentFor(item)"
									:item="item"
									:kind="itemKind(item)"
									:selected="selectedKeySet.has(itemKey(item))"
									:mode="renderMode"
								/>
								<div v-else class="flex min-h-0 flex-1 flex-col">
									<div class="relative grid min-h-32 flex-1 place-items-center overflow-hidden rounded-lg bg-canvas/45">
										<img
											v-if="itemKind(item) === 'image' && thumbnailUrl(item)"
											:src="thumbnailUrl(item)"
											:alt="imageAltText(item) || itemName(item)"
											class="max-h-full w-full object-contain p-2"
											:class="isUploading(item) && 'opacity-65'"
										/>
										<svg
											v-else-if="itemKind(item) === 'folder'"
											viewBox="0 0 96 84"
											class="size-24 text-primary"
											fill="none"
											aria-hidden="true"
										>
											<path :d="folderIconPaths.back" fill="currentColor" opacity="0.18" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" />
											<path :d="folderIconPaths.front" fill="var(--canvas)" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" />
											<path :d="folderIconPaths.shadow" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity="0.08" />
										</svg>
										<div v-else class="grid size-16 place-items-center rounded-2xl bg-canvas/85 text-muted-fg ring-1 ring-border/70">
											<svg viewBox="0 0 24 24" class="size-9" fill="none" aria-hidden="true">
												<path :d="iconPath(item)" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
											</svg>
										</div>
										<div
											v-if="isUploading(item)"
											class="absolute inset-0 grid place-items-center bg-canvas/45 backdrop-blur-[1px]"
										>
											<DomRadialProgress
												:value="clampProgress(item.uploadProgress)"
												tone="success"
												size="md"
												:label="`${itemName(item)} upload progress`"
											/>
										</div>
									</div>
								</div>
							</slot>

							<div class="mt-3 min-h-[3.25rem] min-w-0">
								<input
									v-if="renamingKey === itemKey(item)"
									v-model="renameDraft"
									data-media-browser-rename
									class="skin-input !h-7 !rounded-md !px-2 !py-0 text-center text-sm font-semibold leading-5"
									@keydown.enter.prevent="commitRename(item)"
									@keydown.esc.prevent="cancelRename"
									@blur="commitRename(item)"
									@click.stop
								/>
								<button
									v-else
									type="button"
									class="mx-auto block w-full truncate rounded-md px-1 py-0.5 text-center text-sm font-semibold text-canvas-fg outline-none hover:bg-canvas/60 focus-visible:ring-2 focus-visible:ring-ring/60"
									@click.stop="onNameClick(item, $event)"
									@dblclick.stop="openItem(item, $event)"
								>
									{{ itemName(item) }}
								</button>
								<div class="mt-1 flex min-w-0 items-center justify-center gap-2 text-xs text-muted-fg">
									<span class="truncate">{{ itemKind(item) === 'folder' ? 'Folder' : itemMime(item) || 'File' }}</span>
									<span v-if="itemFile(item)?.size" class="shrink-0">{{ formatBytes(itemFile(item).size) }}</span>
									<span v-else-if="item.status === 'saving'" class="shrink-0">Saving</span>
								</div>
							</div>
						</article>
					</div>

					<div v-else role="listbox" :aria-label="title" class="overflow-hidden rounded-lg border border-border">
						<div class="grid grid-cols-[2.5rem_minmax(12rem,1fr)_9rem_7rem] bg-secondary/45 px-3 py-2 text-xs font-semibold uppercase text-muted-fg">
							<div></div>
							<div>Name</div>
							<div>Type</div>
							<div class="text-right">Size</div>
						</div>
						<div
							v-for="item in sourceItems"
							:key="itemKey(item)"
							class="relative grid min-h-14 cursor-default grid-cols-[2.5rem_minmax(12rem,1fr)_9rem_7rem] items-center gap-0 border-t border-border px-3 py-2 outline-none transition hover:bg-secondary/35 focus-visible:ring-2 focus-visible:ring-ring/60"
							:class="[
								selectedKeySet.has(itemKey(item)) && 'bg-primary/5 text-primary',
								dragTargetKey === itemKey(item) && 'bg-primary/15 ring-2 ring-inset ring-primary/45',
								isDraggedItem(item) && 'opacity-60',
								!isSelectable(item) && item.type === 'file' && 'opacity-55',
							]"
							role="option"
							tabindex="0"
							data-media-browser-item
							:data-media-key="itemKey(item)"
							:aria-selected="selectedKeySet.has(itemKey(item)) ? 'true' : 'false'"
							:draggable="canDragItem(item)"
							@click="selectItem(item, $event)"
							@dblclick="openItem(item, $event)"
							@contextmenu="selectForContext(item)"
							@keydown="onItemKeydown(item, $event)"
							@dragstart="onItemDragStart(item, $event)"
							@dragend="onItemDragEnd"
							@dragover="onFolderDragOver(item, $event)"
							@dragleave="onFolderDragLeave(item, $event)"
							@drop="onFolderDrop(item, $event)"
						>
							<div
								v-if="dragTargetKey === itemKey(item) && itemKind(item) === 'folder'"
								class="pointer-events-none absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-fg shadow-sm"
							>
								{{ dropTargetLabel() }}
							</div>

							<div class="relative grid size-8 place-items-center overflow-hidden rounded-md bg-secondary text-muted-fg">
								<img
									v-if="itemKind(item) === 'image' && thumbnailUrl(item)"
									:src="thumbnailUrl(item)"
									:alt="imageAltText(item) || itemName(item)"
									class="size-full object-cover"
									:class="isUploading(item) && 'opacity-65'"
								/>
								<svg v-else viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
									<path :d="iconPath(item)" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								<div
									v-if="isUploading(item)"
									class="absolute inset-0 grid place-items-center bg-canvas/55 backdrop-blur-[1px]"
								>
									<DomRadialProgress
										:value="clampProgress(item.uploadProgress)"
										tone="success"
										:size="30"
										:show-value="false"
										:label="`${itemName(item)} upload progress`"
									/>
								</div>
							</div>
							<div class="min-w-0">
								<input
									v-if="renamingKey === itemKey(item)"
									v-model="renameDraft"
									data-media-browser-rename
									class="skin-input !h-7 !rounded-md !px-2 !py-0 text-sm font-semibold leading-5"
									@keydown.enter.prevent="commitRename(item)"
									@keydown.esc.prevent="cancelRename"
									@blur="commitRename(item)"
									@click.stop
								/>
								<button
									v-else
									type="button"
									class="block w-full truncate rounded-md px-1 py-0.5 text-left text-sm font-semibold text-canvas-fg outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/60"
									@click.stop="onNameClick(item, $event)"
									@dblclick.stop="openItem(item, $event)"
								>
									{{ itemName(item) }}
								</button>
								<p v-if="isUploading(item)" class="mt-1 text-xs text-muted-fg">{{ clampProgress(item.uploadProgress) }}% uploaded</p>
							</div>
							<div class="truncate text-sm text-muted-fg">{{ itemKind(item) === 'folder' ? 'Folder' : itemMime(item) || 'File' }}</div>
							<div class="text-right text-sm text-muted-fg">{{ itemFile(item)?.size ? formatBytes(itemFile(item).size) : '—' }}</div>
						</div>
					</div>

					<div
						v-if="bandSelection"
						class="pointer-events-none absolute z-30 rounded-md border border-primary bg-primary/10"
						:style="bandStyle()"
					></div>
				</div>
			</DomContextMenu>

			<aside
				v-if="inspector"
				class="min-h-[32rem] bg-secondary/20 p-4"
				:class="activeItem ? '' : 'hidden lg:block'"
			>
				<slot
					v-if="activeItem"
					name="inspector"
					:item="activeItem"
					:kind="itemKind(activeItem)"
					:file="itemFile(activeItem)"
					:selected-items="selectedItems"
				>
					<component
						v-if="inspectorComponentFor(activeItem)"
						:is="inspectorComponentFor(activeItem)"
						:item="activeItem"
						:kind="itemKind(activeItem)"
						:file="itemFile(activeItem)"
						:selected-items="selectedItems"
					/>
					<div v-else class="space-y-4">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">Inspector</p>
							<h4 class="mt-1 truncate text-base font-semibold text-canvas-fg">{{ itemName(activeItem) }}</h4>
						</div>
						<dl class="space-y-3 text-sm">
							<div>
								<dt class="text-xs font-medium uppercase text-muted-fg">Media row</dt>
								<dd class="mt-1 break-all font-mono text-xs text-canvas-fg">{{ activeItem.ulid }}</dd>
							</div>
							<div>
								<dt class="text-xs font-medium uppercase text-muted-fg">Path</dt>
								<dd class="mt-1 break-all text-canvas-fg">{{ activeItem.path }}</dd>
							</div>
							<div v-if="itemFile(activeItem)">
								<dt class="text-xs font-medium uppercase text-muted-fg">File</dt>
								<dd class="mt-1 text-canvas-fg">{{ itemMime(activeItem) || 'Unknown type' }} · {{ formatBytes(itemFile(activeItem).size) }}</dd>
							</div>
							<div v-if="itemFile(activeItem)?.publicUrl">
								<dt class="text-xs font-medium uppercase text-muted-fg">Public URL</dt>
								<dd class="mt-1 break-all text-primary">{{ itemFile(activeItem).publicUrl }}</dd>
							</div>
						</dl>
						<label v-if="itemKind(activeItem) === 'image'" class="block text-sm">
							<span class="font-medium text-canvas-fg">Alt text</span>
							<textarea
								v-model="inspectorDraft.alt"
								class="skin-input mt-2 min-h-24 w-full resize-y py-2"
								@change="commitMetadata('alt', inspectorDraft.alt)"
							></textarea>
						</label>
					</div>
				</slot>
				<div v-else class="flex h-full min-h-[28rem] items-center justify-center text-center text-sm text-muted-fg">
					Select an item to inspect its details.
				</div>
			</aside>
		</div>

		<DomDialog
			v-if="dialogDetailConfig?.component"
			v-model="detailDialogOpen"
			:title="dialogDetailTitle"
			:size="dialogDetailConfig.size || 'xl'"
			:width="dialogDetailConfig.width || ''"
			:height="dialogDetailConfig.height || ''"
			:footer="false"
			@close-complete="clearDialogDetail"
		>
			<slot
				name="detail"
				:item="dialogDetailItem"
				:kind="itemKind(dialogDetailItem)"
				:file="itemFile(dialogDetailItem)"
				mode="dialog"
				:close="clearDialogDetail"
			>
				<component
					:is="dialogDetailConfig.component"
					:item="dialogDetailItem"
					:kind="itemKind(dialogDetailItem)"
					:file="itemFile(dialogDetailItem)"
					mode="dialog"
					@close="clearDialogDetail"
				/>
			</slot>
		</DomDialog>
	</section>
</template>
