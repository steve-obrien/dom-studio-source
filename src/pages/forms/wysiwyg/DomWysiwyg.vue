<script>
import { fieldProps } from '../field/fieldProps.js';
import { createDefaultDocumentContent } from '../../data/document-editor/DomDocumentEditor.vue';

/**
 * Returns the default editable document for the shorthand WYSIWYG field.
 *
 * @returns {Record<string, unknown>} Default Tiptap document content.
 */
function defaultWysiwygContent() {
	return createDefaultDocumentContent();
}

/**
 * Returns the built-in tools shown by the shorthand WYSIWYG field.
 *
 * @returns {Array<string>} Built-in tool ids.
 */
function defaultWysiwygTools() {
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
	];
}

/**
 * Returns an empty custom tool list.
 *
 * @returns {Array<Record<string, unknown>>} Custom toolbar tools.
 */
function defaultCustomTools() {
	return [];
}

export const wysiwygProps = {
	...fieldProps,
	modelValue: {
		type: [Object, String],
		default: defaultWysiwygContent,
		_edit: { component: 'DomJsonInput', description: 'Controlled editor content. JSON is preferred; HTML strings are accepted for simple imports.' },
	},
	output: {
		type: String,
		default: 'json',
		_edit: { options: ['json', 'html'], description: 'Value emitted through update:modelValue.' },
	},
	editable: {
		type: Boolean,
		default: true,
		_edit: { description: 'Allow editing and toolbar commands.' },
	},
	title: {
		type: String,
		default: '',
		_edit: { description: 'Accessible editor title. Defaults to the field label.' },
	},
	status: {
		type: String,
		default: '',
		_edit: { description: 'Optional save or validation status label.' },
	},
	tools: {
		type: Array,
		default: defaultWysiwygTools,
		_edit: { component: 'DomJsonListInput', description: 'Built-in toolbar tool ids to show.' },
	},
	customTools: {
		type: Array,
		default: defaultCustomTools,
		_edit: { component: 'DomJsonListInput', description: 'Additional toolbar actions emitted through tool-action.' },
	},
	showToolbar: {
		type: Boolean,
		default: true,
		_edit: { description: 'Show the WYSIWYG toolbar.' },
	},
	showSlashMenu: {
		type: Boolean,
		default: true,
		_edit: { description: 'Open the block command menu when the user types / at the start of a block.' },
	},
	minHeight: {
		type: String,
		default: '16rem',
		_edit: { description: 'Minimum height for the editable field.' },
	},
};
</script>

<script setup>
import { computed, ref, useAttrs } from 'vue';
import DomDocumentEditor from '../../data/document-editor/DomDocumentEditor.vue';

defineOptions({
	inheritAttrs: false,
	__doc: {
		name: 'WYSIWYG field',
		tag: '<DomWysiwyg>',
		description: 'A textarea-shaped rich text field powered by DomDocumentEditor, with headings, language-aware highlighted code blocks, tables, simple v-model wiring, and no collaboration or AI review rail by default.',
		events: [
			{ name: 'update:modelValue', payload: 'Record<string, unknown> | string', description: 'Fired with JSON or HTML content depending on the output prop.' },
			{ name: 'change', payload: 'DocumentEditorChangePayload', description: 'Fired with JSON, HTML, and plain text whenever the editor changes.' },
			{ name: 'selection-change', payload: 'DocumentEditorSelectionPayload', description: 'Fired when the editor selection changes.' },
			{ name: 'tool-action', payload: '({ tool, editor })', description: 'Fired when a custom toolbar tool is activated.' },
			{ name: 'ready', payload: '({ editor })', description: 'Fired after the browser-only editor runtime mounts.' },
			{ name: 'runtime-error', payload: 'Error', description: 'Fired when the editor runtime cannot mount.' },
			{ name: 'focus', payload: 'FocusEvent', description: 'Fired when the editable document receives focus.' },
			{ name: 'blur', payload: 'FocusEvent', description: 'Fired when the editable document loses focus.' },
		],
	},
});

const props = defineProps(wysiwygProps);
const emit = defineEmits([
	'update:modelValue',
	'change',
	'selection-change',
	'tool-action',
	'ready',
	'runtime-error',
	'focus',
	'blur',
]);
const attrs = useAttrs();
const editorRef = ref(null);
const editorTitle = computed(() => props.title || props.label || 'Rich text field');

/**
 * Moves focus into the wrapped editor instance.
 *
 * @returns {void}
 */
function focusEditor() {
	editorRef.value?.focusEditor?.();
}

/**
 * Returns the latest serializable editor payload from the wrapped editor.
 *
 * @returns {{ json: Record<string, unknown>|null, html: string, text: string }|undefined} Current editor payload.
 */
function savePayload() {
	return editorRef.value?.savePayload?.();
}

defineExpose({
	editorRef,
	focusEditor,
	savePayload,
});
</script>

<template>
	<DomDocumentEditor
		ref="editorRef"
		v-bind="attrs"
		:model-value="modelValue"
		:output="output"
		:editable="editable"
		:chrome="chrome"
		:id="id"
		:name="name"
		:label="label"
		:description="description"
		:required="required"
		:disabled="disabled"
		:read-only="readOnly"
		:invalid="invalid"
		:errors="errors"
		:visible="visible"
		:validators="validators"
		:validate-on-blur="validateOnBlur"
		:placeholder="placeholder || 'Write something useful...'"
		:title="editorTitle"
		:status="status"
		:tools="tools"
		:custom-tools="customTools"
		:show-toolbar="showToolbar"
		:show-slash-menu="showSlashMenu"
		:show-suggestion-rail="false"
		:min-height="minHeight"
		@update:model-value="emit('update:modelValue', $event)"
		@change="emit('change', $event)"
		@selection-change="emit('selection-change', $event)"
		@tool-action="emit('tool-action', $event)"
		@ready="emit('ready', $event)"
		@runtime-error="emit('runtime-error', $event)"
		@focus="emit('focus', $event)"
		@blur="emit('blur', $event)"
	/>
</template>
