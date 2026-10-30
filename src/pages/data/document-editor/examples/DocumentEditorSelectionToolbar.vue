<script setup>
import { ref, shallowRef } from 'vue';
import { BubbleMenu } from '@tiptap/vue-3/menus';
import DomButton from '../../../components/button/DomButton.vue';
import DomDocumentEditor from '../DomDocumentEditor.vue';
import DocumentEditorAiSuggestionReview from './DocumentEditorAiSuggestionReview.vue';
import { createDocumentEditorAiSuggestionExtension } from './documentEditorAiSuggestionExtension.js';
import { requestDocumentEditorAiEdit } from './documentEditorAiMockProvider.js';
import { createLongDocumentContent } from './documentEditorLongDocument.js';

const content = ref(createLongDocumentContent());
const editor = shallowRef(null);
const suggestionController = shallowRef(null);
const pendingSuggestion = ref(null);
const requestError = ref('');
const aiActions = [
	{ id: 'expand', label: 'Expand' },
	{ id: 'simplify', label: 'Simplify' },
	{ id: 'improve', label: 'Improve' },
];
const selectionToolbarOptions = shallowRef({
	strategy: 'fixed',
	placement: 'top',
	offset: 8,
	flip: true,
	shift: { padding: 8 },
	inline: true,
});

/**
 * Adds the isolated AI range-decoration extension to the editor.
 *
 * @param {{ modules: Record<string, unknown>, extensions: Array<unknown> }} context Editor extension context.
 * @returns {Array<unknown>} Editor extensions including the AI decoration plugin.
 */
function configureExtensions({ modules, extensions }) {
	suggestionController.value = createDocumentEditorAiSuggestionExtension(modules);
	return [...extensions, suggestionController.value.extension];
}

/**
 * Captures the editor and connects the popover to its nearest scroll container.
 *
 * @param {{ editor?: Record<string, unknown> }} payload Document editor ready payload.
 * @returns {void}
 */
function handleEditorReady(payload) {
	editor.value = payload.editor || null;
	selectionToolbarOptions.value = {
		...selectionToolbarOptions.value,
		scrollTarget: findScrollTarget(editor.value?.view?.dom),
	};
}

/**
 * Shows AI actions for a non-empty selection inside one paragraph.
 *
 * @param {{ editor?: Record<string, unknown>, from?: number, to?: number }} context Bubble-menu visibility context.
 * @returns {boolean} True when the selected paragraph can be edited by AI.
 */
function shouldShowAiToolbar({ editor: activeEditor, from, to }) {
	if (pendingSuggestion.value || !activeEditor?.isEditable || typeof from !== 'number' || typeof to !== 'number' || from === to) {
		return false;
	}
	const selection = activeEditor.state?.selection;
	if (!selection?.$from?.sameParent?.(selection.$to)) return false;
	if (selection.$from.parent?.type?.name !== 'paragraph') return false;
	return Boolean(activeEditor.state.doc.textBetween(from, to, ' ')?.trim());
}

/**
 * Requests an AI rewrite for the complete paragraph containing the selection.
 *
 * @param {{ id: string, label: string }} action Requested AI operation.
 * @returns {Promise<void>} Resolves when the proposal is ready or the request fails.
 */
async function requestAiEdit(action) {
	const paragraph = resolveSelectedParagraph();
	if (!paragraph || !editor.value || !suggestionController.value) return;
	const suggestion = {
		id: `ai-${Date.now()}`,
		action: action.id,
		label: action.label,
		...paragraph,
		proposed: '',
	};
	requestError.value = '';
	pendingSuggestion.value = suggestion;
	suggestionController.value.highlight(editor.value, suggestion);
	try {
		const response = await requestDocumentEditorAiEdit({
			action: action.id,
			text: paragraph.original,
		});
		if (pendingSuggestion.value?.id !== suggestion.id) return;
		pendingSuggestion.value = {
			...suggestion,
			proposed: response.proposed,
		};
	} catch (error) {
		if (pendingSuggestion.value?.id !== suggestion.id) return;
		requestError.value = error instanceof Error ? error.message : 'The AI edit could not be generated.';
		rejectSuggestion();
	}
}

/**
 * Replaces the highlighted paragraph with the reviewed AI proposal.
 *
 * @returns {void}
 */
function acceptSuggestion() {
	if (!editor.value || !pendingSuggestion.value?.proposed || !suggestionController.value) return;
	const range = suggestionController.value.getRange(editor.value);
	if (!range) return;
	editor.value.chain().focus().insertContentAt(range, pendingSuggestion.value.proposed).run();
	suggestionController.value.clear(editor.value);
	pendingSuggestion.value = null;
}

/**
 * Keeps the original paragraph and removes the pending AI highlight.
 *
 * @returns {void}
 */
function rejectSuggestion() {
	if (editor.value && suggestionController.value) {
		suggestionController.value.clear(editor.value);
		editor.value.commands.focus();
	}
	pendingSuggestion.value = null;
}

/**
 * Resolves the complete paragraph containing the current text selection.
 *
 * @returns {{ from: number, to: number, original: string }|null} Selected paragraph data.
 */
function resolveSelectedParagraph() {
	const selection = editor.value?.state?.selection;
	if (!selection || selection.empty || !selection.$from.sameParent(selection.$to)) return null;
	if (selection.$from.parent?.type?.name !== 'paragraph') return null;
	const from = selection.$from.start();
	const to = selection.$from.end();
	const original = editor.value.state.doc.textBetween(from, to, ' ', ' ').trim();
	if (!original) return null;
	return { from, to, original };
}

/**
 * Selects the first research paragraph for a deterministic demo path.
 *
 * @returns {void}
 */
function selectExampleParagraph() {
	if (!editor.value) return;
	let paragraphRange = null;
	editor.value.state.doc.descendants((node, position) => {
		if (paragraphRange || node.type?.name !== 'paragraph') return true;
		if (!node.textContent.includes('Research currently arrives')) return true;
		paragraphRange = {
			from: position + 1,
			to: position + node.nodeSize - 1,
		};
		return false;
	});
	if (!paragraphRange) return;
	editor.value.commands.setTextSelection(paragraphRange);
	editor.value.commands.focus();
}

/**
 * Finds the closest vertical scroll container used to reposition the AI toolbar.
 *
 * @param {HTMLElement|null|undefined} element Editor DOM element.
 * @returns {HTMLElement|Window|undefined} Scroll target in the editor document.
 */
function findScrollTarget(element) {
	const ownerWindow = element?.ownerDocument?.defaultView;
	let candidate = element?.parentElement;
	while (candidate && ownerWindow) {
		const style = ownerWindow.getComputedStyle(candidate);
		const hasScrollableOverflow = /(auto|scroll|overlay)/.test(`${style.overflowY} ${style.overflow}`);
		const hasOverflowingContent = candidate.scrollHeight > candidate.clientHeight + 1;
		if (hasScrollableOverflow && hasOverflowingContent) return candidate;
		candidate = candidate.parentElement;
	}
	return ownerWindow;
}
</script>

<template>
	<div class="w-full bg-secondary/25 p-4 sm:p-6">
		<div class="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-canvas p-4 text-sm leading-6 text-muted-fg">
			<div class="min-w-0 flex-1">
				<p class="font-semibold text-canvas-fg">Select text inside a paragraph</p>
				<p class="mt-1">Choose an AI action from the popover, then compare the suggested paragraph before accepting or rejecting it.</p>
			</div>
			<DomButton type="button" size="sm" variant="secondary" :disabled="!editor || pendingSuggestion" @click="selectExampleParagraph">
				Select example paragraph
			</DomButton>
		</div>

		<p v-if="requestError" class="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
			{{ requestError }}
		</p>

		<DomDocumentEditor
			v-model="content"
			title="Launch research draft"
			status="AI editing experiment"
			:configure-extensions="configureExtensions"
			:show-toolbar="false"
			:show-suggestion-rail="false"
			min-height="72rem"
			@ready="handleEditorReady"
		/>

		<BubbleMenu
			v-if="editor && !pendingSuggestion"
			:editor="editor"
			:options="selectionToolbarOptions"
			:should-show="shouldShowAiToolbar"
			:update-delay="60"
			plugin-key="document-editor-ai-toolbar"
		>
			<div class="skin-popover flex items-center gap-1 rounded-full border border-border p-1 shadow-lg" aria-label="AI paragraph tools">
				<span class="ml-2 mr-1 flex items-center gap-1.5 text-xs font-semibold text-canvas-fg">
					<svg class="size-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
						<path d="m12 3 1.25 4.1L17 9l-3.75 1.9L12 15l-1.25-4.1L7 9l3.75-1.9L12 3Z" />
						<path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
					</svg>
					AI
				</span>
				<DomButton
					v-for="action in aiActions"
					:key="action.id"
					type="button"
					size="xs"
					variant="ghost"
					@mousedown.prevent
					@click="requestAiEdit(action)"
				>
					{{ action.label }}
				</DomButton>
			</div>
		</BubbleMenu>

		<div v-if="pendingSuggestion" class="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl">
			<DocumentEditorAiSuggestionReview
				:suggestion="pendingSuggestion"
				:loading="!pendingSuggestion.proposed"
				@accept="acceptSuggestion"
				@reject="rejectSuggestion"
			/>
		</div>
	</div>
</template>
