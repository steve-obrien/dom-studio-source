<script>
import { fieldProps } from '../../forms/field/fieldProps.js';

/**
 * Returns the default Tiptap JSON document used when no model value is supplied.
 *
 * @returns {Record<string, unknown>} Empty document content.
 */
export function createDefaultDocumentContent() {
	return {
		type: 'doc',
		content: [
			{
				type: 'heading',
				attrs: { level: 1 },
				content: [{ type: 'text', text: 'Customer launch note' }],
			},
			{
				type: 'paragraph',
				content: [{ type: 'text', text: 'The July release gives teams one place to draft product copy, review AI suggestions, and keep the final document structured for publishing.' }],
			},
			{
				type: 'paragraph',
				content: [{ type: 'text', text: 'The current draft needs a warmer introduction, a shorter benefits section, and one image from the product media library before it is ready to share.' }],
			},
		],
	};
}

/**
 * Returns the built-in editor tool ids.
 *
 * @returns {Array<string>} Built-in tool ids.
 */
function defaultDocumentEditorTools() {
	return [
		'undo',
		'redo',
		'paragraph',
		'heading1',
		'heading2',
		'heading3',
		'bold',
		'italic',
		'underline',
		'bulletList',
		'orderedList',
		'blockquote',
		'codeBlock',
		'link',
		'table',
		'image',
		'video',
		'rewrite',
	];
}

/**
 * Returns an empty custom tool list.
 *
 * @returns {Array<Record<string, unknown>>} Custom tools.
 */
function defaultCustomTools() {
	return [];
}

/**
 * Returns an empty suggestion list.
 *
 * @returns {Array<Record<string, unknown>>} Suggestions.
 */
function defaultSuggestions() {
	return [];
}

/**
 * Returns an empty collaborator list.
 *
 * @returns {Array<Record<string, unknown>>} Collaborators.
 */
function defaultCollaborators() {
	return [];
}

/**
 * Returns an empty custom Tiptap extension list.
 *
 * @returns {Array<unknown>} Custom Tiptap extensions.
 */
function defaultExtensions() {
	return [];
}

/**
 * Returns no collaboration adapter by default.
 *
 * @returns {Record<string, unknown>|null} Collaboration config.
 */
function defaultCollaboration() {
	return null;
}

/**
 * Returns the default AI author used for local suggestions.
 *
 * @returns {{ id: string, name: string, color: string, type: string }} AI author metadata.
 */
function defaultAiUser() {
	return {
		id: 'ai-editor',
		name: 'AI editor',
		color: '#2563eb',
		type: 'ai',
	};
}

/**
 * Checks whether an output mode is supported.
 *
 * @param {string} value Output mode.
 * @returns {boolean} True when supported.
 */
function isDocumentEditorOutput(value) {
	return ['json', 'html'].includes(value);
}

/**
 * Checks whether a chrome mode is supported.
 *
 * @param {string|boolean} value Chrome mode.
 * @returns {boolean} True when supported.
 */
function isDocumentEditorChrome(value) {
	return ['document', 'field', 'none'].includes(value) || value === false;
}

export const documentEditorProps = {
	...fieldProps,
	modelValue: {
		type: [Object, String],
		default: createDefaultDocumentContent,
		_edit: { component: 'DomJsonInput', description: 'Controlled editor content. JSON is preferred; HTML strings are accepted for simple imports.' },
	},
	output: {
		type: String,
		default: 'json',
		validator: isDocumentEditorOutput,
		_edit: { options: ['json', 'html'], description: 'Value emitted through update:modelValue.' },
	},
	editable: {
		type: Boolean,
		default: true,
		_edit: { description: 'Allow editing and toolbar commands.' },
	},
	chrome: {
		type: [String, Boolean],
		default: 'document',
		validator: isDocumentEditorChrome,
		_edit: { options: ['document', 'field', 'none', false], description: 'Render the full document workspace, form-field chrome, or no outer field chrome.' },
	},
	placeholder: {
		type: String,
		default: 'Write something useful...',
		_edit: { description: 'Placeholder shown inside empty blocks.' },
	},
	title: {
		type: String,
		default: 'Document editor',
		_edit: { description: 'Accessible editor title.' },
	},
	status: {
		type: String,
		default: '',
		_edit: { description: 'Optional save or collaboration status label.' },
	},
	tools: {
		type: Array,
		default: defaultDocumentEditorTools,
		_edit: { component: 'DomJsonListInput', description: 'Built-in toolbar tool ids to show.' },
	},
	customTools: {
		type: Array,
		default: defaultCustomTools,
		_edit: { component: 'DomJsonListInput', description: 'Additional toolbar actions emitted through tool-action.' },
	},
	suggestions: {
		type: Array,
		default: defaultSuggestions,
		_edit: { component: 'DomJsonListInput', description: 'Externally supplied rewrite suggestions.' },
	},
	collaborators: {
		type: Array,
		default: defaultCollaborators,
		_edit: { component: 'DomJsonListInput', description: 'Human, AI, or system collaborators shown in the editor header.' },
	},
	extensions: {
		type: Array,
		default: defaultExtensions,
		_edit: { component: 'DomJsonListInput', description: 'Additional Tiptap extensions appended to the built-in editor extension list.' },
	},
	configureExtensions: {
		type: Function,
		default: null,
		_edit: { description: 'Optional hook that receives the default extension list and Tiptap runtime modules, then returns the final extension list.' },
	},
	collaboration: {
		type: Object,
		default: defaultCollaboration,
		_edit: { component: 'DomJsonInput', description: 'Optional Yjs collaboration adapter with document/fragment, provider, field, and user.' },
	},
	rewriteProvider: {
		type: Function,
		default: null,
		_edit: { description: 'Optional async function that returns a rewrite suggestion for the current selection.' },
	},
	aiUser: {
		type: Object,
		default: defaultAiUser,
		_edit: { component: 'DomJsonInput', description: 'AI author metadata used for locally created rewrite suggestions.' },
	},
	showSuggestionRail: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the review rail for pending AI suggestions.' },
	},
	showToolbar: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the WYSIWYG toolbar. Slash commands remain available when enabled.' },
	},
	showSlashMenu: {
		type: Boolean,
		default: true,
		_edit: { description: 'Open the block command menu when the user types / at the start of a block.' },
	},
	autofocus: {
		type: Boolean,
		default: false,
		_edit: { description: 'Focus the editor when the client runtime mounts.' },
	},
	minHeight: {
		type: String,
		default: '34rem',
		_edit: { description: 'Minimum height for the editable document canvas.' },
	},
};
</script>

<script setup>
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue';
import DomButton from '../../components/button/DomButton.vue';
import DomDialog from '../../components/dialog/DomDialog.vue';
import DomIconButton from '../../components/icon-button/DomIconButton.vue';
import DomToolbar from '../../components/toolbar/DomToolbar.vue';
import DomField from '../../forms/field/DomField.vue';
import { useField } from '../../forms/field/useField.js';
import DomNativeSelect from '../../forms/native-select/DomNativeSelect.vue';
import DomTextInput from '../../forms/text-input/DomTextInput.vue';
import DomBadge from '../../visual/badge/DomBadge.vue';
import DomTextDiff from '../../visual/text-diff/DomTextDiff.vue';
import { codeLanguageOptionValue } from '../../lib/vue/codeHighlighter.js';
import {
	createDocumentEditorCodeBlockExtension,
	createDocumentEditorCodeHighlightExtension,
	documentEditorCodeLanguages,
} from './documentEditorCodeBlock.js';

defineOptions({
	__doc: {
		name: 'Document editor',
		tag: '<DomDocumentEditor>',
		description: 'A client-only WYSIWYG document editor shell for structured writing, tables, language-aware highlighted code blocks, AI rewrite suggestions, media insertion, video embeds, and optional Yjs collaboration adapters.',
		icon: 'M5 4h14v16H5V4Zm4 5h6M9 13h6M9 17h3',
		events: [
			{ name: 'update:modelValue', payload: 'Record<string, unknown> | string', description: 'Fired with JSON or HTML content depending on the output prop.' },
			{ name: 'change', payload: 'DocumentEditorChangePayload', description: 'Fired with JSON, HTML, and plain text whenever the editor changes.' },
			{ name: 'selection-change', payload: 'DocumentEditorSelectionPayload', description: 'Fired when the editor selection changes.' },
			{ name: 'rewrite-request', payload: 'DocumentEditorRewriteRequest', description: 'Fired when the user asks AI to rewrite the selected range.' },
			{ name: 'suggestion-create', payload: 'DocumentEditorSuggestion', description: 'Fired after a rewrite suggestion is added to the review rail.' },
			{ name: 'suggestion-accept', payload: 'DocumentEditorSuggestion', description: 'Fired after a suggestion is accepted.' },
			{ name: 'suggestion-reject', payload: 'DocumentEditorSuggestion', description: 'Fired after a suggestion is rejected.' },
			{ name: 'media-request', payload: 'DocumentEditorMediaRequestPayload', description: 'Fired when the image tool or an existing image requests an app-owned media picker.' },
			{ name: 'media-insert', payload: 'DocumentEditorMediaPayload', description: 'Fired after insertImage inserts a media-backed image node.' },
			{ name: 'media-update', payload: 'DocumentEditorMediaPayload', description: 'Fired after an existing media-backed image node is replaced.' },
			{ name: 'video-insert', payload: 'DocumentEditorVideoPayload', description: 'Fired after a video embed node is inserted.' },
			{ name: 'tool-action', payload: '({ tool, editor })', description: 'Fired when a custom toolbar tool is activated.' },
			{ name: 'ready', payload: '({ editor })', description: 'Fired after the browser-only editor runtime mounts.' },
			{ name: 'runtime-error', payload: 'Error', description: 'Fired when the editor runtime cannot mount.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when the editable document receives focus.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when the editable document loses focus.' },
		],
		slots: [
			{ name: 'toolbar-start', payload: '{ editor, active }', description: 'Add controls before the built-in toolbar groups.' },
			{ name: 'toolbar-end', payload: '{ editor, active }', description: 'Add controls after the built-in toolbar groups.' },
			{ name: 'suggestion', payload: '{ suggestion, accept, reject }', description: 'Replace a suggestion review card.' },
			{ name: 'empty-suggestions', description: 'Replace the empty suggestion rail state.' },
		],
	},
});

const props = defineProps(documentEditorProps);
const emit = defineEmits([
	'update:modelValue',
	'change',
	'selection-change',
	'rewrite-request',
	'suggestion-create',
	'suggestion-accept',
	'suggestion-reject',
	'media-request',
	'media-insert',
	'media-update',
	'video-insert',
	'tool-action',
	'ready',
	'runtime-error',
	'focus',
	'blur',
]);

const editor = shallowRef(null);
const editorShell = ref(null);
const editorContentComponent = shallowRef(null);
const editorReady = ref(false);
const editorLoading = ref(false);
const runtimeError = ref('');
const editorTick = ref(0);
const internalSuggestions = ref([]);
const rewriteInstruction = ref('');
const rewriteBusy = ref(false);
const videoDialogOpen = ref(false);
const videoUrl = ref('');
const videoTitle = ref('');
const linkDialogOpen = ref(false);
const linkUrl = ref('');
const slashMenuOpen = ref(false);
const slashMenuPanel = ref(null);
const slashMenuQuery = ref('');
const slashMenuIndex = ref(0);
const slashMenuRange = ref(null);
const slashMenuStyle = ref({});
const lastContentSignature = ref('');
const lastChangePayload = ref(null);
const codeLanguageInputId = `dom-document-editor-code-language-${useId()}`;
let suggestionCounter = 0;
let applyingExternalContent = false;
let slashMenuFrame = 0;

const toolIcons = {
	undo: 'M9 14 4 9l5-5M4 9h9a6 6 0 0 1 0 12h-1',
	redo: 'm15 14 5-5-5-5M20 9h-9a6 6 0 0 0 0 12h1',
	paragraph: 'M13 4v16M17 4v16M19 4H9a4 4 0 0 0 0 8h4',
	heading1: 'M4 6v12M12 6v12M4 12h8M17 9l2-2v10M17 17h4',
	heading2: 'M4 6v12M12 6v12M4 12h8M16 8h4l-4 5h4',
	heading3: 'M4 6v12M12 6v12M4 12h8M16 7h4l-3 4h1a3 3 0 0 1 0 6h-2',
	bold: 'M7 5h6a4 4 0 0 1 0 8H7V5Zm0 8h7a4 4 0 0 1 0 8H7v-8Z',
	italic: 'M10 5h8M6 19h8M14 5l-4 14',
	underline: 'M7 5v6a5 5 0 0 0 10 0V5M6 21h12',
	bulletList: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
	orderedList: 'M10 6h11M10 12h11M10 18h11M4 6h1v4M3 10h3M3 14h3l-3 4h3',
	blockquote: 'M8 8H5v5h3v3H4V8h4Zm9 0h-3v5h3v3h-4V8h4Z',
	codeBlock: 'm8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14',
	link: 'M10 13a5 5 0 0 0 7.54.54l1.92-1.92a5 5 0 0 0-7.07-7.07l-1.1 1.1M14 11a5 5 0 0 0-7.54-.54l-1.92 1.92a5 5 0 0 0 7.07 7.07l1.1-1.1',
	table: 'M4 5h16v14H4V5Zm0 5h16M9 5v14M15 5v14',
	image: 'M4 5h16v14H4V5Zm3 10 3-3 3 3 2-2 4 4M8 9h.01',
	video: 'M4 6h12v12H4V6Zm12 4 5-3v10l-5-3',
	rewrite: 'M12 3l1.4 4.2L18 9l-4.6 1.8L12 15l-1.4-4.2L6 9l4.6-1.8L12 3ZM5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
};

const slashBlockOptions = [
	{ id: 'paragraph', label: 'Paragraph', description: 'Plain text block', tool: 'paragraph', icon: toolIcons.paragraph },
	{ id: 'heading1', label: 'Heading 1', description: 'Page heading', tool: 'heading1', icon: toolIcons.heading1 },
	{ id: 'heading2', label: 'Heading 2', description: 'Section heading', tool: 'heading2', icon: toolIcons.heading2 },
	{ id: 'heading3', label: 'Heading 3', description: 'Sub-section heading', tool: 'heading3', icon: toolIcons.heading3 },
	{ id: 'bulletList', label: 'Bullet list', description: 'Unordered list', tool: 'bulletList', icon: toolIcons.bulletList },
	{ id: 'orderedList', label: 'Numbered list', description: 'Ordered list', tool: 'orderedList', icon: toolIcons.orderedList },
	{ id: 'blockquote', label: 'Quote', description: 'Quoted callout block', tool: 'blockquote', icon: toolIcons.blockquote },
	{ id: 'codeBlock', label: 'Code block', description: 'Preformatted code', tool: 'codeBlock', icon: toolIcons.codeBlock },
	{ id: 'table', label: 'Table', description: 'Insert a 3 by 3 table', tool: 'table', icon: toolIcons.table },
	{ id: 'image', label: 'Image', description: 'Insert an image', tool: 'image', icon: toolIcons.image },
	{ id: 'video', label: 'Video', description: 'Embed a video', tool: 'video', icon: toolIcons.video },
];

const field = useField(props, emit, { idPrefix: 'dom-document-editor' });
const enabledToolSet = computed(() => new Set(props.tools.length ? props.tools : defaultDocumentEditorTools()));
const suggestions = computed(() => [
	...props.suggestions.map(normalizeExternalSuggestion),
	...internalSuggestions.value,
]);
const suggestionCards = computed(() => suggestions.value);
const hasSuggestions = computed(() => suggestionCards.value.length > 0);
const hasCollaboration = computed(() => Boolean(collaborationDocument(props.collaboration) || props.collaboration?.fragment));
const visibleCollaborators = computed(() => normalizeCollaborators(props.collaborators, props.collaboration));
const statusLabel = computed(() => {
	if (runtimeError.value) return 'Editor unavailable';
	if (editorLoading.value) return 'Loading editor';
	if (props.status) return props.status;
	if (hasCollaboration.value) return 'Collaborative';
	return editorReady.value ? 'Ready' : 'Client only';
});
const toolbarState = computed(() => {
	editorTick.value;
	const instance = editor.value;
	return {
		paragraph: Boolean(instance?.isActive?.('paragraph')),
		heading1: Boolean(instance?.isActive?.('heading', { level: 1 })),
		heading2: Boolean(instance?.isActive?.('heading', { level: 2 })),
		heading3: Boolean(instance?.isActive?.('heading', { level: 3 })),
		bold: Boolean(instance?.isActive?.('bold')),
		italic: Boolean(instance?.isActive?.('italic')),
		underline: Boolean(instance?.isActive?.('underline')),
		bulletList: Boolean(instance?.isActive?.('bulletList')),
		orderedList: Boolean(instance?.isActive?.('orderedList')),
		blockquote: Boolean(instance?.isActive?.('blockquote')),
		codeBlock: Boolean(instance?.isActive?.('codeBlock')),
		codeLanguage: codeLanguageOptionValue(instance?.getAttributes?.('codeBlock')?.language || 'txt'),
		link: Boolean(instance?.isActive?.('link')),
		table: Boolean(instance?.isActive?.('table')),
		tableHeader: Boolean(instance?.isActive?.('tableHeader')),
	};
});
const fieldChrome = computed(() => (props.chrome === 'field' ? 'field' : false));
const hasDocumentChrome = computed(() => props.chrome === 'document');
const hasFieldChrome = computed(() => props.chrome === 'field');
const hasBareChrome = computed(() => props.chrome === false || props.chrome === 'none');
const isEditorEditable = computed(() => Boolean(props.editable && !field.disabled.value && !field.readOnly.value));
const canUseEditor = computed(() => editorReady.value && isEditorEditable.value && editor.value);
const codeBlockControlsVisible = computed(() => Boolean(props.showToolbar && canUseEditor.value && showTool('codeBlock') && toolbarState.value.codeBlock));
const tableControlsVisible = computed(() => Boolean(props.showToolbar && canUseEditor.value && showTool('table') && toolbarState.value.table));
const customToolbarTools = computed(() => props.customTools.filter((tool) => tool?.id && tool?.label));
const editorPaperStyle = computed(resolveEditorPaperStyle);
const editorTitle = computed(() => props.title || field.fieldAttrs.value.label || 'Document editor');
const hiddenInputValue = computed(resolveHiddenInputValue);
const slashMenuOptions = computed(resolveSlashMenuOptions);
const editorClasses = computed(() => [
	hasFieldChrome.value
		? 'dom-document-editor dom-document-editor--field skin-input relative block w-full min-w-0 overflow-visible !p-0 text-canvas-fg'
		: hasBareChrome.value
			? 'dom-document-editor dom-document-editor--bare relative w-full min-w-0 overflow-visible bg-transparent text-canvas-fg'
			: 'dom-document-editor dom-document-editor--document relative w-full min-w-0 overflow-visible rounded-lg border border-border bg-canvas text-canvas-fg shadow-sm',
	!isEditorEditable.value && 'opacity-90',
	field.invalid.value && 'dom-document-editor--invalid',
]);
const toolbarClasses = computed(() => [
	'dom-document-editor__toolbar',
	// Field text sits 1rem in, so the 0.5rem inset puts the first icon on it; the paper sits 1rem in, so buttons line up with its edge.
	hasFieldChrome.value ? 'px-2 py-1' : 'px-4 pt-2',
	hasDocumentChrome.value && 'border-b border-border pb-2',
]);
const paperClasses = computed(() => [
	'dom-document-editor__paper',
	hasFieldChrome.value && 'dom-document-editor__paper--field',
	!isEditorEditable.value && 'dom-document-editor__paper--readonly',
]);

watch(() => [
	isEditorEditable.value,
	field.id.value,
	field.describedBy.value,
	field.invalid.value,
	editorTitle.value,
], updateEditorEditable);
watch(() => field.value.value, applyExternalModelValue, { deep: true });
watch(() => props.collaboration?.user, updateCollaborationUser, { deep: true });
watch(slashMenuOptions, syncSlashMenuIndex);

onMounted(mountEditor);
onBeforeUnmount(destroyEditor);

defineExpose({
	editor,
	focusEditor,
	insertImage,
	insertVideo,
	insertTable,
	requestRewrite,
	createSuggestion,
	acceptSuggestion,
	rejectSuggestion,
	savePayload,
});

/**
 * Mounts the browser-only editor runtime.
 *
 * @returns {Promise<void>} Resolves when the editor has mounted or failed.
 */
async function mountEditor() {
	if (typeof window === 'undefined' || editor.value) return;
	editorLoading.value = true;
	runtimeError.value = '';
	try {
		const modules = await loadEditorRuntime();
		editorContentComponent.value = markRaw(modules.EditorContent);
		const extensions = createEditorExtensions(modules);
		const content = hasCollaboration.value ? undefined : normalizeEditorContent(field.value.value);
		editor.value = markRaw(new modules.Editor({
			extensions,
			content,
			editable: isEditorEditable.value,
			autofocus: props.autofocus ? 'end' : false,
			editorProps: {
				attributes: editorDomAttributes(),
				handleKeyDown: handleEditorKeyDown,
			},
			onUpdate: handleEditorUpdate,
			onSelectionUpdate: handleEditorSelectionUpdate,
			onFocus: handleEditorFocus,
			onBlur: handleEditorBlur,
		}));
		editorReady.value = true;
		lastContentSignature.value = contentSignature(field.value.value);
		await nextTick();
		emit('ready', { editor: editor.value });
		emitEditorChange();
	} catch (error) {
		runtimeError.value = error?.message || String(error || 'Editor runtime failed.');
		emit('runtime-error', error);
	} finally {
		editorLoading.value = false;
	}
}

/**
 * Dynamically imports editor packages so the SSR build never evaluates the editing engine.
 *
 * @returns {Promise<Record<string, unknown>>} Editor runtime modules.
 */
async function loadEditorRuntime() {
	const [
		tiptap,
		starterKitModule,
		placeholderModule,
		linkModule,
		imageModule,
		underlineModule,
		codeBlockModule,
		tableModule,
		collaborationModule,
		collaborationCaretModule,
		prosemirrorStateModule,
		prosemirrorViewModule,
	] = await Promise.all([
		import('@tiptap/vue-3'),
		import('@tiptap/starter-kit'),
		import('@tiptap/extension-placeholder'),
		import('@tiptap/extension-link'),
		import('@tiptap/extension-image'),
		import('@tiptap/extension-underline'),
		import('@tiptap/extension-code-block'),
		import('@tiptap/extension-table'),
		import('@tiptap/extension-collaboration'),
		import('@tiptap/extension-collaboration-caret'),
		import('@tiptap/pm/state'),
		import('@tiptap/pm/view'),
	]);
	return {
		Editor: tiptap.Editor,
		EditorContent: tiptap.EditorContent,
		Mark: tiptap.Mark,
		Node: tiptap.Node,
		Extension: tiptap.Extension,
		mergeAttributes: tiptap.mergeAttributes,
		StarterKit: starterKitModule.default || starterKitModule.StarterKit,
		Placeholder: placeholderModule.default || placeholderModule.Placeholder,
		Link: linkModule.default || linkModule.Link,
		Image: imageModule.default || imageModule.Image,
		Underline: underlineModule.default || underlineModule.Underline,
		CodeBlock: codeBlockModule.default || codeBlockModule.CodeBlock,
		TableKit: tableModule.TableKit,
		Collaboration: collaborationModule.default || collaborationModule.Collaboration,
		CollaborationCaret: collaborationCaretModule.default || collaborationCaretModule.CollaborationCaret,
		createCollaborationMappablePosition: collaborationModule.createMappablePosition,
		getCollaborationUpdatedPosition: collaborationModule.getUpdatedPosition,
		isCollaborationChange: collaborationModule.isChangeOrigin,
		Plugin: prosemirrorStateModule.Plugin,
		PluginKey: prosemirrorStateModule.PluginKey,
		TextSelection: prosemirrorStateModule.TextSelection,
		Decoration: prosemirrorViewModule.Decoration,
		DecorationSet: prosemirrorViewModule.DecorationSet,
	};
}

/**
 * Creates the Tiptap extension list for the current editor props.
 *
 * @param {Record<string, unknown>} modules Runtime modules.
 * @returns {Array<unknown>} Tiptap extensions.
 */
function createEditorExtensions(modules) {
	const extensions = [
		modules.StarterKit.configure({
			heading: { levels: [1, 2, 3, 4] },
			codeBlock: false,
			link: false,
			underline: false,
			undoRedo: hasCollaboration.value ? false : undefined,
		}),
		createDocumentEditorCodeBlockExtension(modules.CodeBlock, modules.mergeAttributes),
		createDocumentEditorCodeHighlightExtension(modules),
		modules.TableKit.configure({
			table: {
				resizable: true,
				lastColumnResizable: false,
			},
		}),
		modules.Placeholder.configure({ placeholder: props.placeholder }),
		modules.Link.configure({
			openOnClick: false,
			autolink: true,
			defaultProtocol: 'https',
			HTMLAttributes: {
				class: 'dom-document-editor__link',
			},
		}),
		modules.Underline,
		createImageExtension(modules.Image),
		createVideoEmbedExtension(modules.Node, modules.mergeAttributes),
		createSuggestionMarkExtension(modules.Mark, modules.mergeAttributes),
	];
	const collaborationConfig = props.collaboration || {};
	const yDocument = collaborationDocument(collaborationConfig);
	if (hasCollaboration.value) {
		extensions.push(modules.Collaboration.configure({
			document: yDocument,
			fragment: collaborationConfig.fragment || null,
			field: collaborationConfig.field || 'default',
			provider: collaborationConfig.provider || null,
		}));
		extensions.push(createCollaborationSelectionGuardExtension(modules));
	}
	if (hasCollaboration.value && collaborationConfig.provider) {
		extensions.push(modules.CollaborationCaret.configure({
			provider: collaborationConfig.provider,
			user: normalizeCollaborator(collaborationConfig.user || props.aiUser, props.aiUser),
			render: renderCollaborationCaret,
			selectionRender: renderCollaborationSelection,
		}));
	}
	extensions.push(...props.extensions.filter(Boolean));
	if (typeof props.configureExtensions === 'function') {
		const configured = props.configureExtensions(createExtensionContext(modules, extensions));
		if (Array.isArray(configured)) return configured.filter(Boolean);
	}
	return extensions;
}

/**
 * Preserves a focused text cursor when a burst of remote Yjs updates is
 * incorrectly reconstructed at the end of the document.
 *
 * Yjs normally restores a ProseMirror selection from relative positions. Some
 * mobile browsers can expose a stale DOM selection during rapid remote updates,
 * so this guard keeps a second relative bookmark and only intervenes for the
 * narrow mid-document-to-document-end failure case.
 *
 * @param {Record<string, unknown>} modules Runtime modules loaded for Tiptap.
 * @returns {unknown} Tiptap extension containing the selection guard plugin.
 */
function createCollaborationSelectionGuardExtension(modules) {
	const pluginKey = new modules.PluginKey('domDocumentEditorCollaborationSelectionGuard');
	let cursorBookmark = null;

	/**
	 * Captures the current collapsed text selection as a Yjs-relative position.
	 *
	 * @param {Record<string, unknown>} state Current ProseMirror state.
	 * @returns {void}
	 */
	function captureCursorBookmark(state) {
		const selection = state?.selection;
		if (!(selection instanceof modules.TextSelection) || !selection.empty) {
			cursorBookmark = null;
			return;
		}
		try {
			cursorBookmark = modules.createCollaborationMappablePosition(selection.head, state);
		} catch {
			cursorBookmark = null;
		}
	}

	/**
	 * Resolves the saved relative cursor against the document after a remote update.
	 *
	 * @param {Record<string, unknown>} transaction Remote collaboration transaction.
	 * @param {Record<string, unknown>} state Updated ProseMirror state.
	 * @returns {number|null} Resolved cursor position or null when unavailable.
	 */
	function resolveCursorBookmark(transaction, state) {
		if (!cursorBookmark) return null;
		try {
			const result = modules.getCollaborationUpdatedPosition(cursorBookmark, transaction, state);
			return Number.isFinite(result?.position?.position) ? result.position.position : null;
		} catch {
			return null;
		}
	}

	/**
	 * Checks whether a transaction was created by this selection guard.
	 *
	 * @param {Record<string, unknown>} transaction ProseMirror transaction.
	 * @returns {boolean} Whether the transaction already restored the cursor.
	 */
	function isSelectionRestoreTransaction(transaction) {
		return Boolean(transaction.getMeta(pluginKey)?.restored);
	}

	return modules.Extension.create({
		name: 'domDocumentEditorCollaborationSelectionGuard',

		/**
		 * Adds the ProseMirror transaction and selection tracking plugin.
		 *
		 * @returns {Array<unknown>} ProseMirror plugins.
		 */
		addProseMirrorPlugins() {
			const editorInstance = this.editor;
			return [new modules.Plugin({
				key: pluginKey,
				state: {
					/**
					 * Initializes selection-capture state.
					 *
					 * @returns {{ skipCapture: boolean }} Initial plugin state.
					 */
					init() {
						return { skipCapture: false };
					},

					/**
					 * Keeps the pre-update bookmark until a local or restored selection arrives.
					 *
					 * @param {Record<string, unknown>} transaction Applied transaction.
					 * @param {{ skipCapture: boolean }} pluginState Previous plugin state.
					 * @returns {{ skipCapture: boolean }} Next plugin state.
					 */
					apply(transaction, pluginState) {
						if (modules.isCollaborationChange(transaction)) return { skipCapture: true };
						if (transaction.getMeta(pluginKey)?.restored) return { skipCapture: false };
						if (pluginState.skipCapture && !transaction.docChanged && !transaction.selectionSet) return pluginState;
						return { skipCapture: false };
					},
				},

				/**
				 * Restores a mid-document cursor only when a remote update moved it to the end.
				 *
				 * @param {Array<Record<string, unknown>>} transactions Applied transactions.
				 * @param {Record<string, unknown>} oldState State before the transactions.
				 * @param {Record<string, unknown>} newState State after the transactions.
				 * @returns {Record<string, unknown>|null} Corrective transaction or null.
				 */
				appendTransaction(transactions, oldState, newState) {
					if (transactions.some(isSelectionRestoreTransaction)) return null;
					const remoteTransaction = transactions.find(modules.isCollaborationChange);
					if (!remoteTransaction || !cursorBookmark || !editorInstance.view.hasFocus()) return null;
					if (!(oldState.selection instanceof modules.TextSelection) || !oldState.selection.empty) return null;
					if (!(newState.selection instanceof modules.TextSelection) || !newState.selection.empty) return null;

					const oldDocumentEnd = modules.TextSelection.atEnd(oldState.doc).head;
					const newDocumentEnd = modules.TextSelection.atEnd(newState.doc).head;
					const wasAtDocumentEnd = oldState.selection.head >= oldDocumentEnd;
					const landedAtDocumentEnd = newState.selection.head >= newDocumentEnd;
					if (wasAtDocumentEnd || !landedAtDocumentEnd) return null;

					let restoredPosition = resolveCursorBookmark(remoteTransaction, newState);
					if ((restoredPosition === null || restoredPosition >= newDocumentEnd)
						&& newState.doc.content.size >= oldState.doc.content.size) {
						restoredPosition = Math.min(oldState.selection.head, newDocumentEnd - 1);
					}
					if (!Number.isFinite(restoredPosition) || restoredPosition <= 0 || restoredPosition >= newDocumentEnd) return null;

					const restoredSelection = modules.TextSelection.near(newState.doc.resolve(restoredPosition));
					if (restoredSelection.head >= newDocumentEnd || restoredSelection.eq(newState.selection)) return null;
					return newState.tr
						.setSelection(restoredSelection)
						.setMeta(pluginKey, { restored: true })
						.setMeta('addToHistory', false);
				},

				/**
				 * Captures stable local selections after ProseMirror has updated its view.
				 *
				 * @param {Record<string, unknown>} view ProseMirror editor view.
				 * @returns {{ update: (nextView: Record<string, unknown>) => void }} Plugin view hooks.
				 */
				view(view) {
					captureCursorBookmark(view.state);
					return {
						/**
						 * Refreshes the bookmark after local or corrective transactions.
						 *
						 * @param {Record<string, unknown>} nextView Updated editor view.
						 * @returns {void}
						 */
						update(nextView) {
							if (pluginKey.getState(nextView.state)?.skipCapture) return;
							captureCursorBookmark(nextView.state);
						},
					};
				},
			})];
		},
	});
}

/**
 * Creates the public context passed into extension configuration hooks.
 *
 * @param {Record<string, unknown>} modules Runtime modules loaded for Tiptap.
 * @param {Array<unknown>} extensions Default extension list.
 * @returns {Record<string, unknown>} Extension configuration context.
 */
function createExtensionContext(modules, extensions) {
	return {
		modules,
		extensions,
		props,
		helpers: createToolContext(),
	};
}

/**
 * Creates an image extension that stores media ids beside image URLs.
 *
 * @param {unknown} Image Tiptap image extension.
 * @returns {unknown} Extended image node.
 */
function createImageExtension(Image) {
	return Image.extend({
		/**
		 * Adds media-aware image attributes.
		 *
		 * @returns {Record<string, unknown>} Attribute config.
		 */
		addAttributes() {
			return {
				...this.parent?.(),
				mediaId: {
					default: null,
					parseHTML: parseMediaIdAttribute,
					renderHTML: renderMediaIdAttribute,
				},
				caption: {
					default: null,
					parseHTML: parseCaptionAttribute,
					renderHTML: renderCaptionAttribute,
				},
			};
		},

		/**
		 * Renders an image with an accessible replacement action.
		 *
		 * The node view only owns editor interaction. Applications still choose
		 * and persist media through the transport-neutral media request event.
		 *
		 * @returns {Function} Tiptap image node-view factory.
		 */
		addNodeView() {
			return imageNodeView;
		},
	});
}

/**
 * Creates an editable image node view with a hover and keyboard-focus action.
 *
 * @param {Record<string, unknown>} context Tiptap node-view context.
 * @returns {Record<string, unknown>} ProseMirror node view.
 */
function imageNodeView(context) {
	let currentNode = context.node;
	const dom = document.createElement('div');
	const image = document.createElement('img');
	const action = document.createElement('button');

	dom.className = 'dom-document-editor__image-node';
	dom.setAttribute('data-document-editor-image', '');
	dom.contentEditable = 'false';
	dom.draggable = true;
	image.draggable = false;
	action.type = 'button';
	action.className = 'dom-document-editor__image-action';
	action.textContent = 'Change';
	action.setAttribute('aria-label', 'Change image');
	action.addEventListener('mousedown', preventImageActionBlur);
	action.addEventListener('click', requestImageNodeReplacement);
	dom.append(image, action);
	syncImageNodeElement(image, currentNode.attrs);

	/**
	 * Opens the consumer-owned media picker for this image node.
	 *
	 * @param {MouseEvent} event Image action click event.
	 * @returns {void}
	 */
	function requestImageNodeReplacement(event) {
		event.preventDefault();
		event.stopPropagation();
		requestMedia({
			image: { ...currentNode.attrs },
			replaceImage: replaceImageNode,
		});
	}

	/**
	 * Replaces this image node while preserving its document position.
	 *
	 * @param {Record<string, unknown>} payload Media payload selected by the consumer.
	 * @returns {Record<string, unknown>|null} Updated image attributes, or null when stale.
	 */
	function replaceImageNode(payload = {}) {
		if (!editor.value || typeof context.getPos !== 'function') return null;
		const position = context.getPos();
		const node = editor.value.state.doc.nodeAt(position);

		if (!node || node.type.name !== 'image') return null;
		const replacement = normalizeImagePayload(payload);

		if (!replacement.src) return null;
		const attributes = {
			...node.attrs,
			...replacement,
		};
		const updated = editor.value.chain().focus().command(({ tr }) => {
			tr.setNodeMarkup(position, undefined, attributes);
			return true;
		}).run();

		if (!updated) return null;
		emit('media-update', attributes);
		emitEditorChange();
		return attributes;
	}

	return {
		dom,
		/**
		 * Refreshes the image DOM when Tiptap updates the current node.
		 *
		 * @param {Record<string, unknown>} node Updated ProseMirror node.
		 * @returns {boolean} True when the node view accepted the update.
		 */
		update(node) {
			if (node.type.name !== currentNode.type.name) return false;
			currentNode = node;
			syncImageNodeElement(image, node.attrs);
			return true;
		},
		/**
		 * Keeps button events out of ProseMirror's selection handling.
		 *
		 * @param {Event} event DOM event raised inside the node view.
		 * @returns {boolean} True when the image action owns the event.
		 */
		stopEvent(event) {
			return event.target === action || action.contains(event.target);
		},
		/**
		 * Ignores node-view DOM mutations because Tiptap owns its attributes.
		 *
		 * @returns {boolean} Always true.
		 */
		ignoreMutation() {
			return true;
		},
		/**
		 * Releases DOM event handlers when ProseMirror removes the node view.
		 *
		 * @returns {void}
		 */
		destroy() {
			action.removeEventListener('mousedown', preventImageActionBlur);
			action.removeEventListener('click', requestImageNodeReplacement);
		},
	};
}

/**
 * Keeps editor focus while a toolbar button is pressed, so the paper focus ring does not flash.
 *
 * @param {MouseEvent} event Toolbar pointer event.
 * @returns {void}
 */
function preventToolbarBlur(event) {
	if (event.target instanceof Element && event.target.closest('button')) event.preventDefault();
}

/**
 * Prevents the editor selection from moving before the media picker opens.
 *
 * @param {MouseEvent} event Image action pointer event.
 * @returns {void}
 */
function preventImageActionBlur(event) {
	event.preventDefault();
}

/**
 * Synchronizes serializable image attributes onto a node-view image element.
 *
 * @param {HTMLImageElement} image Image element rendered by the node view.
 * @param {Record<string, unknown>} attributes Current Tiptap image attributes.
 * @returns {void}
 */
function syncImageNodeElement(image, attributes = {}) {
	setOptionalElementAttribute(image, 'src', attributes.src);
	setOptionalElementAttribute(image, 'alt', attributes.alt, true);
	setOptionalElementAttribute(image, 'title', attributes.title);
	setOptionalElementAttribute(image, 'data-media-id', attributes.mediaId);
	setOptionalElementAttribute(image, 'data-caption', attributes.caption);
}

/**
 * Sets or removes one node-view DOM attribute.
 *
 * @param {HTMLElement} element Element receiving the attribute.
 * @param {string} name Attribute name.
 * @param {unknown} value Attribute value.
 * @param {boolean} preserveEmpty Whether an empty string remains meaningful.
 * @returns {void}
 */
function setOptionalElementAttribute(element, name, value, preserveEmpty = false) {
	const normalized = value === null || value === undefined ? '' : String(value);

	if (normalized || preserveEmpty) {
		element.setAttribute(name, normalized);
		return;
	}

	element.removeAttribute(name);
}

/**
 * Creates the custom video embed node used by the insert-video tool.
 *
 * @param {unknown} Node Tiptap node factory.
 * @param {Function} mergeAttributes Attribute merge helper.
 * @returns {unknown} Video embed extension.
 */
function createVideoEmbedExtension(Node, mergeAttributes) {
	return Node.create({
		name: 'videoEmbed',
		group: 'block',
		atom: true,
		draggable: true,

		/**
		 * Adds serializable video embed attributes.
		 *
		 * @returns {Record<string, unknown>} Attribute config.
		 */
		addAttributes() {
			return {
				src: { default: '' },
				title: { default: 'Embedded video' },
				provider: { default: 'video' },
			};
		},

		/**
		 * Parses persisted video embed nodes from HTML.
		 *
		 * @returns {Array<Record<string, unknown>>} Parse rules.
		 */
		parseHTML() {
			return [{ tag: 'div[data-video-embed]' }];
		},

		/**
		 * Renders a video embed node.
		 *
		 * @param {Record<string, unknown>} context Render context.
		 * @returns {Array<unknown>} Tiptap render tuple.
		 */
		renderHTML(context) {
			return renderVideoEmbedNode(context.HTMLAttributes, mergeAttributes);
		},

		/**
		 * Adds the setVideoEmbed command.
		 *
		 * @returns {Record<string, Function>} Command map.
		 */
		addCommands() {
			return {
				setVideoEmbed: insertVideoCommand(this.name),
			};
		},
	});
}

/**
 * Creates the inline AI suggestion mark.
 *
 * @param {unknown} Mark Tiptap mark factory.
 * @param {Function} mergeAttributes Attribute merge helper.
 * @returns {unknown} Suggestion mark extension.
 */
function createSuggestionMarkExtension(Mark, mergeAttributes) {
	return Mark.create({
		name: 'aiSuggestion',
		inclusive: false,

		/**
		 * Adds a suggestion id attribute.
		 *
		 * @returns {Record<string, unknown>} Attribute config.
		 */
		addAttributes() {
			return {
				id: {
					default: null,
					parseHTML: parseSuggestionIdAttribute,
					renderHTML: renderSuggestionIdAttribute,
				},
			};
		},

		/**
		 * Parses suggestion marks from persisted HTML.
		 *
		 * @returns {Array<Record<string, unknown>>} Parse rules.
		 */
		parseHTML() {
			return [{ tag: 'span[data-suggestion-id]' }];
		},

		/**
		 * Renders a suggestion mark around the original text.
		 *
		 * @param {Record<string, unknown>} context Render context.
		 * @returns {Array<unknown>} Tiptap render tuple.
		 */
		renderHTML(context) {
			return ['span', mergeAttributes(context.HTMLAttributes, { class: 'dom-document-editor__suggestion-mark' }), 0];
		},
	});
}

/**
 * Destroys the mounted editor instance.
 *
 * @returns {void}
 */
function destroyEditor() {
	editor.value?.destroy?.();
	editor.value = null;
	editorReady.value = false;
}

/**
 * Applies an external model value when the owner changes it.
 *
 * @param {Record<string, unknown>|string} value External content value.
 * @returns {void}
 */
function applyExternalModelValue(value) {
	if (!editor.value || applyingExternalContent || hasCollaboration.value) return;
	const signature = contentSignature(value);
	if (signature === lastContentSignature.value) return;
	applyingExternalContent = true;
	editor.value.commands.setContent(normalizeEditorContent(value), false);
	lastContentSignature.value = signature;
	applyingExternalContent = false;
	bumpEditorTick();
}

/**
 * Updates the Tiptap editable state.
 *
 * @returns {void}
 */
function updateEditorEditable() {
	editor.value?.setEditable?.(isEditorEditable.value);
	editor.value?.setOptions?.({
		editorProps: {
			attributes: editorDomAttributes(),
			handleKeyDown: handleEditorKeyDown,
		},
	});
}

/**
 * Builds DOM attributes for the editable ProseMirror element.
 *
 * @returns {Record<string, string>} Editor DOM attributes.
 */
function editorDomAttributes() {
	return {
		id: field.id.value,
		class: 'dom-document-editor__prosemirror',
		'aria-label': editorTitle.value,
		'aria-multiline': 'true',
		'aria-describedby': field.describedBy.value || undefined,
		'aria-invalid': field.invalid.value ? 'true' : undefined,
		'data-editable': isEditorEditable.value ? 'true' : 'false',
		'data-invalid': field.invalid.value ? '' : undefined,
		role: 'textbox',
	};
}

/**
 * Resolves CSS variables that size the editable paper surface.
 *
 * @returns {Record<string, string>} Inline style variables.
 */
function resolveEditorPaperStyle() {
	return {
		'--dom-document-editor-min-height': props.minHeight || '34rem',
	};
}

/**
 * Serializes the current model value for a native hidden form field.
 *
 * @returns {string} Native input value.
 */
function resolveHiddenInputValue() {
	const value = field.value.value;
	if (typeof value === 'string') return value;
	try {
		return JSON.stringify(value || null);
	} catch {
		return '';
	}
}

/**
 * Moves keyboard focus into the document editing canvas.
 *
 * @returns {void}
 */
function focusEditor() {
	if (!isEditorEditable.value || !editor.value) return;
	editor.value.chain().focus().run();
}

/**
 * Updates the collaboration caret user when the owner changes it.
 *
 * @returns {void}
 */
function updateCollaborationUser() {
	if (!editor.value?.commands?.updateUser || !props.collaboration?.user) return;
	editor.value.commands.updateUser(normalizeCollaborator(props.collaboration.user, props.aiUser));
}

/**
 * Handles a Tiptap content update.
 *
 * @returns {void}
 */
function handleEditorUpdate() {
	if (applyingExternalContent) return;
	bumpEditorTick();
	updateSlashMenu();
	emitEditorChange();
}

/**
 * Handles a Tiptap selection update.
 *
 * @returns {void}
 */
function handleEditorSelectionUpdate() {
	bumpEditorTick();
	updateSlashMenu();
	emit('selection-change', currentSelectionPayload());
}

/**
 * Handles editor focus and mirrors it into the form field state.
 *
 * @param {Record<string, unknown>} payload Tiptap focus payload.
 * @returns {void}
 */
function handleEditorFocus(payload) {
	field.onFocus(payload?.event || payload);
	bumpEditorTick();
}

/**
 * Handles editor blur and mirrors it into the form field state.
 *
 * @param {Record<string, unknown>} payload Tiptap blur payload.
 * @returns {void}
 */
function handleEditorBlur(payload) {
	field.onBlur(payload?.event || payload);
	bumpEditorTick();
	if (typeof window !== 'undefined') {
		window.setTimeout(closeSlashMenu, 120);
	}
}

/**
 * Increments the reactive editor tick used by toolbar state.
 *
 * @returns {void}
 */
function bumpEditorTick() {
	editorTick.value += 1;
}

/**
 * Emits the current document content payload.
 *
 * @returns {void}
 */
function emitEditorChange() {
	if (!editor.value) return;
	const payload = savePayload();
	const nextModelValue = props.output === 'html' ? payload.html : payload.json;
	lastChangePayload.value = payload;
	lastContentSignature.value = contentSignature(nextModelValue);
	field.setValue(nextModelValue);
	emit('change', payload);
}

/**
 * Returns the latest serializable editor payload.
 *
 * @returns {{ json: Record<string, unknown>|null, html: string, text: string }} Save payload.
 */
function savePayload() {
	if (!editor.value) {
		return {
			json: normalizeEditorContent(field.value.value),
			html: '',
			text: '',
		};
	}
	return {
		json: editor.value.getJSON(),
		html: editor.value.getHTML(),
		text: editor.value.getText(),
	};
}

/**
 * Requests an AI rewrite for the current selection or block.
 *
 * @param {string} instruction Optional rewrite instruction.
 * @returns {Promise<Record<string, unknown>|null>} Created suggestion or null.
 */
async function requestRewrite(instruction = rewriteInstruction.value) {
	if (!editor.value || !isEditorEditable.value || rewriteBusy.value) return null;
	const payload = currentSelectionPayload();
	rewriteBusy.value = true;
	const request = {
		...payload,
		instruction,
		author: props.aiUser,
		editor: editor.value,
		respond: createRewriteResponder(payload, instruction),
	};
	emit('rewrite-request', request);
	try {
		if (typeof props.rewriteProvider === 'function') {
			const response = await props.rewriteProvider(request);
			if (response) return createSuggestion(normalizeProviderSuggestion(response, payload, instruction));
		}
		return null;
	} finally {
		rewriteBusy.value = false;
	}
}

/**
 * Creates a callback that external rewrite handlers can use to add a suggestion.
 *
 * @param {Record<string, unknown>} selectionPayload Selection payload.
 * @param {string} instruction Rewrite instruction.
 * @returns {Function} Suggestion callback.
 */
function createRewriteResponder(selectionPayload, instruction) {
	/**
	 * Adds a rewrite suggestion from an external AI handler.
	 *
	 * @param {string|Record<string, unknown>} response Proposed text or suggestion record.
	 * @returns {Record<string, unknown>} Created suggestion.
	 */
	return function respond(response) {
		return createSuggestion(normalizeProviderSuggestion(response, selectionPayload, instruction));
	};
}

/**
 * Creates and marks a pending suggestion.
 *
 * @param {Record<string, unknown>} payload Suggestion payload.
 * @returns {Record<string, unknown>|null} Created suggestion.
 */
function createSuggestion(payload = {}) {
	if (!editor.value) return null;
	const normalized = normalizeSuggestion(payload, currentSelectionPayload());
	if (!normalized.proposed) return null;
	internalSuggestions.value = [
		...internalSuggestions.value,
		normalized,
	];
	markSuggestionRange(normalized);
	emit('suggestion-create', normalized);
	return normalized;
}

/**
 * Accepts a pending suggestion and replaces the marked range with the proposal.
 *
 * @param {Record<string, unknown>} suggestion Suggestion record.
 * @returns {void}
 */
function acceptSuggestion(suggestion) {
	if (!editor.value || !suggestion) return;
	const range = findSuggestionRange(suggestion.id) || suggestionRange(suggestion);
	if (range) {
		editor.value.chain().focus().insertContentAt(range, suggestion.proposed || '').run();
	}
	removeInternalSuggestion(suggestion.id);
	emit('suggestion-accept', suggestion);
	emitEditorChange();
}

/**
 * Rejects a pending suggestion and clears its inline mark.
 *
 * @param {Record<string, unknown>} suggestion Suggestion record.
 * @returns {void}
 */
function rejectSuggestion(suggestion) {
	if (!editor.value || !suggestion) return;
	const range = findSuggestionRange(suggestion.id) || suggestionRange(suggestion);
	if (range) {
		editor.value.chain().focus().setTextSelection(range).unsetMark('aiSuggestion').run();
	}
	removeInternalSuggestion(suggestion.id);
	emit('suggestion-reject', suggestion);
}

/**
 * Inserts an image node from a media browser or custom picker payload.
 *
 * @param {Record<string, unknown>} payload Media payload.
 * @returns {Record<string, unknown>|null} Inserted image attributes.
 */
function insertImage(payload = {}) {
	if (!editor.value) return null;
	const image = normalizeImagePayload(payload);
	if (!image.src) return null;
	editor.value.chain().focus().setImage(image).run();
	emit('media-insert', image);
	emitEditorChange();
	return image;
}

/**
 * Opens the app-owned media picker request.
 *
 * @returns {void}
 */
function requestMedia(payload = {}) {
	emit('media-request', {
		editor: editor.value,
		insertImage,
		...payload,
	});
}

/**
 * Opens the video URL dialog.
 *
 * @returns {void}
 */
function openVideoDialog() {
	videoUrl.value = '';
	videoTitle.value = '';
	videoDialogOpen.value = true;
}

/**
 * Inserts a video embed from the video dialog.
 *
 * @returns {void}
 */
function commitVideoDialog() {
	const inserted = insertVideo({
		src: videoUrl.value,
		title: videoTitle.value,
	});
	if (!inserted) return;
	videoDialogOpen.value = false;
}

/**
 * Inserts a video embed.
 *
 * @param {Record<string, unknown>} payload Video payload.
 * @returns {Record<string, unknown>|null} Inserted video attrs.
 */
function insertVideo(payload = {}) {
	if (!editor.value) return null;
	const video = normalizeVideoPayload(payload);
	if (!video.src) return null;
	editor.value.chain().focus().setVideoEmbed(video).run();
	emit('video-insert', video);
	emitEditorChange();
	return video;
}

/**
 * Inserts a default table and places the cursor in its first header cell.
 *
 * @returns {boolean} True when the table was inserted.
 */
function insertTable() {
	if (!editor.value || !isEditorEditable.value) return false;
	const inserted = editor.value
		.chain()
		.focus()
		.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
		.run();
	bumpEditorTick();
	return inserted;
}

/**
 * Opens the link editor dialog.
 *
 * @returns {void}
 */
function openLinkDialog() {
	if (!editor.value) return;
	linkUrl.value = editor.value.getAttributes('link')?.href || '';
	linkDialogOpen.value = true;
}

/**
 * Applies or clears the current link mark.
 *
 * @returns {void}
 */
function commitLinkDialog() {
	if (!editor.value) return;
	const href = String(linkUrl.value || '').trim();
	if (!href) {
		editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
		linkDialogOpen.value = false;
		return;
	}
	editor.value.chain().focus().extendMarkRange('link').setLink({ href }).run();
	linkDialogOpen.value = false;
	emitEditorChange();
}

/**
 * Runs a built-in editor command.
 *
 * @param {string} tool Tool id.
 * @returns {void}
 */
function runTool(tool) {
	if (!editor.value || !isEditorEditable.value) return;
	const chain = editor.value.chain().focus();
	if (tool === 'undo') chain.undo().run();
	else if (tool === 'redo') chain.redo().run();
	else if (tool === 'paragraph') chain.setParagraph().run();
	else if (tool === 'heading1') chain.toggleHeading({ level: 1 }).run();
	else if (tool === 'heading2') chain.toggleHeading({ level: 2 }).run();
	else if (tool === 'heading3') chain.toggleHeading({ level: 3 }).run();
	else if (tool === 'bold') chain.toggleBold().run();
	else if (tool === 'italic') chain.toggleItalic().run();
	else if (tool === 'underline') chain.toggleUnderline().run();
	else if (tool === 'bulletList') chain.toggleBulletList().run();
	else if (tool === 'orderedList') chain.toggleOrderedList().run();
	else if (tool === 'blockquote') chain.toggleBlockquote().run();
	else if (tool === 'codeBlock') chain.toggleCodeBlock().run();
	else if (tool === 'link') openLinkDialog();
	else if (tool === 'table') insertTable();
	else if (tool === 'image') requestMedia();
	else if (tool === 'video') openVideoDialog();
	else if (tool === 'rewrite') requestRewrite();
	bumpEditorTick();
}

/**
 * Updates the active code block's persisted syntax language.
 *
 * @param {string} language Selected DOM Studio language value.
 * @returns {void}
 */
function setCodeLanguage(language) {
	if (!editor.value || !isEditorEditable.value || !toolbarState.value.codeBlock) return;
	editor.value
		.chain()
		.focus()
		.updateAttributes('codeBlock', { language: codeLanguageOptionValue(language) })
		.run();
	bumpEditorTick();
}

/**
 * Runs a table command against the active table selection.
 *
 * @param {string} command Tiptap table command name.
 * @returns {void}
 */
function runTableCommand(command) {
	if (!editor.value || !isEditorEditable.value || !toolbarState.value.table) return;
	const chain = editor.value.chain().focus();
	if (command === 'addRowBefore') chain.addRowBefore().run();
	else if (command === 'addRowAfter') chain.addRowAfter().run();
	else if (command === 'deleteRow') chain.deleteRow().run();
	else if (command === 'addColumnBefore') chain.addColumnBefore().run();
	else if (command === 'addColumnAfter') chain.addColumnAfter().run();
	else if (command === 'deleteColumn') chain.deleteColumn().run();
	else if (command === 'toggleHeaderRow') chain.toggleHeaderRow().run();
	else if (command === 'deleteTable') chain.deleteTable().run();
	bumpEditorTick();
}

/**
 * Checks whether a table command can run for the current cell selection.
 *
 * @param {string} command Tiptap table command name.
 * @returns {boolean} True when the command is currently available.
 */
function canRunTableCommand(command) {
	if (!editor.value || !isEditorEditable.value || !toolbarState.value.table) return false;
	const commands = editor.value.can?.();
	const commandHandler = commands?.[command];
	return typeof commandHandler === 'function' && Boolean(commandHandler.call(commands));
}

/**
 * Invokes a custom toolbar tool.
 *
 * @param {Record<string, unknown>} tool Custom tool config.
 * @returns {void}
 */
function runCustomTool(tool) {
	if (!tool) return;
	if (typeof tool.command === 'function') {
		tool.command(createToolContext(tool));
	}
	emit('tool-action', { tool, editor: editor.value });
}

/**
 * Creates the helper context supplied to custom toolbar tools and extension hooks.
 *
 * @param {Record<string, unknown>|null} tool Custom tool config.
 * @returns {Record<string, unknown>} Tool helper context.
 */
function createToolContext(tool = null) {
	return {
		tool,
		editor: editor.value,
		selection: currentSelectionPayload(),
		insertImage,
		insertVideo,
		insertTable,
		requestRewrite,
		createSuggestion,
		savePayload,
		runTool,
	};
}

/**
 * Returns whether a built-in tool should be visible.
 *
 * @param {string} tool Tool id.
 * @returns {boolean} True when visible.
 */
function showTool(tool) {
	return enabledToolSet.value.has(tool);
}

/**
 * Returns whether a toolbar tool is active.
 *
 * @param {string} tool Tool id.
 * @returns {boolean} True when active.
 */
function toolActive(tool) {
	return Boolean(toolbarState.value[tool]);
}

/**
 * Returns whether the current key event should open the slash command menu.
 *
 * @param {KeyboardEvent} event Keyboard event from ProseMirror.
 * @returns {boolean} True when slash commands should take over the key.
 */
function shouldOpenSlashMenuFromKey(event) {
	if (!props.showSlashMenu || !isEditorEditable.value || !editor.value) return false;
	if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return false;
	const selection = editor.value.state?.selection;
	if (!selection?.empty) return false;
	const cursor = selection.$from;
	if (!cursor.parent?.isTextblock) return false;
	const blockText = cursor.parent.textBetween(0, cursor.parentOffset, '\n', '\ufffc');
	return !blockText.trim();
}

/**
 * Inserts the slash trigger and opens the block command menu from its range.
 *
 * @returns {boolean} True when the slash menu opened.
 */
function openSlashMenuFromKey() {
	if (!editor.value) return false;
	const from = editor.value.state.selection.from;
	editor.value.chain().focus().insertContent('/').run();
	slashMenuRange.value = { from, to: from + 1 };
	slashMenuQuery.value = '';
	slashMenuIndex.value = 0;
	slashMenuOpen.value = slashMenuOptions.value.length > 0;
	positionSlashMenu(from + 1);
	return true;
}

/**
 * Handles keyboard control while the slash command menu is open.
 *
 * @param {unknown} view ProseMirror editor view.
 * @param {KeyboardEvent} event Keyboard event from ProseMirror.
 * @returns {boolean} True when the editor should stop handling the key.
 */
function handleEditorKeyDown(view, event) {
	if (shouldOpenSlashMenuFromKey(event) && slashMenuOptions.value.length) {
		event.preventDefault();
		return openSlashMenuFromKey();
	}
	if (!slashMenuOpen.value) return false;
	if (event.key === 'ArrowDown') {
		event.preventDefault();
		moveSlashMenuSelection(1);
		return true;
	}
	if (event.key === 'ArrowUp') {
		event.preventDefault();
		moveSlashMenuSelection(-1);
		return true;
	}
	if (event.key === 'Enter' || event.key === 'Tab') {
		event.preventDefault();
		applySlashMenuOption(slashMenuOptions.value[slashMenuIndex.value]);
		return true;
	}
	if (event.key === 'Escape') {
		event.preventDefault();
		closeSlashMenu();
		return true;
	}
	return false;
}

/**
 * Resolves slash menu block options from the enabled tool list and query.
 *
 * @returns {Array<Record<string, unknown>>} Matching slash menu options.
 */
function resolveSlashMenuOptions() {
	if (!props.showSlashMenu) return [];
	const query = slashMenuQuery.value.trim().toLowerCase();
	return slashBlockOptions
		.filter((option) => !option.tool || showTool(option.tool))
		.filter((option) => {
			if (!query) return true;
			return `${option.label} ${option.description}`.toLowerCase().includes(query);
		});
}

/**
 * Keeps the selected slash menu index inside the available option range.
 *
 * @returns {void}
 */
function syncSlashMenuIndex() {
	if (!slashMenuOptions.value.length) {
		slashMenuIndex.value = 0;
		return;
	}
	slashMenuIndex.value = Math.min(slashMenuIndex.value, slashMenuOptions.value.length - 1);
	scrollActiveSlashMenuOptionIntoView();
}

/**
 * Moves the highlighted slash command option.
 *
 * @param {number} delta Index movement direction.
 * @returns {void}
 */
function moveSlashMenuSelection(delta) {
	const count = slashMenuOptions.value.length;
	if (!count) return;
	slashMenuIndex.value = (slashMenuIndex.value + delta + count) % count;
	scrollActiveSlashMenuOptionIntoView();
}

/**
 * Keeps the highlighted slash command visible inside the scrollable menu panel.
 *
 * @returns {void}
 */
function scrollActiveSlashMenuOptionIntoView() {
	nextTick(() => {
		const menu = slashMenuPanel.value;
		const option = menu?.querySelector?.('[aria-selected="true"]');
		if (!menu || !option) return;
		const menuRect = menu.getBoundingClientRect();
		const optionRect = option.getBoundingClientRect();
		const edgeInset = 4;
		if (optionRect.top < menuRect.top + edgeInset) {
			menu.scrollTop += optionRect.top - menuRect.top - edgeInset;
		} else if (optionRect.bottom > menuRect.bottom - edgeInset) {
			menu.scrollTop += optionRect.bottom - menuRect.bottom + edgeInset;
		}
	});
}

/**
 * Updates slash menu visibility from the current selection.
 *
 * @returns {void}
 */
function updateSlashMenu() {
	if (!props.showSlashMenu || !isEditorEditable.value || !editor.value) {
		closeSlashMenu();
		return;
	}
	const match = currentSlashMatch();
	if (!match) {
		closeSlashMenu();
		return;
	}
	slashMenuRange.value = { from: match.from, to: match.to };
	slashMenuQuery.value = match.query;
	slashMenuOpen.value = slashMenuOptions.value.length > 0;
	positionSlashMenu(match.to);
}

/**
 * Returns the active slash-command query when the cursor is after a block-start slash.
 *
 * @returns {{ from: number, to: number, query: string }|null} Slash match.
 */
function currentSlashMatch() {
	const instance = editor.value;
	if (!instance?.state?.selection?.empty) return null;
	const selection = instance.state.selection;
	const cursor = selection.$from;
	if (!cursor.parent?.isTextblock) return null;
	const blockText = cursor.parent.textBetween(0, cursor.parentOffset, '\n', '\ufffc');
	const slashIndex = blockText.lastIndexOf('/');
	if (slashIndex < 0) return null;
	const beforeSlash = blockText.slice(0, slashIndex);
	if (beforeSlash.trim()) return null;
	const query = blockText.slice(slashIndex + 1);
	if (query.includes('/') || query.length > 32) return null;
	const from = cursor.start() + slashIndex;
	return {
		from,
		to: selection.from,
		query,
	};
}

/**
 * Positions the slash menu near the current cursor coordinates.
 *
 * @param {number} pos Editor document position.
 * @returns {void}
 */
function positionSlashMenu(pos) {
	if (typeof window === 'undefined') return;
	if (slashMenuFrame) window.cancelAnimationFrame(slashMenuFrame);
	slashMenuFrame = window.requestAnimationFrame(() => {
		const shellRect = editorShell.value?.getBoundingClientRect?.();
		const coords = editor.value?.view?.coordsAtPos?.(pos);
		if (!shellRect || !coords) return;
		const menuWidth = 260;
		const left = Math.max(8, Math.min(coords.left - shellRect.left, shellRect.width - menuWidth - 8));
		const top = Math.max(8, coords.bottom - shellRect.top + 6);
		slashMenuStyle.value = {
			left: `${left}px`,
			top: `${top}px`,
		};
	});
}

/**
 * Applies a selected slash menu block option.
 *
 * @param {Record<string, unknown>} option Slash command option.
 * @returns {void}
 */
function applySlashMenuOption(option) {
	if (!option || !editor.value || !isEditorEditable.value) return;
	const range = slashMenuRange.value;
	if (option.id === 'image' || option.id === 'video' || option.id === 'table') {
		deleteSlashRange();
		closeSlashMenu();
		if (option.id === 'image') requestMedia();
		else if (option.id === 'video') openVideoDialog();
		else insertTable();
		return;
	}
	const chain = editor.value.chain().focus();
	if (range) chain.deleteRange(range);
	if (option.id === 'paragraph') chain.setParagraph().run();
	else if (option.id === 'heading1') chain.setNode('heading', { level: 1 }).run();
	else if (option.id === 'heading2') chain.setNode('heading', { level: 2 }).run();
	else if (option.id === 'heading3') chain.setNode('heading', { level: 3 }).run();
	else if (option.id === 'bulletList') chain.toggleBulletList().run();
	else if (option.id === 'orderedList') chain.toggleOrderedList().run();
	else if (option.id === 'blockquote') chain.toggleBlockquote().run();
	else if (option.id === 'codeBlock') chain.setCodeBlock({ language: 'txt' }).run();
	closeSlashMenu();
	bumpEditorTick();
}

/**
 * Deletes the active slash trigger range.
 *
 * @returns {void}
 */
function deleteSlashRange() {
	if (!editor.value || !slashMenuRange.value) return;
	editor.value.chain().focus().deleteRange(slashMenuRange.value).run();
}

/**
 * Closes the slash command menu and clears its query state.
 *
 * @returns {void}
 */
function closeSlashMenu() {
	slashMenuOpen.value = false;
	slashMenuQuery.value = '';
	slashMenuRange.value = null;
}

/**
 * Returns the payload for the current selection, falling back to the active block.
 *
 * @returns {Record<string, unknown>} Selection payload.
 */
function currentSelectionPayload() {
	if (!editor.value) {
		return {
			from: 0,
			to: 0,
			empty: true,
			selectedText: '',
			selectedJson: null,
		};
	}
	const range = selectedRangeOrCurrentBlock(editor.value);
	const selectedText = editor.value.state.doc.textBetween(range.from, range.to, '\n\n');
	return {
		from: range.from,
		to: range.to,
		empty: range.empty,
		selectedText,
		selectedJson: selectedJsonForRange(editor.value, range),
	};
}

/**
 * Returns the selected range or the current text block range.
 *
 * @param {Record<string, unknown>} instance Tiptap editor instance.
 * @returns {{ from: number, to: number, empty: boolean }} Editor range.
 */
function selectedRangeOrCurrentBlock(instance) {
	const selection = instance.state.selection;
	if (!selection.empty) {
		return {
			from: selection.from,
			to: selection.to,
			empty: false,
		};
	}
	const depth = selection.$from.depth;
	if (depth > 0) {
		return {
			from: selection.$from.start(depth),
			to: selection.$from.end(depth),
			empty: true,
		};
	}
	return {
		from: selection.from,
		to: selection.to,
		empty: true,
	};
}

/**
 * Serializes the selected slice for AI request context.
 *
 * @param {Record<string, unknown>} instance Tiptap editor instance.
 * @param {{ from: number, to: number }} range Editor range.
 * @returns {Record<string, unknown>|null} JSON slice.
 */
function selectedJsonForRange(instance, range) {
	try {
		return {
			type: 'slice',
			content: instance.state.doc.slice(range.from, range.to).content.toJSON(),
		};
	} catch {
		return null;
	}
}

/**
 * Adds the suggestion mark to the original editor range.
 *
 * @param {Record<string, unknown>} suggestion Suggestion record.
 * @returns {void}
 */
function markSuggestionRange(suggestion) {
	const range = suggestionRange(suggestion);
	if (!editor.value || !range || range.from === range.to) return;
	editor.value.chain().focus().setTextSelection(range).setMark('aiSuggestion', { id: suggestion.id }).run();
}

/**
 * Finds the current editor range for a suggestion mark.
 *
 * @param {string} suggestionId Suggestion id.
 * @returns {{ from: number, to: number }|null} Current marked range.
 */
function findSuggestionRange(suggestionId) {
	if (!editor.value || !suggestionId) return null;
	let from = null;
	let to = null;
	editor.value.state.doc.descendants((node, pos) => {
		if (!node.isText) return true;
		const hasMark = node.marks.some((mark) => mark.type.name === 'aiSuggestion' && mark.attrs.id === suggestionId);
		if (!hasMark) return true;
		if (from === null) from = pos;
		to = pos + node.nodeSize;
		return true;
	});
	return from === null ? null : { from, to };
}

/**
 * Returns a suggestion's stored range.
 *
 * @param {Record<string, unknown>} suggestion Suggestion record.
 * @returns {{ from: number, to: number }|null} Stored range.
 */
function suggestionRange(suggestion) {
	const from = Number(suggestion?.from);
	const to = Number(suggestion?.to);
	if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to < from) return null;
	return { from, to };
}

/**
 * Removes an internal suggestion by id.
 *
 * @param {string} suggestionId Suggestion id.
 * @returns {void}
 */
function removeInternalSuggestion(suggestionId) {
	internalSuggestions.value = internalSuggestions.value.filter((suggestion) => suggestion.id !== suggestionId);
}

/**
 * Normalizes editor content for Tiptap.
 *
 * @param {Record<string, unknown>|string} value Editor content value.
 * @returns {Record<string, unknown>|string} Tiptap content.
 */
function normalizeEditorContent(value) {
	if (!value) return createDefaultDocumentContent();
	if (typeof value === 'string') return value;
	if (value.type === 'doc') return value;
	return createDefaultDocumentContent();
}

/**
 * Normalizes a provider response into a suggestion payload.
 *
 * @param {string|Record<string, unknown>} response Rewrite provider response.
 * @param {Record<string, unknown>} selectionPayload Selection payload.
 * @param {string} instruction Rewrite instruction.
 * @returns {Record<string, unknown>} Suggestion payload.
 */
function normalizeProviderSuggestion(response, selectionPayload, instruction = '') {
	if (typeof response === 'string') {
		return {
			...selectionPayload,
			instruction,
			proposed: response,
		};
	}
	return {
		...selectionPayload,
		...(response || {}),
		instruction: response?.instruction || instruction,
		proposed: response?.proposed || response?.text || '',
	};
}

/**
 * Normalizes a suggestion record.
 *
 * @param {Record<string, unknown>} payload Suggestion payload.
 * @param {Record<string, unknown>} fallback Selection fallback.
 * @returns {Record<string, unknown>} Normalized suggestion.
 */
function normalizeSuggestion(payload = {}, fallback = {}) {
	suggestionCounter += 1;
	return {
		id: String(payload.id || `sug_local_${Date.now()}_${suggestionCounter}`),
		type: payload.type || 'replace',
		from: Number.isFinite(Number(payload.from)) ? Number(payload.from) : Number(fallback.from || 0),
		to: Number.isFinite(Number(payload.to)) ? Number(payload.to) : Number(fallback.to || 0),
		original: String(payload.original || payload.selectedText || fallback.selectedText || ''),
		proposed: String(payload.proposed || payload.text || ''),
		instruction: String(payload.instruction || ''),
		author: normalizeCollaborator(payload.author || props.aiUser, props.aiUser),
		createdAt: payload.createdAt || new Date().toISOString(),
		status: payload.status || 'pending',
	};
}

/**
 * Normalizes an externally supplied suggestion without mutating it.
 *
 * @param {Record<string, unknown>} suggestion Suggestion record.
 * @returns {Record<string, unknown>} Normalized suggestion.
 */
function normalizeExternalSuggestion(suggestion = {}) {
	return {
		...suggestion,
		id: String(suggestion.id || `external_${suggestionCounter}`),
		original: String(suggestion.original || ''),
		proposed: String(suggestion.proposed || ''),
		author: normalizeCollaborator(suggestion.author || props.aiUser, props.aiUser),
	};
}

/**
 * Normalizes a media picker payload into image node attrs.
 *
 * @param {Record<string, unknown>} payload Media payload.
 * @returns {Record<string, unknown>} Image attrs.
 */
function normalizeImagePayload(payload = {}) {
	const file = payload.file || payload.item?.file || payload.media?.file || {};
	const item = payload.item || payload.media || payload;
	const src = payload.src || payload.url || file.publicUrl || file.previewUrl || file.thumbnailUrl || item.publicUrl || item.thumbnailUrl || '';
	const alt = payload.alt || file.meta?.alt || item.alt || item.name || file.name || '';
	return {
		src,
		alt,
		title: payload.title || item.name || file.name || '',
		mediaId: payload.mediaId || item.ulid || item.id || '',
		caption: payload.caption || '',
	};
}

/**
 * Normalizes a video URL payload for the video embed node.
 *
 * @param {Record<string, unknown>} payload Video payload.
 * @returns {Record<string, unknown>} Video attrs.
 */
function normalizeVideoPayload(payload = {}) {
	const src = normalizeVideoUrl(payload.src || payload.url || '');
	return {
		src,
		title: payload.title || 'Embedded video',
		provider: payload.provider || videoProviderFromUrl(src),
	};
}

/**
 * Converts common video page URLs to embeddable URLs.
 *
 * @param {string} value Video URL.
 * @returns {string} Embed URL.
 */
function normalizeVideoUrl(value) {
	const url = String(value || '').trim();
	const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
	if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
	const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
	if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
	return url;
}

/**
 * Infers a video provider key from a URL.
 *
 * @param {string} url Video URL.
 * @returns {string} Provider key.
 */
function videoProviderFromUrl(url) {
	if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
	if (/vimeo\.com/i.test(url)) return 'vimeo';
	return 'video';
}

/**
 * Builds a stable signature for editor content comparisons.
 *
 * @param {unknown} value Content value.
 * @returns {string} Serialized signature.
 */
function contentSignature(value) {
	try {
		return JSON.stringify(value || null);
	} catch {
		return String(value || '');
	}
}

/**
 * Returns a Yjs document from a collaboration config.
 *
 * @param {Record<string, unknown>|null} config Collaboration config.
 * @returns {unknown|null} Yjs document or null.
 */
function collaborationDocument(config) {
	return config?.document || config?.doc || null;
}

/**
 * Normalizes collaborators for header display.
 *
 * @param {Array<Record<string, unknown>>} collaborators Explicit collaborators.
 * @param {Record<string, unknown>|null} collaborationConfig Collaboration config.
 * @returns {Array<Record<string, unknown>>} Display collaborators.
 */
function normalizeCollaborators(collaborators, collaborationConfig) {
	const records = [...(Array.isArray(collaborators) ? collaborators : [])];
	if (collaborationConfig?.user) records.unshift(collaborationConfig.user);
	return records.map((collaborator) => normalizeCollaborator(collaborator, props.aiUser));
}

/**
 * Normalizes one collaborator record.
 *
 * @param {Record<string, unknown>} collaborator Collaborator metadata.
 * @param {Record<string, unknown>} fallback Fallback collaborator.
 * @returns {Record<string, unknown>} Normalized collaborator.
 */
function normalizeCollaborator(collaborator = {}, fallback = {}) {
	return {
		id: String(collaborator.id || fallback.id || 'user'),
		name: String(collaborator.name || fallback.name || 'User'),
		color: String(collaborator.color || fallback.color || '#2563eb'),
		type: String(collaborator.type || fallback.type || 'human'),
	};
}

/**
 * Renders a collaboration caret element for Tiptap.
 *
 * @param {Record<string, unknown>} user User metadata.
 * @returns {HTMLElement} Caret element.
 */
function renderCollaborationCaret(user) {
	const cursor = document.createElement('span');
	cursor.className = 'dom-document-editor__collaboration-caret';
	cursor.style.borderColor = user.color || '#2563eb';
	const label = document.createElement('span');
	label.className = 'dom-document-editor__collaboration-label';
	label.style.backgroundColor = user.color || '#2563eb';
	label.textContent = user.name || 'User';
	cursor.appendChild(label);
	return cursor;
}

/**
 * Renders collaboration selection decoration attrs for Tiptap.
 *
 * @param {Record<string, unknown>} user User metadata.
 * @returns {Record<string, string>} Selection decoration attrs.
 */
function renderCollaborationSelection(user) {
	return {
		nodeName: 'span',
		class: 'dom-document-editor__collaboration-selection',
		style: `background-color: ${user.color || '#2563eb'}33`,
		'data-user': user.name || 'User',
	};
}

/**
 * Parses a media id from an image element.
 *
 * @param {HTMLElement} element HTML element.
 * @returns {string|null} Media id.
 */
function parseMediaIdAttribute(element) {
	return element.getAttribute('data-media-id');
}

/**
 * Renders a media id attribute.
 *
 * @param {Record<string, unknown>} attrs Image attributes.
 * @returns {Record<string, string>} HTML attrs.
 */
function renderMediaIdAttribute(attrs) {
	return attrs.mediaId ? { 'data-media-id': attrs.mediaId } : {};
}

/**
 * Parses an image caption from an element.
 *
 * @param {HTMLElement} element HTML element.
 * @returns {string|null} Caption.
 */
function parseCaptionAttribute(element) {
	return element.getAttribute('data-caption');
}

/**
 * Renders an image caption attribute.
 *
 * @param {Record<string, unknown>} attrs Image attributes.
 * @returns {Record<string, string>} HTML attrs.
 */
function renderCaptionAttribute(attrs) {
	return attrs.caption ? { 'data-caption': attrs.caption } : {};
}

/**
 * Parses a suggestion id from a mark element.
 *
 * @param {HTMLElement} element HTML element.
 * @returns {string|null} Suggestion id.
 */
function parseSuggestionIdAttribute(element) {
	return element.getAttribute('data-suggestion-id');
}

/**
 * Renders a suggestion id attribute.
 *
 * @param {Record<string, unknown>} attrs Suggestion attrs.
 * @returns {Record<string, string>} HTML attrs.
 */
function renderSuggestionIdAttribute(attrs) {
	return attrs.id ? { 'data-suggestion-id': attrs.id } : {};
}

/**
 * Renders the video embed node tuple.
 *
 * @param {Record<string, unknown>} attrs Video attrs.
 * @param {Function} mergeAttributes Attribute merge helper.
 * @returns {Array<unknown>} Render tuple.
 */
function renderVideoEmbedNode(attrs, mergeAttributes) {
	const src = String(attrs.src || '');
	const title = String(attrs.title || 'Embedded video');
	return [
		'div',
		mergeAttributes(attrs, {
			'data-video-embed': '',
			class: 'dom-document-editor__video-node',
		}),
		[
			'iframe',
			{
				src,
				title,
				allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
				allowfullscreen: 'true',
			},
		],
	];
}

/**
 * Creates the Tiptap command factory for video insertion.
 *
 * @param {string} nodeName Video node name.
 * @returns {Function} Command factory.
 */
function insertVideoCommand(nodeName) {
	/**
	 * Builds a command that inserts a video node.
	 *
	 * @param {Record<string, unknown>} attrs Video attrs.
	 * @returns {Function} Tiptap command.
	 */
	return function setVideoEmbed(attrs) {
		/**
		 * Inserts the configured video node through Tiptap commands.
		 *
		 * @param {Record<string, unknown>} context Command context.
		 * @returns {boolean} Whether insertion succeeded.
		 */
		return function executeVideoCommand(context) {
			return context.commands.insertContent({
				type: nodeName,
				attrs,
			});
		};
	};
}
</script>

<template>
	<DomField v-bind="field.fieldAttrs.value" :chrome="fieldChrome">
		<section
			ref="editorShell"
			:class="editorClasses"
			:aria-label="editorTitle"
			:data-invalid="field.invalid.value ? '' : undefined"
		>
			<input
				v-if="props.name && field.htmlName.value"
				type="hidden"
				:name="field.htmlName.value"
				:value="hiddenInputValue"
			/>

			<header v-if="hasDocumentChrome" class="flex flex-wrap items-center gap-3 border-b border-border bg-secondary/35 px-3 py-2">
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-semibold text-canvas-fg">{{ editorTitle }}</p>
					<p class="truncate text-xs text-muted-fg">{{ statusLabel }}</p>
				</div>
				<div v-if="visibleCollaborators.length" class="flex items-center -space-x-2" aria-label="Collaborators">
					<span
						v-for="collaborator in visibleCollaborators"
						:key="collaborator.id"
						class="grid size-8 place-items-center rounded-full border-2 border-canvas text-[11px] font-semibold text-white shadow-sm"
						:style="{ backgroundColor: collaborator.color }"
						:title="collaborator.name"
					>
						{{ collaborator.name.slice(0, 2).toUpperCase() }}
					</span>
				</div>
				<DomBadge :label="hasCollaboration ? 'Yjs ready' : 'Client only'" tone="info" variant="soft" size="sm" />
			</header>

			<div v-if="showToolbar" data-document-editor-toolbar :class="toolbarClasses" @mousedown="preventToolbarBlur">
				<DomToolbar label="Document editor toolbar" skin="flat" control-size="sm" control-radius="md" class="w-full">
					<slot name="toolbar-start" :editor="editor" :active="toolbarState" />
					<div v-if="showTool('undo') || showTool('redo')" class="flex items-center gap-1 border-r border-border pr-1">
						<DomIconButton v-if="showTool('undo')" label="Undo" size="sm" :icon="toolIcons.undo" :disabled="!canUseEditor" @click="runTool('undo')" />
						<DomIconButton v-if="showTool('redo')" label="Redo" size="sm" :icon="toolIcons.redo" :disabled="!canUseEditor" @click="runTool('redo')" />
					</div>
					<div class="flex items-center gap-1 border-r border-border pr-1">
						<DomIconButton v-if="showTool('paragraph')" label="Paragraph" size="sm" :icon="toolIcons.paragraph" :active="toolActive('paragraph')" :disabled="!canUseEditor" @click="runTool('paragraph')" />
						<DomIconButton v-if="showTool('heading1')" label="Heading 1" size="sm" :icon="toolIcons.heading1" :active="toolActive('heading1')" :disabled="!canUseEditor" @click="runTool('heading1')" />
						<DomIconButton v-if="showTool('heading2')" label="Heading 2" size="sm" :icon="toolIcons.heading2" :active="toolActive('heading2')" :disabled="!canUseEditor" @click="runTool('heading2')" />
						<DomIconButton v-if="showTool('heading3')" label="Heading 3" size="sm" :icon="toolIcons.heading3" :active="toolActive('heading3')" :disabled="!canUseEditor" @click="runTool('heading3')" />
					</div>
					<div class="flex items-center gap-1 border-r border-border pr-1">
						<DomIconButton v-if="showTool('bold')" label="Bold" size="sm" :icon="toolIcons.bold" :active="toolActive('bold')" :disabled="!canUseEditor" @click="runTool('bold')" />
						<DomIconButton v-if="showTool('italic')" label="Italic" size="sm" :icon="toolIcons.italic" :active="toolActive('italic')" :disabled="!canUseEditor" @click="runTool('italic')" />
						<DomIconButton v-if="showTool('underline')" label="Underline" size="sm" :icon="toolIcons.underline" :active="toolActive('underline')" :disabled="!canUseEditor" @click="runTool('underline')" />
					</div>
					<div class="flex items-center gap-1 border-r border-border pr-1">
						<DomIconButton v-if="showTool('bulletList')" label="Bullet list" size="sm" :icon="toolIcons.bulletList" :active="toolActive('bulletList')" :disabled="!canUseEditor" @click="runTool('bulletList')" />
						<DomIconButton v-if="showTool('orderedList')" label="Ordered list" size="sm" :icon="toolIcons.orderedList" :active="toolActive('orderedList')" :disabled="!canUseEditor" @click="runTool('orderedList')" />
						<DomIconButton v-if="showTool('blockquote')" label="Quote" size="sm" :icon="toolIcons.blockquote" :active="toolActive('blockquote')" :disabled="!canUseEditor" @click="runTool('blockquote')" />
						<DomIconButton v-if="showTool('codeBlock')" label="Code block" size="sm" :icon="toolIcons.codeBlock" :active="toolActive('codeBlock')" :disabled="!canUseEditor" @click="runTool('codeBlock')" />
					</div>
					<div class="flex items-center gap-1 border-r border-border pr-1">
						<DomIconButton v-if="showTool('link')" label="Link" size="sm" :icon="toolIcons.link" :active="toolActive('link')" :disabled="!canUseEditor" @click="runTool('link')" />
						<DomIconButton v-if="showTool('table')" label="Insert table" size="sm" :icon="toolIcons.table" :disabled="!canUseEditor" @click="runTool('table')" />
						<DomIconButton v-if="showTool('image')" label="Insert image" size="sm" :icon="toolIcons.image" :disabled="!canUseEditor" @click="runTool('image')" />
						<DomIconButton v-if="showTool('video')" label="Embed video" size="sm" :icon="toolIcons.video" :disabled="!canUseEditor" @click="runTool('video')" />
					</div>
					<DomIconButton v-if="showTool('rewrite')" label="Rewrite selection" size="sm" variant="primary" :icon="toolIcons.rewrite" :loading="rewriteBusy" :disabled="!canUseEditor" @click="runTool('rewrite')" />
					<DomIconButton
						v-for="tool in customToolbarTools"
						:key="tool.id"
						:label="tool.label"
						size="sm"
						:variant="tool.variant || 'ghost'"
						:icon="tool.icon || 'M12 5v14M5 12h14'"
						:disabled="!canUseEditor || tool.disabled"
						@click="runCustomTool(tool)"
					/>
					<slot name="toolbar-end" :editor="editor" :active="toolbarState" />
				</DomToolbar>
			</div>

			<div v-if="tableControlsVisible" class="border-b border-border bg-secondary/25 px-2 py-1.5">
				<DomToolbar label="Selected table controls" skin="flat" control-size="sm" control-radius="md" class="w-full">
					<span class="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Table</span>
					<div class="flex flex-wrap items-center gap-1 border-l border-border pl-1">
						<DomButton type="button" size="sm" variant="ghost" :disabled="!canRunTableCommand('addRowBefore')" @mousedown.prevent @click="runTableCommand('addRowBefore')">Row before</DomButton>
						<DomButton type="button" size="sm" variant="ghost" :disabled="!canRunTableCommand('addRowAfter')" @mousedown.prevent @click="runTableCommand('addRowAfter')">Row after</DomButton>
						<DomButton type="button" size="sm" variant="ghost" :disabled="!canRunTableCommand('deleteRow')" @mousedown.prevent @click="runTableCommand('deleteRow')">Delete row</DomButton>
					</div>
					<div class="flex flex-wrap items-center gap-1 border-l border-border pl-1">
						<DomButton type="button" size="sm" variant="ghost" :disabled="!canRunTableCommand('addColumnBefore')" @mousedown.prevent @click="runTableCommand('addColumnBefore')">Column before</DomButton>
						<DomButton type="button" size="sm" variant="ghost" :disabled="!canRunTableCommand('addColumnAfter')" @mousedown.prevent @click="runTableCommand('addColumnAfter')">Column after</DomButton>
						<DomButton type="button" size="sm" variant="ghost" :disabled="!canRunTableCommand('deleteColumn')" @mousedown.prevent @click="runTableCommand('deleteColumn')">Delete column</DomButton>
					</div>
					<DomButton type="button" size="sm" variant="secondary" :disabled="!canRunTableCommand('toggleHeaderRow')" :aria-pressed="toolbarState.tableHeader ? 'true' : 'false'" @mousedown.prevent @click="runTableCommand('toggleHeaderRow')">
						{{ toolbarState.tableHeader ? 'Remove header row' : 'Make header row' }}
					</DomButton>
					<DomButton type="button" size="sm" variant="danger" :disabled="!canRunTableCommand('deleteTable')" @mousedown.prevent @click="runTableCommand('deleteTable')">Delete table</DomButton>
				</DomToolbar>
			</div>

			<div v-if="codeBlockControlsVisible" class="border-b border-border bg-secondary/25 px-2 py-1.5">
				<DomToolbar label="Selected code block controls" skin="flat" control-size="sm" control-radius="md" class="w-full">
					<label :for="codeLanguageInputId" class="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Language</label>
					<div class="w-44 [&_select]:!h-8 [&_select]:!py-1 [&_select]:text-xs">
						<DomNativeSelect
							:id="codeLanguageInputId"
							:model-value="toolbarState.codeLanguage"
							:options="documentEditorCodeLanguages"
							:chrome="false"
							placeholder=""
							@update:model-value="setCodeLanguage"
						/>
					</div>
				</DomToolbar>
			</div>

			<div
				class="dom-document-editor__body"
				:class="{ 'dom-document-editor__body--rail': showSuggestionRail }"
				:style="editorPaperStyle"
			>
				<div class="min-w-0" :class="hasFieldChrome ? 'bg-transparent' : 'bg-canvas'">
					<div v-if="runtimeError" class="m-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
						{{ runtimeError }}
					</div>
					<div v-else-if="!editorReady" class="m-4 rounded-lg border border-border bg-secondary/35 p-6 text-sm text-muted-fg">
						{{ editorLoading ? 'Loading the client editor runtime...' : 'The editor mounts in the browser.' }}
					</div>
					<div
						v-else
						:class="paperClasses"
						:style="editorPaperStyle"
						@click="focusEditor"
					>
						<component
							:is="editorContentComponent"
							:editor="editor"
							class="dom-document-editor__content"
						/>
					</div>
				</div>

				<aside v-if="showSuggestionRail" class="border-t border-border bg-secondary/30 p-3 lg:border-l lg:border-t-0">
					<div class="space-y-3">
						<div>
							<p class="text-xs font-semibold uppercase text-muted-fg">AI rewrite</p>
							<textarea
								v-model="rewriteInstruction"
								rows="3"
								class="skin-input mt-2 min-h-20 w-full resize-y text-sm"
								placeholder="Make it shorter, clearer, more formal..."
							></textarea>
							<DomButton class="mt-2 w-full justify-center" size="sm" variant="primary" :loading="rewriteBusy" :disabled="!canUseEditor" @click="requestRewrite()">
								Rewrite selection
							</DomButton>
						</div>

						<div class="border-t border-border pt-3">
							<div class="flex items-center justify-between gap-3">
								<p class="text-xs font-semibold uppercase text-muted-fg">Suggestions</p>
								<DomBadge :label="String(suggestionCards.length)" size="sm" />
							</div>
							<div v-if="hasSuggestions" class="mt-3 space-y-3">
								<article
									v-for="suggestion in suggestionCards"
									:key="suggestion.id"
									class="rounded-lg border border-border bg-canvas p-3 shadow-sm"
								>
									<slot name="suggestion" :suggestion="suggestion" :accept="acceptSuggestion" :reject="rejectSuggestion">
										<div class="flex items-start justify-between gap-2">
											<div class="min-w-0">
												<p class="truncate text-sm font-semibold text-canvas-fg">{{ suggestion.author.name }}</p>
												<p class="mt-0.5 text-xs text-muted-fg">{{ suggestion.instruction || 'Rewrite suggestion' }}</p>
											</div>
											<DomBadge label="Diff" tone="primary" size="sm" />
										</div>
										<DomTextDiff
											class="mt-3"
											:original="suggestion.original"
											:proposed="suggestion.proposed"
											original-label="Current"
											proposed-label="Replacement"
										/>
										<div class="mt-3 flex items-center justify-end gap-2">
											<DomButton size="sm" variant="secondary" @click="rejectSuggestion(suggestion)">Reject</DomButton>
											<DomButton size="sm" variant="primary" @click="acceptSuggestion(suggestion)">Accept</DomButton>
										</div>
									</slot>
								</article>
							</div>
							<div v-else class="mt-3 rounded-lg border border-dashed border-border bg-canvas/70 p-4 text-sm leading-6 text-muted-fg">
								<slot name="empty-suggestions">Highlight copy or place the cursor in a block, then ask for a rewrite.</slot>
							</div>
						</div>
					</div>
				</aside>
			</div>

			<div
				v-if="slashMenuOpen && slashMenuOptions.length"
				ref="slashMenuPanel"
				class="dom-document-editor__slash-menu skin-popover"
				:style="slashMenuStyle"
				role="listbox"
				aria-label="Block menu"
			>
				<button
					v-for="(option, index) in slashMenuOptions"
					:key="option.id"
					type="button"
					class="dom-document-editor__slash-item"
					:class="{ 'dom-document-editor__slash-item--active': index === slashMenuIndex }"
					role="option"
					:aria-selected="index === slashMenuIndex ? 'true' : 'false'"
					@mousedown.prevent
					@click="applySlashMenuOption(option)"
				>
					<span class="dom-document-editor__slash-icon">
						<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
							<path :d="option.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</span>
					<span class="min-w-0 text-left">
						<span class="block truncate text-sm font-medium text-canvas-fg">{{ option.label }}</span>
						<span class="block truncate text-xs text-muted-fg">{{ option.description }}</span>
					</span>
				</button>
			</div>

			<DomDialog v-model="linkDialogOpen" title="Edit link" description="Add a destination URL for the selected text." width="min(92vw, 30rem)">
				<DomTextInput v-model="linkUrl" label="URL" placeholder="https://example.com" />
				<template #footer>
					<DomButton type="button" size="sm" variant="secondary" data-close>Cancel</DomButton>
					<DomButton type="button" size="sm" variant="primary" @click="commitLinkDialog">Apply link</DomButton>
				</template>
			</DomDialog>

			<DomDialog v-model="videoDialogOpen" title="Embed video" description="Paste a YouTube, Vimeo, or iframe-safe video URL." width="min(92vw, 32rem)">
				<div class="space-y-3">
					<DomTextInput v-model="videoUrl" label="Video URL" placeholder="https://www.youtube.com/watch?v=..." />
					<DomTextInput v-model="videoTitle" label="Title" placeholder="Product walkthrough" />
				</div>
				<template #footer>
					<DomButton type="button" size="sm" variant="secondary" data-close>Cancel</DomButton>
					<DomButton type="button" size="sm" variant="primary" @click="commitVideoDialog">Insert video</DomButton>
				</template>
			</DomDialog>
		</section>
	</DomField>
</template>

<style scoped>
.dom-document-editor__body {
	display: grid;
	min-height: var(--dom-document-editor-min-height, 34rem);
}

.dom-document-editor--field {
	cursor: text;
}

.dom-document-editor--field:focus-within {
	border-color: var(--ring);
	box-shadow:
		var(--skin-input-shadow, inset 0 1px 2px rgb(15 23 42 / 0.1)),
		0 0 0 2px color-mix(in oklch, var(--ring) 30%, transparent);
}

.dom-document-editor--invalid {
	border-color: var(--destructive);
}

.dom-document-editor__toolbar {
	display: block;
}

.dom-document-editor__content {
	min-height: inherit;
}

.dom-document-editor__paper {
	background: color-mix(in oklch, var(--canvas) 96%, white);
	border: 1px solid color-mix(in oklch, var(--border) 82%, var(--canvas-fg));
	border-radius: 0.75rem;
	box-shadow: 0 18px 45px color-mix(in oklch, var(--canvas-fg) 8%, transparent);
	cursor: text;
	margin: 1rem;
	min-height: var(--dom-document-editor-min-height, 34rem);
	overflow: hidden;
	transition: border-color 160ms ease, box-shadow 160ms ease;
}

.dom-document-editor__paper:focus-within {
	border-color: var(--primary);
	box-shadow:
		0 0 0 3px color-mix(in oklch, var(--primary) 18%, transparent),
		0 18px 45px color-mix(in oklch, var(--canvas-fg) 8%, transparent);
}

.dom-document-editor__paper--readonly {
	cursor: default;
}

.dom-document-editor__paper--field {
	background: transparent;
	border: 0;
	border-radius: 0;
	box-shadow: none;
	margin: 0;
}

.dom-document-editor__paper--field:focus-within {
	border-color: transparent;
	box-shadow: none;
}

.dom-document-editor__slash-menu {
	border-radius: 0.75rem;
	box-shadow: var(--shadow-lg);
	display: grid;
	gap: 0.25rem;
	max-height: 18rem;
	overflow: auto;
	padding: 0.35rem;
	position: absolute;
	width: min(16.25rem, calc(100% - 1rem));
	z-index: 30;
}

.dom-document-editor__slash-item {
	align-items: center;
	border-radius: 0.55rem;
	display: grid;
	gap: 0.65rem;
	grid-template-columns: auto minmax(0, 1fr);
	padding: 0.55rem 0.65rem;
	text-align: left;
	transition: background-color 140ms ease;
	width: 100%;
}

.dom-document-editor__slash-item:hover,
.dom-document-editor__slash-item--active {
	background: var(--secondary);
}

.dom-document-editor__slash-icon {
	align-items: center;
	background: var(--canvas);
	border: 1px solid var(--border);
	border-radius: 0.5rem;
	color: var(--muted-fg);
	display: inline-flex;
	height: 1.85rem;
	justify-content: center;
	width: 1.85rem;
}

:deep(.dom-document-editor__prosemirror) {
	cursor: text;
	min-height: inherit;
	outline: none;
	padding: clamp(1rem, 4vw, 2.25rem);
}

.dom-document-editor--field :deep(.dom-document-editor__prosemirror) {
	padding: 0.85rem 1rem 1rem;
}

:deep(.dom-document-editor__prosemirror > * + *) {
	margin-top: 0.85em;
}

:deep(.dom-document-editor__prosemirror h1) {
	font-size: 2rem;
	font-weight: 750;
	line-height: 1.15;
}

:deep(.dom-document-editor__prosemirror h2) {
	font-size: 1.55rem;
	font-weight: 720;
	line-height: 1.2;
}

:deep(.dom-document-editor__prosemirror h3) {
	font-size: 1.25rem;
	font-weight: 700;
	line-height: 1.25;
}

:deep(.dom-document-editor__prosemirror p) {
	color: var(--canvas-fg);
	line-height: 1.75;
}

:deep(.dom-document-editor__prosemirror ul),
:deep(.dom-document-editor__prosemirror ol) {
	padding-left: 1.35rem;
}

:deep(.dom-document-editor__prosemirror ul) {
	list-style: disc;
}

:deep(.dom-document-editor__prosemirror ol) {
	list-style: decimal;
}

:deep(.dom-document-editor__prosemirror blockquote) {
	border-left: 3px solid var(--primary);
	color: var(--muted-fg);
	padding-left: 1rem;
}

:deep(.dom-document-editor__prosemirror pre) {
	background: var(--secondary);
	border: 1px solid var(--border);
	border-radius: 0.65rem;
	color: var(--canvas-fg);
	overflow-x: auto;
	padding: 0.9rem 1rem;
	position: relative;
}

:deep(.dom-document-editor__prosemirror pre.dom-code-block::before) {
	color: var(--muted-fg);
	content: attr(data-language);
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
	font-size: 9px;
	font-weight: 600;
	letter-spacing: 0.08em;
	line-height: 1;
	pointer-events: none;
	position: absolute;
	right: 0.75rem;
	text-transform: uppercase;
	top: 0.35rem;
}

:deep(.dom-document-editor__prosemirror pre code) {
	background: transparent;
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
	font-size: 0.875em;
	line-height: 1.65;
	padding: 0;
}

:deep(.dom-document-editor__prosemirror .tableWrapper) {
	overflow-x: auto;
}

:deep(.dom-document-editor__prosemirror table) {
	border-collapse: collapse;
	table-layout: fixed;
	width: 100%;
}

:deep(.dom-document-editor__prosemirror th),
:deep(.dom-document-editor__prosemirror td) {
	border: 1px solid var(--border);
	box-sizing: border-box;
	min-width: 5rem;
	padding: 0.55rem 0.65rem;
	position: relative;
	vertical-align: top;
}

:deep(.dom-document-editor__prosemirror th) {
	background: var(--secondary);
	font-weight: 700;
	text-align: left;
}

:deep(.dom-document-editor__prosemirror .selectedCell::after) {
	background: color-mix(in oklch, var(--primary) 14%, transparent);
	content: '';
	inset: 0;
	pointer-events: none;
	position: absolute;
	z-index: 2;
}

:deep(.dom-document-editor__prosemirror .column-resize-handle) {
	background: var(--primary);
	bottom: -1px;
	pointer-events: none;
	position: absolute;
	right: -2px;
	top: 0;
	width: 4px;
	z-index: 3;
}

:deep(.dom-document-editor__prosemirror.resize-cursor) {
	cursor: col-resize;
}

:deep(.dom-document-editor__prosemirror img) {
	border: 1px solid var(--border);
	border-radius: 0.75rem;
	display: block;
	max-width: 100%;
}

:deep(.dom-document-editor__image-node) {
	display: block;
	position: relative;
	width: fit-content;
}

:deep(.dom-document-editor__image-action) {
	align-items: center;
	background: color-mix(in oklch, var(--canvas) 92%, transparent);
	border: 1px solid color-mix(in oklch, var(--border) 82%, transparent);
	border-radius: 0.45rem;
	box-shadow: 0 0.25rem 0.75rem color-mix(in oklch, var(--fg) 15%, transparent);
	color: var(--canvas-fg);
	cursor: pointer;
	display: inline-flex;
	font-size: 0.75rem;
	font-weight: 650;
	line-height: 1;
	opacity: 0;
	padding: 0.5rem 0.65rem;
	position: absolute;
	right: 0.75rem;
	top: 0.75rem;
	transform: translateY(-0.15rem);
	transition: opacity 120ms ease, transform 120ms ease, background-color 120ms ease;
	z-index: 2;
}

:deep(.dom-document-editor__image-node:hover .dom-document-editor__image-action),
:deep(.dom-document-editor__image-node:focus-within .dom-document-editor__image-action) {
	opacity: 1;
	transform: translateY(0);
}

:deep(.dom-document-editor__image-action:hover) {
	background: var(--canvas);
}

:deep(.dom-document-editor__image-action:focus-visible) {
	outline: 2px solid color-mix(in oklch, var(--ring) 65%, transparent);
	outline-offset: 2px;
}

:deep(.dom-document-editor__link) {
	color: var(--primary);
	text-decoration: underline;
	text-underline-offset: 0.18em;
}

:deep(.dom-document-editor__suggestion-mark) {
	background: color-mix(in oklch, var(--primary) 14%, transparent);
	border-bottom: 2px solid var(--primary);
	border-radius: 0.2rem;
	padding: 0.05rem 0.1rem;
}

:deep(.dom-document-editor__video-node) {
	aspect-ratio: 16 / 9;
	background: var(--secondary);
	border: 1px solid var(--border);
	border-radius: 0.75rem;
	overflow: hidden;
}

:deep(.dom-document-editor__video-node iframe) {
	border: 0;
	height: 100%;
	width: 100%;
}

:deep(.dom-document-editor__prosemirror .is-empty::before) {
	color: var(--muted-fg);
	content: attr(data-placeholder);
	float: left;
	height: 0;
	pointer-events: none;
}

:deep(.dom-document-editor__collaboration-caret) {
	border-left: 2px solid var(--primary);
	border-right: 2px solid var(--primary);
	margin-left: -1px;
	margin-right: -1px;
	pointer-events: none;
	position: relative;
	word-break: normal;
}

:deep(.dom-document-editor__collaboration-label) {
	border-radius: 999px;
	color: white;
	font-size: 11px;
	font-weight: 650;
	left: -2px;
	line-height: 1;
	padding: 0.2rem 0.45rem;
	position: absolute;
	top: -1.45rem;
	white-space: nowrap;
}

@media (max-width: 640px) {
	.dom-document-editor__paper:not(.dom-document-editor__paper--field) {
		margin: 0.75rem;
		min-height: min(var(--dom-document-editor-min-height, 34rem), 28rem);
	}

	.dom-document-editor__paper--field {
		margin: 0;
	}
}

@media (min-width: 1024px) {
	.dom-document-editor__body--rail {
		grid-template-columns: minmax(0, 1fr) 20rem;
	}
}
</style>
