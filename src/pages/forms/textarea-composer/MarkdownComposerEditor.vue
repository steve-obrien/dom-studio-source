<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import { Slice } from '@tiptap/pm/model';
import { StarterKit } from '@tiptap/starter-kit';
import { Editor, EditorContent } from '@tiptap/vue-3';
import { Marked } from 'marked';
import { ComposerTaskItem, normalizeComposerMarkdown } from './composerMarkdown.js';

const props = defineProps({
	text: { type: String, required: true },
	placeholder: { type: String, default: '' },
	rows: { type: Number, required: true },
	maxRows: { type: Number, required: true },
	autosize: { type: Boolean, required: true },
	disabled: { type: Boolean, default: false },
	readOnly: { type: Boolean, default: false },
	attributes: { type: Object, required: true },
	handleKeydown: { type: Function, required: true },
});
const emit = defineEmits(['update:text', 'focus', 'blur']);
const editor = shallowRef(null);
const taskBursts = ref([]);
let nextBurstId = 0;
const editable = computed(() => !props.disabled && !props.readOnly);
const minimumRows = computed(() => (Number.isFinite(props.rows) ? Math.max(1, Math.round(props.rows)) : 1));
const size = computed(() => {
	const min = minimumRows.value;
	const max = Number.isFinite(props.maxRows) && props.maxRows > 0 ? Math.max(min, Math.round(props.maxRows)) : null;
	return {
		'--composer-min-height': `calc(${min}lh + 1.25rem)`,
		height: props.autosize ? undefined : 'var(--composer-min-height)',
		maxHeight: props.autosize && max ? `calc(${max}lh + 1.25rem)` : undefined,
	};
});
let currentSource = props.text;

/**
 * Applies the shared submit shortcut first. Both configurable newline keys
 * start a new list item or paragraph in the rich editor.
 *
 * @param {object} view ProseMirror view.
 * @param {KeyboardEvent} event Native editor event.
 * @returns {boolean} Whether the event was handled.
 */
function onEditorKeydown(view, event) {
	if (view.composing || event.isComposing || !editable.value) return false;
	// Leave Enter to a focused checklist control and Space to its native activation.
	if (event.target?.tagName === 'INPUT') return false;
	props.handleKeydown(event);
	if (event.defaultPrevented) return true;
	if (event.key !== 'Enter' || !event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return false;
	return editor.value.commands.first(({ commands }) => [
		commands.newlineInCode,
		() => commands.splitListItem('taskItem'),
		() => commands.splitListItem('listItem'),
		commands.createParagraphNear,
		commands.liftEmptyBlock,
		commands.splitBlock,
	]);
}

/**
 * Gives the editable element the composer's current accessible field state.
 *
 * @returns {Record<string, string>} ProseMirror DOM attributes.
 */
function editableAttributes() {
	return {
		...Object.fromEntries(Object.entries(props.attributes).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)])),
		role: 'textbox',
		'aria-multiline': 'true',
		'aria-disabled': String(props.disabled),
		'aria-readonly': String(props.readOnly),
		'aria-placeholder': props.placeholder,
		tabindex: props.disabled ? '-1' : '0',
		class: 'min-h-[var(--composer-min-height)] wrap-anywhere px-3 pb-2 pt-3 text-canvas-fg outline-none',
	};
}

/**
 * Converts plain clipboard Markdown to editable content. The browser's HTML
 * paste path and explicit paste-as-plain-text retain their usual behavior.
 *
 * @param {string} text Clipboard text.
 * @param {object} context Resolved ProseMirror position at the paste target.
 * @param {boolean} plain Whether the user requested a plain paste.
 * @returns {Slice|null} Content to paste, or null to use native parsing.
 */
function parseClipboardText(text, context, plain) {
	if (plain || context.parent.type.spec.code) return null;
	const document = editor.value.schema.nodeFromJSON(editor.value.markdown.parse(normalizeComposerMarkdown(text)));
	return Slice.maxOpen(document.content);
}

/**
 * Serializes changes to the controlled prompt without reloading the editor
 * when the host echoes the emitted value back.
 *
 * @param {{ editor: Editor }} event Tiptap update event.
 * @returns {void}
 */
function updateText({ editor: instance }) {
	currentSource = instance.isEmpty ? '' : instance.getMarkdown();
	if (currentSource !== props.text) emit('update:text', currentSource);
}

/** Lets Marked keep raw HTML and bare URLs as prompt text. */
function skipTokenizer() {
	return undefined;
}

/**
 * Starts the browser editor with Markdown as the application-facing value.
 *
 * @returns {void}
 */
function mountEditor() {
	currentSource = props.text;
	editor.value = new Editor({
		extensions: [
			StarterKit.configure({ link: { openOnClick: false, autolink: false } }),
			TaskList,
			ComposerTaskItem,
			Placeholder.configure({ placeholder: () => props.placeholder }),
			Markdown.configure({ marked: new Marked({
				breaks: true,
				tokenizer: { html: skipTokenizer, tag: skipTokenizer, url: skipTokenizer },
			}) }),
		],
		content: normalizeComposerMarkdown(currentSource),
		contentType: 'markdown',
		editable: editable.value,
		editorProps: {
			attributes: editableAttributes(),
			handleKeyDown: onEditorKeydown,
			clipboardTextParser: parseClipboardText,
		},
		onUpdate: updateText,
		onFocus: ({ event }) => emit('focus', event),
		onBlur: ({ event }) => emit('blur', event),
	});
}

/**
 * Updates an externally supplied draft without adding the previous prompt to undo history.
 *
 * @param {string} text New prompt from the host application.
 * @returns {void}
 */
function syncText(text) {
	if (!editor.value || text === currentSource) return;
	currentSource = text;
	editor.value.chain()
		.setContent(normalizeComposerMarkdown(text), { contentType: 'markdown', emitUpdate: false })
		.setMeta('addToHistory', false)
		.run();
}

/**
 * Reflects inspector changes to labels, placeholder, and editing state.
 *
 * @returns {void}
 */
function syncEditorOptions() {
	const instance = editor.value;
	if (instance) instance.setOptions({ editable: editable.value, editorProps: { ...instance.options.editorProps, attributes: editableAttributes() } });
}

/**
 * Starts a burst at a task checkbox after the user's native change event.
 * The decoration lives outside the editable document.
 *
 * @param {Event} event Bubbling change event from the editor.
 * @returns {void}
 */
function celebrateTask(event) {
	const checkbox = event.target;
	if (!editable.value || !checkbox.matches('ul[data-type="taskList"] > li > label > input[type="checkbox"]:checked')) return;
	const window = checkbox.ownerDocument.defaultView;
	if (!window?.matchMedia('(prefers-reduced-motion: no-preference) and (forced-colors: none)').matches) return;

	const target = checkbox.getBoundingClientRect();
	const container = event.currentTarget.getBoundingClientRect();
	taskBursts.value.push({
		id: nextBurstId++,
		x: target.left + target.width / 2 - container.left,
		y: target.top + target.height / 2 - container.top,
	});
}

/**
 * Removes a completed or interrupted burst.
 *
 * @param {number} id Burst identifier.
 * @returns {void}
 */
function removeTaskBurst(id) {
	taskBursts.value = taskBursts.value.filter((burst) => burst.id !== id);
}

/** Focuses the editable prompt without scrolling the page. */
function focus() {
	if (!props.disabled) editor.value?.commands.focus(undefined, { scrollIntoView: false });
}

onMounted(mountEditor);
onBeforeUnmount(() => editor.value?.destroy());
watch(() => props.text, syncText);
watch(() => [props.attributes, props.disabled, props.readOnly, props.placeholder], syncEditorOptions);
defineExpose({ focus });
</script>

<template>
	<fieldset :disabled="!editable" class="relative m-0 min-w-0 border-0 p-0" @change="celebrateTask">
		<EditorContent
			:editor="editor"
			:style="size"
			:class="[
				'min-h-[var(--composer-min-height)] min-w-0 overflow-y-auto text-base leading-6',
				'[&_a]:text-primary [&_a]:underline [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-3 [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_h1]:text-xl [&_h2]:text-lg [&_:is(h1,h2,h3,h4,h5,h6)]:font-semibold [&_ol]:list-decimal [&_ol]:ps-5 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-secondary [&_pre]:p-2 [&_ul:not([data-type=taskList])]:list-disc [&_ul:not([data-type=taskList])]:ps-5',
				'[&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-start [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-muted-fg [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
				{ 'resize-y': !autosize, 'cursor-not-allowed opacity-50': disabled },
			]"
		/>
		<span
			v-for="burst in taskBursts"
			:key="burst.id"
			aria-hidden="true"
			class="task-confetti pointer-events-none absolute z-10 size-12"
			:style="{ left: `${burst.x}px`, top: `${burst.y}px` }"
			@animationend="removeTaskBurst(burst.id)"
			@animationcancel="removeTaskBurst(burst.id)"
		></span>
	</fieldset>
</template>

<style scoped>
/* Tiptap's live task view marks the list with data-type and the row with data-checked. */
fieldset :deep(ul[data-type="taskList"] > li) {
	display: flex;
	align-items: flex-start;
	gap: 0.375rem;
}

fieldset :deep(ul[data-type="taskList"] > li > label) {
	position: relative;
	display: grid;
	flex: none;
	place-items: center;
	inline-size: 1.5rem;
	min-block-size: max(1lh, 1.5rem);
}

/* Preserve Tiptap's native input for focus and activation. Its sibling paints the control. */
fieldset :deep(ul[data-type="taskList"] > li > label > input) {
	position: absolute;
	inset: 0;
	inline-size: 100%;
	block-size: 100%;
	opacity: 0;
	cursor: pointer;
}

fieldset :deep(ul[data-type="taskList"] > li > label > input + span) {
	display: grid;
	place-items: center;
	inline-size: 1.125rem;
	block-size: 1.125rem;
	border: 1px solid color-mix(in oklab, var(--muted-fg) 75%, var(--canvas));
	border-radius: 0.3125rem;
	background: var(--canvas);
	color: var(--success-fg);
	pointer-events: none;
}

fieldset :deep(ul[data-type="taskList"] > li > label > input + span)::after {
	content: '';
	inline-size: 0.625rem;
	block-size: 0.375rem;
	border-bottom: 2px solid currentColor;
	border-left: 2px solid currentColor;
	border-bottom-left-radius: 1px;
	transform: translateY(-0.0625rem) rotate(-45deg);
	opacity: 0;
	scale: 0.45;
}

fieldset :deep(ul[data-type="taskList"] > li > label > input:checked + span) {
	border-color: var(--success);
	background: var(--success);
}

fieldset :deep(ul[data-type="taskList"] > li > label > input:checked + span)::after {
	opacity: 1;
	scale: 1;
}

fieldset :deep(ul[data-type="taskList"] > li > label > input:focus-visible + span) {
	outline: 2px solid color-mix(in oklab, var(--ring) 70%, var(--canvas-fg));
	outline-offset: 2px;
}

fieldset :deep(ul[data-type="taskList"] > li > label > input:disabled) {
	cursor: not-allowed;
}

fieldset :deep(ul[data-type="taskList"] > li > label > input:disabled + span) {
	opacity: 0.55;
}

fieldset :deep(ul[data-type="taskList"] > li > div) {
	flex: 1;
	min-inline-size: 0;
}

fieldset :deep(ul[data-type="taskList"] > li > div > ul[data-type="taskList"]) {
	padding-inline-start: 0.75rem;
}

/* Target the row's text so nested tasks can show their own completion state. */
fieldset :deep(ul[data-type="taskList"] > li[data-checked="true"] > div > p) {
	color: var(--muted-fg);
	text-decoration-line: line-through;
}

@media (hover: hover) {
	fieldset :deep(ul[data-type="taskList"] > li > label > input:hover:not(:checked, :disabled) + span) {
		border-color: var(--success);
		background: color-mix(in oklab, var(--success) 10%, var(--canvas));
	}

	fieldset :deep(ul[data-type="taskList"] > li[data-checked="true"] > div > p:hover) {
		color: inherit;
		text-decoration-line: none;
	}
}

@media (prefers-reduced-motion: no-preference) {
	fieldset :deep(ul[data-type="taskList"] > li > label > input + span) {
		transition: background-color 140ms ease, border-color 140ms ease, scale 140ms ease;
	}

	fieldset :deep(ul[data-type="taskList"] > li > label > input:active:not(:disabled) + span) {
		scale: 0.9;
	}

	fieldset :deep(ul[data-type="taskList"] > li > label > input + span)::after {
		transition: opacity 110ms ease-out, scale 220ms cubic-bezier(0.2, 0.75, 0.35, 1.35);
	}
}

@media (prefers-reduced-motion: no-preference) and (forced-colors: none) {
	.task-confetti {
		background:
			radial-gradient(closest-side, var(--warning) 82%, transparent) 43% 3% / 0.25rem 0.25rem,
			linear-gradient(var(--success), var(--success)) 76% 10% / 0.125rem 0.3125rem,
			radial-gradient(closest-side, var(--selection, var(--primary)) 82%, transparent) 97% 38% / 0.25rem 0.25rem,
			linear-gradient(var(--warning), var(--warning)) 88% 74% / 0.25rem 0.125rem,
			radial-gradient(closest-side, var(--success) 82%, transparent) 62% 93% / 0.25rem 0.25rem,
			linear-gradient(var(--selection, var(--primary)), var(--selection, var(--primary))) 21% 79% / 0.125rem 0.25rem,
			radial-gradient(closest-side, var(--warning) 82%, transparent) 5% 48% / 0.1875rem 0.1875rem,
			linear-gradient(var(--success), var(--success)) 18% 17% / 0.25rem 0.125rem;
		background-repeat: no-repeat;
		translate: -50% -50%;
		animation: task-confetti 420ms cubic-bezier(0.18, 0.68, 0.32, 1) both;
	}

	@keyframes task-confetti {
		0% { opacity: 0; scale: 0.3; rotate: -12deg; }
		18% { opacity: 1; }
		100% { opacity: 0; scale: 1.16; rotate: 14deg; }
	}
}

@media (forced-colors: active) {
	fieldset :deep(ul[data-type="taskList"] > li > label > input) {
		position: static;
		inline-size: 1rem;
		block-size: 1rem;
		opacity: 1;
	}

	fieldset :deep(ul[data-type="taskList"] > li > label > input + span) {
		display: none;
	}
}
</style>
