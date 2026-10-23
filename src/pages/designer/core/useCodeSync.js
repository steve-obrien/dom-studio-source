import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { isExpr } from './editorDocument.js';
import { inlineTags, runOffset, sourceOffset } from './inlineText.js';
import { exportMappedVue, importVue } from './vueAdapter.js';
import { applySource, matchNodes, nodeAtLine } from './sourceSync.js';

/** The elements each Text panel mark is written as; the first is used for new marks. */
const markTags = { bold: ['strong', 'b'], italic: ['em', 'i'], underline: ['u'], strike: ['s', 'del', 'strike'] };

/**
 * Two-way sync between the editor's document and its Vue source.
 *
 * The code is exported from the same tree the stage renders (the session's
 * active file), with each node's lines and character offsets. Typing in the
 * code is parsed back into that tree after a pause, keeping ids where the
 * structure still matches, so the stage, the layers and the inspector follow.
 * Both selections follow each other: a line in the code selects its element,
 * a selected element highlights its lines, letters selected in the code are
 * highlighted on the canvas, and an in-place text edit moves the code's caret.
 * Bold and the other marks apply to text selected in the code, written into
 * the code as the canvas would write them.
 *
 * Render the code with `<DomCodePanel :sync="codeSync">`, or bind the returned
 * handlers to any code view that emits `update:modelValue`, `cursor`,
 * `select`, `focus` and `blur`.
 *
 * @param {object} options
 * @param {ReturnType<import('./useEditorSession.js').useEditorSession>} options.session Editor session.
 * @param {ReturnType<import('./useInlineText.js').useInlineText>} [options.inline] In-place text editing, previewed in the code while typed.
 * @param {(tag: string) => boolean} [options.isStudioComponent] Tags that get an import line in new files.
 * @param {(node: object) => string} options.tagOf A node's HTML tag or component name.
 * @param {(id: string) => Element|null} options.element The rendered element of a node in the active artboard.
 * @param {import('vue').Ref<boolean>} [options.open] Whether the code is shown; closing it drops a typed draft.
 * @param {(message: string) => void} [options.notify] Says why a mark cannot be applied.
 */
export function useCodeSync({ session, inline = null, isStudioComponent = () => false, tagOf, element, open = ref(true), notify = () => {} }) {
	const { activeFile, doc, selected, history, run } = session;
	const editing = inline?.editing || shallowRef(null);
	const editState = inline?.editState || ref({ anchor: null, focus: null, marks: null });
	const editDoc = inline?.editDoc || shallowRef(null);

	const draft = ref(null);
	const draftRanges = ref(null);
	const error = ref('');
	const warning = ref('');
	// The code view's selection as source offsets, shown on the canvas.
	const selection = ref(null);
	// The last text selected in the code, with the source it was made in, for the Text panel's bold and other marks.
	const markRange = ref(null);
	// The code view component, which can select a range (`select({ start, end })`).
	const view = shallowRef(null);
	let timer;

	/** The active file's document, or the text edit's preview of it. */
	const shownDoc = computed(() => (editDoc.value && editDoc.value.file === activeFile.value?.id ? editDoc.value.doc : doc.value));
	const mapped = computed(() => (activeFile.value ? exportMappedVue(shownDoc.value === doc.value ? activeFile.value : { ...activeFile.value, doc: shownDoc.value }, isStudioComponent) : { source: '', ranges: {} }));
	/**
	 * Each node's character offsets in the exported source. Patched files have
	 * them already; a generated file is parsed again for them, only while text is
	 * being edited or selected in the code.
	 */
	const offsets = computed(() => {
		const { source, offsets: known } = mapped.value;
		if (known) return known;
		if (!shownDoc.value || (!editing.value && !selection.value)) return null;
		try {
			const parsed = importVue(source);
			const result = {};
			for (const [parsedId, id] of matchNodes(shownDoc.value, parsed.doc)) {
				const entry = parsed.sourceMap.nodes[parsedId];
				if (entry && !entry.synthetic) result[id] = [entry.start, entry.end];
			}
			return result;
		} catch {
			return null;
		}
	});
	/** The exported source of the active file. */
	const source = computed(() => mapped.value.source);
	/** What the code view shows: the typed draft, else the export. */
	const text = computed(() => draft.value ?? source.value);
	/** The selected element's lines, with the edit's caret and selection while text is edited. */
	const highlight = computed(() => {
		const range = (draft.value === null ? mapped.value.ranges : draftRanges.value || {})[selected.value] || null;
		const points = range && draft.value === null ? editInSource() : null;
		return points ? { ...range, ...points } : range;
	});

	/** Typing in the code view: the text is kept as typed and applied after a pause. */
	function edit(value) {
		draft.value = value;
		clearTimeout(timer);
		timer = setTimeout(apply, 300);
	}

	/** Parses the typed source into the document; ids survive where the structure still matches. */
	function apply() {
		clearTimeout(timer);
		if (draft.value !== null) applyText(draft.value, { merge: `code:${activeFile.value?.id}` });
	}

	/** Parses source into the active file's document, as one undo step or merged into `merge`. */
	function applyText(value, { merge } = {}) {
		const file = activeFile.value;
		if (!file) return;
		let result;
		try {
			result = applySource(file, value, { isStudioComponent });
		} catch (failure) {
			error.value = failure.message;
			return;
		}
		error.value = '';
		warning.value = result.unsupported ? `${result.unsupported} unsupported ${result.unsupported === 1 ? 'node was' : 'nodes were'} left out: scripts, iframes or inline event handlers.` : '';
		draftRanges.value = result.ranges;
		// The typed text becomes the source that later visual edits patch, even when only its formatting changed; undo restores the previous one.
		const sourceChanged = result.source.text !== file.source?.text;
		if (!result.changed && !sourceChanged) return;
		const operations = [{ op: 'setFile', id: file.id, key: 'source', value: result.source }];
		if (result.changed) operations.unshift({ op: 'setFile', id: file.id, key: 'doc', value: result.doc });
		if (result.script !== (file.script || '')) operations.push({ op: 'setFile', id: file.id, key: 'script', value: result.script });
		if (result.style !== (file.style || '')) operations.push({ op: 'setFile', id: file.id, key: 'style', value: result.style });
		run(operations, merge ? { merge } : {});
	}

	/** Selects the element under the caret, so the layers, stage and inspector follow the code. */
	function selectLine(line) {
		const ranges = draft.value === null ? mapped.value.ranges : draftRanges.value;
		const id = ranges && nodeAtLine(ranges, line, (nodeId) => doc.value?.nodes[nodeId] && doc.value.nodes[nodeId].type !== 'text');
		if (id) selected.value = id;
	}

	/** The code view's selection, as source offsets, to highlight the same letters on the canvas. */
	function selectText(range) {
		selection.value = range;
		markRange.value = range.start < range.end ? { ...range, source: text.value } : null;
	}

	/** Clicking into the code ends text editing on the canvas, so one side is typed in at a time. */
	function enter() {
		inline?.finish();
	}

	/** Leaving the code view shows the exported source again, unless the text does not parse. */
	function leave() {
		selection.value = null;
		apply();
		if (error.value) return;
		draft.value = null;
		draftRanges.value = null;
		history.seal();
	}

	/** Drops a typed draft and its messages, showing the export again. */
	function reset() {
		clearTimeout(timer);
		draft.value = null;
		draftRanges.value = null;
		error.value = '';
		warning.value = '';
	}

	/** Forgets the code's text selection, as when a layer is picked on the canvas. */
	function forgetMarks() {
		markRange.value = null;
	}

	/* Marks on text selected in the code ---------------------------------------------- */

	/** Text runs under the code's selected text, in source order, while that selection still matches the source. */
	const markRuns = computed(() => {
		const range = markRange.value;
		const known = offsets.value;
		if (editing.value || !range || !known || range.source !== text.value || text.value !== mapped.value.source) return null;
		const nodes = shownDoc.value.nodes;
		const runs = Object.entries(known)
			.filter(([id, [start, end]]) => nodes[id]?.type === 'text' && !isExpr(nodes[id].props.value) && start < range.end && end > range.start)
			.map(([id, [start, end]]) => ({ id, start, end }))
			.sort((a, b) => a.start - b.start);
		return runs.length ? runs : null;
	});

	/** The inline elements a run sits in, innermost first, up to its paragraph or other block. */
	function inlineAncestors(id) {
		const nodes = shownDoc.value.nodes;
		const list = [];
		for (let node = nodes[nodes[id]?.parent]; node && inlineTags.has(tagOf(node)); node = nodes[node.parent]) list.push(node);
		return list;
	}

	/** Which marks all of the code's selected text has, for the Text panel's toggles; null when no text is selected there. */
	const marks = computed(() => {
		const runs = markRuns.value;
		if (!runs) return null;
		return Object.fromEntries(Object.entries(markTags).map(([mark, tags]) => [mark, runs.every((item) => inlineAncestors(item.id).some((node) => tags.includes(tagOf(node))))]));
	});

	/** Whether a stretch of markup only opens and closes inline elements, and closes each one it opens. */
	function balancedInline(markup) {
		const stack = [];
		for (const [, closing, tag, selfClosing] of markup.matchAll(/<(\/?)([a-zA-Z][\w-]*)[^>]*?(\/?)>/g)) {
			const name = tag.toLowerCase();
			if (!inlineTags.has(name)) return false;
			if (selfClosing || name === 'br') continue;
			if (!closing) stack.push(name);
			else if (stack.pop() !== name) return false;
		}
		return !stack.length;
	}

	/**
	 * Bold, italic, underline or strike on the text selected in the code, written
	 * into the code as the canvas would: the selection is wrapped in `<strong>`
	 * and the like, or taken out of the element that gives it the mark. The code
	 * stays the master: the edit is to its text, then parsed like typing.
	 */
	function mark(name) {
		const runs = markRuns.value;
		const tags = markTags[name];
		if (!runs || !tags) return;
		const value = text.value;
		const known = offsets.value;
		const range = markRange.value;
		// Only text is marked: the selection is trimmed to the runs it touches.
		let start = Math.max(range.start, runs[0].start);
		let end = Math.min(range.end, runs.at(-1).end);
		let next;
		if (!marks.value[name]) {
			if (!balancedInline(value.slice(start, end))) { notify('Select text inside one paragraph or heading to mark it.'); return; }
			const openTag = `<${tags[0]}>`;
			next = `${value.slice(0, start)}${openTag}${value.slice(start, end)}</${tags[0]}>${value.slice(end)}`;
			start += openTag.length;
			end += openTag.length;
		} else {
			const marked = inlineAncestors(runs[0].id).find((node) => tags.includes(tagOf(node)));
			if (!marked || !runs.every((item) => inlineAncestors(item.id).includes(marked)) || !known[marked.id]) { notify('Select text inside one marked element to take its mark off.'); return; }
			const [elementStart, elementEnd] = known[marked.id];
			const contentStart = known[marked.children[0]]?.[0] ?? value.indexOf('>', elementStart) + 1;
			const contentEnd = known[marked.children.at(-1)]?.[1] ?? value.lastIndexOf('<', elementEnd);
			start = Math.max(start, contentStart);
			end = Math.min(end, contentEnd);
			const openTag = value.slice(elementStart, contentStart);
			const closeTag = value.slice(contentEnd, elementEnd);
			// Text either side of the selection keeps the mark in an element of its own.
			const before = start > contentStart ? `${openTag}${value.slice(contentStart, start)}${closeTag}` : '';
			const after = end < contentEnd ? `${openTag}${value.slice(end, contentEnd)}${closeTag}` : '';
			next = `${value.slice(0, elementStart)}${before}${value.slice(start, end)}${after}${value.slice(elementEnd)}`;
			const shift = elementStart + before.length - start;
			start += shift;
			end += shift;
		}
		if (draft.value !== null) draft.value = next;
		history.seal();
		applyText(next);
		history.seal();
		markRange.value = { start, end, source: text.value };
		selection.value = selection.value && { start, end };
		nextTick(() => view.value?.select?.({ start, end }));
	}

	/* The in-place edit's caret in the code ------------------------------------------- */

	/** A point in a text run, or before an element, as an offset in the exported source. */
	function pointInSource(point) {
		const known = offsets.value;
		if (!point || !known) return undefined;
		const textRun = point.id && shownDoc.value?.nodes[point.id];
		if (textRun && known[point.id]) return sourceOffset(mapped.value.source, known[point.id], String(textRun.props.value ?? ''), point.offset);
		if (point.element && known[point.element]) return known[point.element][0];
		return undefined;
	}

	/** A source offset as a one-based line and column. */
	function lineColumn(value, offset) {
		const lineStart = value.lastIndexOf('\n', offset - 1);
		return { line: value.slice(0, offset).split('\n').length, column: offset - lineStart };
	}

	/** The edit's caret and selected words in the exported file, so the code view follows typing and selecting. */
	function editInSource() {
		const { anchor, focus } = editState.value;
		if (!focus || editing.value?.file !== activeFile.value?.id) return null;
		const value = mapped.value.source;
		const end = pointInSource(focus);
		if (end === undefined) return null;
		const start = pointInSource(anchor) ?? end;
		const caret = lineColumn(value, end);
		if (start === end) return { caret };
		return { caret, selection: { start: lineColumn(value, Math.min(start, end)), end: lineColumn(value, Math.max(start, end)) } };
	}

	/* Code selection on the canvas ----------------------------------------------------- */

	let shown = null;

	/** Removes the code selection drawn on the canvas. */
	function clearSelection() {
		if (!shown) return;
		shown.view.CSS?.highlights?.delete('dom-code-selection');
		shown.caret?.remove();
		shown.view.removeEventListener('scroll', showSelection, true);
		shown = null;
	}

	/** The rendered DOM text node that shows a text run, matched like the runs of an edit (see inlineText.js). */
	function renderedRun(runId) {
		const node = shownDoc.value?.nodes[runId];
		const host = node?.parent && element(node.parent);
		if (!host) return null;
		const rendered = [...host.childNodes].filter((child) => child.nodeType === 1 || (child.nodeType === 3 && child.data));
		let cursor = 0;
		for (const childId of shownDoc.value.nodes[node.parent].children) {
			const child = shownDoc.value.nodes[childId];
			const isText = child?.type === 'text';
			const found = rendered.slice(cursor).findIndex((item) => (isText ? item.nodeType === 3 : item.nodeType === 1 && item.dataset.designerId === childId));
			if (found === -1) continue;
			cursor += found;
			if (childId === runId) return rendered[cursor];
			cursor += 1;
		}
		return null;
	}

	/**
	 * Highlights the letters selected in the code on the canvas, or draws a caret
	 * where the code's caret is. Uses the CSS Custom Highlight API, which marks
	 * text without touching the page's selection or the code view's focus.
	 */
	function showSelection() {
		clearSelection();
		const range = selection.value;
		const known = offsets.value;
		// While typed code waits to be applied its offsets are not known yet; this runs again once it is.
		if (!range || editing.value || !known || text.value !== mapped.value.source) return;
		const value = mapped.value.source;
		const nodes = shownDoc.value.nodes;
		const runs = Object.entries(known)
			.filter(([id, [start, end]]) => nodes[id]?.type === 'text' && !isExpr(nodes[id].props.value) && start <= range.end && end >= range.start)
			.sort((a, b) => a[1][0] - b[1][0]);
		if (!runs.length) return;
		const point = ([id, span], offset) => {
			const rendered = renderedRun(id);
			return rendered && { text: rendered, offset: Math.min(rendered.data.length, runOffset(value, span, String(nodes[id].props.value ?? ''), offset)) };
		};
		const from = point(runs[0], Math.max(range.start, runs[0][1][0]));
		const to = point(runs.at(-1), Math.min(range.end, runs.at(-1)[1][1]));
		if (!from || !to) return;
		const owner = from.text.ownerDocument;
		const frame = owner.defaultView;
		const marked = owner.createRange();
		marked.setStart(from.text, from.offset);
		marked.setEnd(to.text, to.offset);
		shown = { view: frame };
		frame.addEventListener('scroll', showSelection, { capture: true, passive: true });
		if (!marked.collapsed) {
			if (!frame.CSS?.highlights || !frame.Highlight) return;
			if (!owner.getElementById('dom-code-selection-style')) {
				const style = owner.createElement('style');
				style.id = 'dom-code-selection-style';
				style.textContent = '::highlight(dom-code-selection) { background-color: Highlight; color: HighlightText; }';
				owner.head.append(style);
			}
			frame.CSS.highlights.set('dom-code-selection', new frame.Highlight(marked));
			return;
		}
		const rect = marked.getClientRects()[0] || marked.getBoundingClientRect();
		if (!rect.height) return;
		const caret = owner.createElement('div');
		caret.dataset.designerOverlay = '';
		caret.setAttribute('aria-hidden', 'true');
		Object.assign(caret.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: '2px', height: `${rect.height}px`, background: 'Highlight', pointerEvents: 'none', zIndex: '2147483647' });
		caret.animate([{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], { duration: 1000, iterations: Infinity });
		owner.body.append(caret);
		shown.caret = caret;
	}

	// Starting an in-place edit drops the code's text selection, so one side is selected at a time.
	watch(editing, (value) => { if (value) { selection.value = null; markRange.value = null; } }, { flush: 'sync' });
	watch([selection, mapped, text, editing], () => nextTick(showSelection), { flush: 'post' });
	// A draft belongs to one file; switching files or closing the code shows the export again.
	watch(() => [activeFile.value?.id, open.value], reset);
	onBeforeUnmount(() => { clearTimeout(timer); clearSelection(); });

	return {
		shownDoc, mapped, offsets, source, text, highlight, draft, error, warning, selection, marks, view,
		edit, apply, applyText, selectLine, selectText, enter, leave, reset, forgetMarks, mark, clearSelection,
	};
}
