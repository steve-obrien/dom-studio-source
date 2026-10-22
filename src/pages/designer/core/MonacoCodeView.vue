<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

/**
 * Optional Monaco upgrade for the designer's code view.
 *
 * Meets the same contract as CodeView (`modelValue`, `highlight`, `label`,
 * `readonly`; `update:modelValue`, `cursor`, `select`, `focus`, `blur`), so
 * DomDesigner keeps two-way selection sync: moving the caret selects that
 * line's layer on the stage, and selecting a layer highlights and reveals its
 * lines. A `highlight.caret` (`{ line, column }`) also marks one position, such
 * as the caret while text is edited on the canvas, and keeps it in view;
 * `highlight.selection` (`{ start, end }`, each a line and column) marks the
 * words selected there. `select` reports the selection as `{ start, end }`
 * character offsets.
 *
 * Monaco is not a dependency of DOM Studio. Pass `load`, a function that
 * resolves to the Monaco API (monaco-editor's `esm/vs/editor/editor.api`
 * module, after importing its CSS), so your app controls the bundle and its
 * workers. Then: `<DomDesigner :code-editor="DomMonacoCodeView"
 * :code-editor-props="{ load }" />`.
 *
 * While Monaco loads, or if it fails, the view shows the plain source.
 */
defineOptions({ name: 'DomMonacoCodeView' });

const props = defineProps({
	modelValue: { type: String, default: '' },
	highlight: { type: Object, default: null },
	label: { type: String, default: 'Source' },
	readonly: { type: Boolean, default: false },
	/** Resolves to the Monaco API from your own monaco-editor install. */
	load: { type: Function, required: true },
	/** Extra Monaco editor options, merged over the defaults. */
	options: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['update:modelValue', 'cursor', 'select', 'focus', 'blur']);

const mount = ref(null);
const status = ref('loading');
const error = ref('');
const editor = shallowRef(null);
let monaco = null;
let decorations = null;
let applying = false;
let themeObserver = null;
let disposed = false;

/** A small Vue template grammar: tags, attributes, bindings and mustaches. */
function registerVue(api) {
	const id = 'dom-vue';
	if (api.languages.getLanguages().some((language) => language.id === id)) return id;
	api.languages.register({ id, aliases: ['Vue'], extensions: ['.vue'] });
	api.languages.setLanguageConfiguration(id, {
		comments: { blockComment: ['<!--', '-->'] },
		brackets: [['<', '>'], ['{', '}'], ['[', ']'], ['(', ')']],
		autoClosingPairs: [{ open: '"', close: '"' }, { open: "'", close: "'" }, { open: '{', close: '}' }, { open: '[', close: ']' }, { open: '(', close: ')' }],
	});
	api.languages.setMonarchTokensProvider(id, {
		tokenizer: {
			root: [
				[/<!--/, 'comment', '@comment'],
				[/<\/?[\w:-]+/, 'tag', '@tag'],
				[/{{/, 'delimiter.bracket', '@mustache'],
				[/\b(const|let|var|import|from|export|default|function|return|if|else|for|in|of|true|false|null|undefined)\b/, 'keyword'],
				[/"[^"]*"|'[^']*'|`[^`]*`/, 'string'],
				[/\b\d+(?:\.\d+)?\b/, 'number'],
			],
			tag: [
				[/\s+/, ''],
				[/\/?>/, 'tag', '@pop'],
				[/[:@#][\w:.-]*|v-[\w:.-]+/, 'keyword'],
				[/[\w:.-]+/, 'attribute.name'],
				[/=/, 'delimiter'],
				[/"[^"]*"|'[^']*'/, 'attribute.value'],
			],
			mustache: [
				[/}}/, 'delimiter.bracket', '@pop'],
				[/[A-Za-z_$][\w$.]*/, 'variable'],
				[/"[^"]*"|'[^']*'/, 'string'],
				[/\b\d+(?:\.\d+)?\b/, 'number'],
			],
			comment: [[/-->/, 'comment', '@pop'], [/[^-]+/, 'comment'], [/./, 'comment']],
		},
	});
	return id;
}

function dark() {
	const root = document.documentElement;
	if (root.dataset.theme) return root.dataset.theme === 'dark';
	return root.classList.contains('dark') || window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

/** Highlights and reveals the selected layer's lines without moving the caret. */
function showHighlight() {
	if (!editor.value || !decorations) return;
	const range = props.highlight;
	if (!range) { decorations.clear(); return; }
	const { caret, selection } = range;
	decorations.set([
		{ range: new monaco.Range(range.start, 1, range.end, 1), options: { isWholeLine: true, className: 'dom-code-highlight', linesDecorationsClassName: 'dom-code-highlight-gutter' } },
		...(selection ? [{ range: new monaco.Range(selection.start.line, selection.start.column, selection.end.line, selection.end.column), options: { inlineClassName: 'dom-code-selection' } }] : []),
		...(caret ? [{ range: new monaco.Range(caret.line, caret.column, caret.line, caret.column), options: { beforeContentClassName: 'dom-code-caret' } }] : []),
	]);
	if (editor.value.hasTextFocus()) return;
	if (caret) editor.value.revealPositionInCenterIfOutsideViewport({ lineNumber: caret.line, column: caret.column });
	else editor.value.revealLinesInCenterIfOutsideViewport(range.start, range.end);
}

onMounted(async () => {
	try {
		const loaded = await props.load();
		monaco = loaded?.editor ? loaded : loaded?.default;
		if (!monaco?.editor) throw new Error('load() did not return the Monaco API.');
		if (disposed || !mount.value) return;
		const language = registerVue(monaco);
		editor.value = monaco.editor.create(mount.value, {
			value: props.modelValue,
			language,
			readOnly: props.readonly,
			ariaLabel: props.label,
			automaticLayout: true,
			minimap: { enabled: false },
			fontSize: 12,
			lineHeight: 20,
			tabSize: 2,
			insertSpaces: false,
			detectIndentation: false,
			scrollBeyondLastLine: false,
			renderLineHighlight: 'none',
			padding: { top: 12, bottom: 12 },
			theme: dark() ? 'vs-dark' : 'vs',
			...props.options,
		});
		decorations = editor.value.createDecorationsCollection();
		editor.value.onDidChangeModelContent(() => {
			if (!applying) emit('update:modelValue', editor.value.getValue());
		});
		editor.value.onDidChangeCursorPosition((event) => {
			if (!applying && editor.value.hasTextFocus()) emit('cursor', event.position.lineNumber);
		});
		editor.value.onDidChangeCursorSelection((event) => {
			if (applying || !editor.value.hasTextFocus()) return;
			const model = editor.value.getModel();
			emit('select', { start: model.getOffsetAt(event.selection.getStartPosition()), end: model.getOffsetAt(event.selection.getEndPosition()) });
		});
		editor.value.onDidFocusEditorText(() => emit('focus'));
		editor.value.onDidBlurEditorText(() => emit('blur'));
		themeObserver = new MutationObserver(() => monaco.editor.setTheme(dark() ? 'vs-dark' : 'vs'));
		themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
		status.value = 'ready';
		showHighlight();
	} catch (cause) {
		error.value = cause instanceof Error ? cause.message : 'Monaco could not load.';
		status.value = 'error';
	}
});

/**
 * Applies outside changes (stage edits, text typed on the canvas) as one edit
 * of only the part that differs, so the view does not jump, and keeps the caret
 * where it was.
 */
watch(() => props.modelValue, (value) => {
	if (!editor.value || value === editor.value.getValue()) return;
	const model = editor.value.getModel();
	const current = model.getValue();
	let head = 0;
	while (head < current.length && head < value.length && current[head] === value[head]) head += 1;
	let tail = 0;
	while (tail < current.length - head && tail < value.length - head && current[current.length - 1 - tail] === value[value.length - 1 - tail]) tail += 1;
	const position = editor.value.getPosition();
	applying = true;
	editor.value.executeEdits('designer', [{ range: monaco.Range.fromPositions(model.getPositionAt(head), model.getPositionAt(current.length - tail)), text: value.slice(head, value.length - tail) }]);
	if (position) editor.value.setPosition(position);
	applying = false;
	showHighlight();
});
watch(() => props.highlight && JSON.stringify(props.highlight), showHighlight);
watch(() => props.readonly, (value) => editor.value?.updateOptions({ readOnly: value }));

onBeforeUnmount(() => {
	disposed = true;
	themeObserver?.disconnect();
	editor.value?.getModel()?.dispose();
	editor.value?.dispose();
});

defineExpose({ focus: () => editor.value?.focus() });
</script>

<template>
	<div class="relative min-h-0 overflow-hidden bg-canvas">
		<div ref="mount" class="absolute inset-0" :class="status !== 'ready' && 'invisible'"></div>
		<pre v-if="status !== 'ready'" class="absolute inset-0 overflow-auto p-3 font-mono text-xs leading-5 text-muted-fg" :aria-label="label">{{ status === 'error' ? `Monaco could not load (${error}). Showing the source read-only.\n\n` : '' }}{{ modelValue }}</pre>
	</div>
</template>

<style>
.dom-code-highlight {
	background: color-mix(in oklab, var(--primary) 12%, transparent);
}

.dom-code-highlight-gutter {
	border-left: 3px solid var(--primary);
}

.dom-code-selection {
	background: color-mix(in oklab, var(--primary) 30%, transparent);
}

.dom-code-caret::before {
	content: '';
	display: inline-block;
	width: 2px;
	height: 1.2em;
	margin-right: -2px;
	vertical-align: text-bottom;
	background: var(--primary);
	animation: dom-code-caret-blink 1s steps(1) infinite;
}

@keyframes dom-code-caret-blink {
	50% { opacity: 0; }
}
</style>
