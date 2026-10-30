import { cloneValue, isExpr, nodeId } from './editorDocument.js';
import { applyOperations } from './operations.js';
import { ANCHOR, FOCUS, buildInline, flatten, inlineTags, marksAt, normalize, positionIn, reconcile, replaceRange, tagName, toggleMark } from './richText.js';

export { inlineTags };

/**
 * Editing text in place on the canvas.
 *
 * A double-clicked paragraph, heading or other text element becomes
 * `contenteditable` in its artboard. The element is the editor's view of the
 * text, and the document is its model: contenteditable is used to find out
 * what the user means, not to decide the result.
 *
 * - Typing characters is left to the browser, so input methods (Chinese,
 *   Japanese, Korean), spellcheck, autocorrect and phone keyboards work as
 *   they do everywhere. Only the text node being typed in changes.
 * - Everything that changes structure is done on the model (richText.js) and
 *   the element is drawn again from it: bold, italic, underline and strike,
 *   line breaks, paste, cut, typing over a selection, and deleting across
 *   elements. The browser's `execCommand` is not used, so its markup (styled
 *   spans, `<b>`) never decides what is saved.
 * - Undo and redo inside the edit step through the model's states.
 *
 * Nothing is written to the document until the edit ends. Meanwhile
 * `preview()` reads a copy of the element on every change, so the code view
 * shows the text and selection as they are typed. When the edit ends the
 * element is read back into operations: text runs keep their ids (so the file
 * keeps its formatting) and marks are `<strong>`, `<em>`, `<u>` and `<s>`.
 *
 * Only literal text and inline elements are edited this way. Text bound to
 * data (`{{ item.title }}`) and elements that mix text with components are
 * left to the Data panel and the inspector.
 */

const markInputs = { formatBold: 'bold', formatItalic: 'italic', formatUnderline: 'underline', formatStrikeThrough: 'strike' };
const markKeys = { b: 'bold', i: 'italic', u: 'underline' };
/** Typing in one burst is one undo step inside the edit. */
const typingPause = 1000;

/** Why a node cannot be edited in place, or '' when it can. */
function problemWith(doc, node, top) {
	if (!node || !node.type.startsWith('html:')) return 'Only text elements can be edited on the canvas.';
	if (node.locked) return 'This layer is locked.';
	if ((node.directives || []).some((source) => /^v-(html|text)\b/.test(source))) return 'This text is set by a directive. Edit it in the code.';
	if (!top && (node.directives || []).length) return 'Part of this text has its own logic (v-if, v-for). Edit it in the code.';
	if (!node.children.length && top) return 'This layer has no text to edit.';
	for (const id of node.children) {
		const child = doc.nodes[id];
		if (!child) continue;
		if (child.type === 'text') {
			if (isExpr(child.props.value)) return `This text comes from data ({{ ${child.props.value.expr} }}). Change it in the Data panel.`;
			continue;
		}
		if (!inlineTags.has(tagName(child))) return 'This layer holds other layers as well as text. Double-click the text itself.';
		const inner = problemWith(doc, child, false);
		if (inner) return inner;
	}
	return '';
}

/**
 * Finds the element to edit for a double-clicked layer: the nearest text
 * element, so double-clicking a bold word edits its whole paragraph.
 *
 * @param {object} doc Editor document.
 * @param {string} id Double-clicked layer.
 * @returns {{ id?: string, error?: string }} The element to edit, or why there is none.
 */
export function inlineEditTarget(doc, id) {
	let node = doc.nodes[id];
	while (node?.parent && inlineTags.has(tagName(node)) && !problemWith(doc, doc.nodes[node.parent], true)) node = doc.nodes[node.parent];
	const error = problemWith(doc, node, true);
	return error ? { error } : { id: node.id };
}

/**
 * Makes a rendered element editable in place.
 *
 * @param {{ element: HTMLElement, doc: object, id: string, point?: { x: number, y: number }, getDoc?: () => object, onChange?: () => void, onEnd?: () => void }} options
 *   `getDoc` returns the document as it is now, if it can change while the text is edited.
 * @returns {object} Session: `preview(doc)`, `marks()`, `toggle(mark)`, `operations(doc)` and `stop()`.
 */
export function beginInlineEdit({ element, doc, id, point, getDoc = () => doc, onChange = () => {}, onEnd = () => {} }) {
	const owner = element.ownerDocument;
	// Rendered text nodes, matched to the runs they show, so the selection and edits find their source.
	const texts = new Map();
	const original = new Set();
	// The rendered inline elements without their content, so text drawn again keeps their attributes.
	const shells = new Map();
	(function match(el, nodeIdValue) {
		const node = doc.nodes[nodeIdValue];
		original.add(nodeIdValue);
		const rendered = [...el.childNodes].filter((child) => child.nodeType === 1 || child.nodeType === 3);
		let cursor = 0;
		for (const childId of node.children) {
			const child = doc.nodes[childId];
			if (!child) continue;
			if (child.type === 'text') {
				const found = rendered.slice(cursor).findIndex((item) => item.nodeType === 3);
				if (found === -1) continue;
				cursor += found;
				texts.set(rendered[cursor++], childId);
				original.add(childId);
				continue;
			}
			const found = rendered.slice(cursor).findIndex((item) => item.nodeType === 1 && item.dataset.designerId === childId);
			if (found === -1) continue;
			cursor += found;
			shells.set(childId, rendered[cursor].cloneNode(false));
			match(rendered[cursor++], childId);
		}
	})(element, id);

	// The last reading of the element, reused while it has not changed.
	let last = null;
	// Marks for the next text typed at a caret, as toggled with nothing selected: `{ at, marks }`.
	let pending = null;
	// Undo inside the edit: states of the text before each change.
	const past = [];
	const future = [];
	let burst = { kind: '', time: 0 };

	const editable = makeEditable({ element, point, onChange, onEnd, rich: { keydown: onKeydown, beforeinput: onBeforeInput, cut: onCut, paste: onPaste, lineBreak: () => insert('\n') } });
	const { selection, inside, restore } = editable;

	/** The selection's ends as DOM points, the later one first when both are in one node. */
	function selectionEnds() {
		if (!inside()) return [];
		return ordered([textPoint(selection.anchorNode, selection.anchorOffset, ANCHOR), textPoint(selection.focusNode, selection.focusOffset, FOCUS)]);
	}
	function rangeEnds(range) {
		return ordered([textPoint(range.startContainer, range.startOffset, ANCHOR), textPoint(range.endContainer, range.endOffset, FOCUS)]);
	}
	function ordered(points) {
		if (points[0].node === points[1].node && points[0].offset < points[1].offset) points.reverse();
		return points;
	}

	/**
	 * Reads the element as the edit would save it, from a copy so the text
	 * being typed is never disturbed: operations against `current`, the
	 * document they make, and where two DOM points fall (the selection's ends
	 * by default), as `{ id, offset, at }` in a text run of that document or
	 * `{ element, at }` between elements. `at` counts across the whole text.
	 */
	function read(current = getDoc(), ends = selectionEnds()) {
		const copy = element.cloneNode(true);
		const counterpart = new Map();
		(function pair(from, to) {
			counterpart.set(from, to);
			from.childNodes.forEach((child, index) => pair(child, to.childNodes[index]));
		})(element, copy);
		const copied = new Map();
		for (const [node, runId] of texts) if (counterpart.has(node)) copied.set(counterpart.get(node), runId);
		for (const end of ends) {
			const target = counterpart.get(end.node);
			if (!target) continue;
			if (target.nodeType === 3) target.data = target.data.slice(0, end.offset) + end.mark + target.data.slice(end.offset);
			else target.insertBefore(owner.createTextNode(end.mark), target.childNodes[end.offset] || null);
		}
		normalize(copy, current);
		const found = {};
		let count = 0;
		// Ids for new runs count up, so the same text reads as the same operations.
		const operations = reconcile(current, id, copy, copied, original, () => `preview-${count++}`, found);
		const key = JSON.stringify(operations);
		let next = current;
		if (last?.base === current && last.key === key) next = last.doc;
		else if (operations.length) {
			try { next = cloneValue(current); applyOperations(next, operations); }
			catch { next = current; }
		}
		last = { base: current, key, doc: next, anchor: found[ANCHOR] || null, focus: found[FOCUS] || null };
		return { operations, doc: next, anchor: last.anchor, focus: last.focus };
	}

	/** The text as pieces, with two points (the selection by default) as offsets. */
	function model(ends) {
		const state = read(getDoc(), ends);
		return withOffsets(flatten(state.doc, id), state.anchor, state.focus);
	}
	function withOffsets(pieces, anchor, focus) {
		const a = anchor?.at ?? focus?.at;
		const f = focus?.at ?? anchor?.at;
		if (a === undefined) return { pieces, start: null, end: null };
		return { pieces, start: Math.min(a, f), end: Math.max(a, f) };
	}

	/** Draws the element afresh from pieces and selects between two offsets. */
	function draw(pieces, start, end = start) {
		const shell = (entryId, tag) => (entryId && shells.has(entryId) ? shells.get(entryId).cloneNode(false) : owner.createElement(tag));
		const built = buildInline(pieces, { document: owner, element: (entry) => shell(entry.id, entry.tag), lineBreak: (breakId) => shell(breakId, 'br') });
		element.replaceChildren(built.fragment);
		// A line break at the very end needs a second one to show the empty line after it.
		if (pieces.at(-1)?.text === '\n') {
			const placeholder = owner.createElement('br');
			placeholder.dataset.designerPlaceholder = '';
			element.append(placeholder);
		}
		texts.clear();
		for (const [node, runId] of built.texts) texts.set(node, runId);
		const from = positionIn(element, start, start === end ? 'left' : 'right');
		const to = start === end ? from : positionIn(element, end, 'left');
		const range = owner.createRange();
		range.setStart(from.node, from.offset);
		range.setEnd(to.node, to.offset);
		selection.removeAllRanges();
		selection.addRange(range);
		editable.onSelection();
	}

	/** Keeps the text as it is before a change, for undo; a burst of typing is one step. */
	function remember(kind, state = null) {
		const now = Date.now();
		const continues = kind === burst.kind && kind !== 'edit' && now - burst.time < typingPause;
		burst = { kind, time: now };
		if (continues) return;
		const snapshot = state || model();
		if (snapshot.start === null) return;
		past.push({ pieces: snapshot.pieces, start: snapshot.start, end: snapshot.end });
		if (past.length > 200) past.shift();
		future.length = 0;
	}
	function step(from, to) {
		if (!from.length) return;
		const current = model();
		to.push({ pieces: current.pieces, start: current.start ?? 0, end: current.end ?? 0 });
		const state = from.pop();
		burst = { kind: '', time: 0 };
		pending = null;
		draw(state.pieces, state.start, state.end);
	}
	function undo() { step(past, future); }
	function redo() { step(future, past); }

	/** Changes the text on the model, between two DOM points (the selection by default), and draws the result. */
	function change(edit, ends) {
		const state = model(ends);
		if (state.start === null) return;
		remember('edit', state);
		const next = edit(state);
		pending = null;
		if (next) draw(next.pieces, next.start, next.end ?? next.start);
	}

	/** Replaces the selection (or the range between `ends`) with text; at a caret, marks toggled there apply to it. */
	function insert(text, ends) {
		change(({ pieces, start, end }) => {
			const marks = pending && pending.at === start && start === end ? pending.marks : null;
			const next = replaceRange(pieces, start, end, text, marks);
			return { pieces: next.pieces, start: next.caret };
		}, ends);
	}

	/** A mark from the Text panel or a shortcut: on the selected text, or for the next text typed at a caret. */
	function toggleSelection(mark) {
		const state = model();
		if (state.start === null) return;
		if (state.start === state.end) {
			const marks = { ...(pending?.at === state.start ? pending.marks : {}) };
			marks[mark] = !(mark in marks ? marks[mark] : marksAt(state.pieces, state.start)[mark]);
			pending = { at: state.start, marks };
			onChange();
			return;
		}
		remember('edit', state);
		pending = null;
		draw(toggleMark(state.pieces, state.start, state.end, mark), state.start, state.end);
	}

	/** Whether a range stays inside one text node, where the browser's own edit changes nothing else. */
	function withinText(range) {
		const node = range?.startContainer;
		return Boolean(node) && node === range.endContainer && node.nodeType === 3 && element.contains(node) && (range.collapsed || range.endOffset - range.startOffset < node.data.length);
	}

	/**
	 * Whether the browser can type this itself: inside a text node, away from
	 * its start, where it means to. At the start of a text node the text
	 * before decides the marks (typing after a line break inside bold stays
	 * bold), and where the browser moves the caret to type (past a line break,
	 * over a collapsed space) the model types at the caret instead.
	 */
	function typesInPlace(type, range) {
		if (!withinText(range)) return false;
		if (type !== 'insertText' || !range.collapsed) return true;
		return selection.isCollapsed && selection.anchorNode === range.startContainer && selection.anchorOffset === range.startOffset && range.startOffset > 0;
	}

	function onKeydown(event) {
		const key = event.key.toLowerCase();
		if (!(event.metaKey || event.ctrlKey) || event.altKey) return false;
		if (markKeys[key] && !event.shiftKey) toggleSelection(markKeys[key]);
		else if (key === 'z') (event.shiftKey ? redo : undo)();
		else if (key === 'y' && !event.shiftKey) redo();
		else return false;
		event.preventDefault();
		return true;
	}

	/** Every edit the browser is about to make: typing is left to it, anything that changes structure is made on the model. */
	function onBeforeInput(event) {
		const type = event.inputType;
		if (type === 'historyUndo' || type === 'historyRedo') { event.preventDefault(); (type === 'historyUndo' ? undo : redo)(); return; }
		if (type.startsWith('format')) { event.preventDefault(); if (markInputs[type]) toggleSelection(markInputs[type]); return; }
		// Input methods compose text in place and cannot be cancelled; the result is read back like typing.
		if (event.isComposing || /Composition/.test(type)) { remember('typing'); return; }
		const range = event.getTargetRanges?.()[0] || (inside() ? selection.getRangeAt(0) : null);
		const ends = range ? rangeEnds(range) : undefined;
		if (type === 'insertText' || type === 'insertReplacementText') {
			if (!pending && typesInPlace(type, range)) { remember('typing'); return; }
			event.preventDefault();
			insert(event.data ?? event.dataTransfer?.getData('text/plain') ?? '', type === 'insertText' && selection.isCollapsed ? undefined : ends);
			return;
		}
		if (type === 'insertLineBreak') { event.preventDefault(); insert('\n', ends); return; }
		if (type === 'insertParagraph') { event.preventDefault(); onEnd(); return; }
		if (type.startsWith('insertFrom')) {
			event.preventDefault();
			insert((event.dataTransfer?.getData('text/plain') ?? event.data ?? '').replace(/\s+/g, ' '), ends);
			return;
		}
		if (type.startsWith('delete')) {
			if (!range || withinText(range)) { remember('deleting'); return; }
			event.preventDefault();
			change(({ pieces, start, end }) => {
				const next = replaceRange(pieces, start, end, '');
				return { pieces: next.pieces, start: next.caret };
			}, ends);
			return;
		}
		// Lists, links, alignment and other commands make markup the text does not hold.
		event.preventDefault();
	}

	function onCut(event) {
		if (!inside() || selection.isCollapsed) return;
		event.preventDefault();
		event.clipboardData?.setData('text/plain', selection.toString());
		insert('');
	}
	/** Pasted content arrives as plain text, on one line, so no foreign markup reaches the file. */
	function onPaste(event) {
		event.preventDefault();
		insert((event.clipboardData?.getData('text/plain') || '').replace(/\s+/g, ' '));
	}

	return {
		id,
		element,
		/**
		 * The edit as it would be saved now: operations against `current`, the
		 * document they make, and where the selection's anchor and focus fall.
		 */
		preview(current) {
			return read(current);
		},
		/** Which marks the selection has, for the inspector's toggles; at a caret, those the next typed text gets. */
		marks() {
			const state = last ? withOffsets(flatten(last.doc, id), last.anchor, last.focus) : model();
			if (state.start === null) return marksAt([], 0);
			const result = marksAt(state.pieces, state.start, state.end);
			if (pending && (pending.at !== state.start || state.start !== state.end)) pending = null;
			return pending ? { ...result, ...pending.marks } : result;
		},
		/** Toggles bold, italic, underline or strikethrough on the selected text. */
		toggle(mark) {
			restore();
			toggleSelection(mark);
		},
		/** Reads the edited element back into operations against the current document. */
		operations(current, { makeId = nodeId } = {}) {
			normalize(element, current);
			return reconcile(current, id, element, texts, original, makeId);
		},
		stop: editable.stop,
	};
}

/**
 * The editing session: the element becomes `contenteditable`, takes focus with
 * the caret where the user double-clicked, and ends on Enter or Escape;
 * Shift+Enter breaks the line. The `rich` handlers take over keys, the
 * browser's edits (`beforeinput`), cut, paste and line breaks.
 */
function makeEditable({ element, point, onChange, onEnd, rich }) {
	const owner = element.ownerDocument;
	const view = owner.defaultView;
	let saved = null;
	element.contentEditable = 'true';
	element.spellcheck = true;
	element.style.cursor = 'text';
	element.style.outline = 'none';
	element.focus({ preventScroll: true });
	const selection = view.getSelection();
	const placed = point && owner.caretRangeFromPoint?.(point.x, point.y);
	if (placed && element.contains(placed.startContainer)) { selection.removeAllRanges(); selection.addRange(placed); }
	else if (!element.contains(selection.anchorNode)) { const range = owner.createRange(); range.selectNodeContents(element); range.collapse(false); selection.removeAllRanges(); selection.addRange(range); }

	function inside() { return selection.rangeCount && element.contains(selection.getRangeAt(0).commonAncestorContainer); }
	function onSelection() {
		if (!inside()) return;
		saved = selection.getRangeAt(0).cloneRange();
		onChange();
	}
	function onKeydown(event) {
		if (rich.keydown(event)) return;
		if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); onEnd(); }
		else if (event.key === 'Enter') { event.preventDefault(); rich.lineBreak(); }
		else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onEnd(); }
	}
	/** Pasted content arrives as plain text, and drops are refused, so no foreign markup reaches the file. */
	function onPaste(event) { rich.paste(event); }
	function onDrop(event) { event.preventDefault(); }
	function onDragstart(event) { event.preventDefault(); }
	function onBeforeInput(event) { rich.beforeinput(event); }
	function onCut(event) { rich.cut(event); }
	const listeners = [['keydown', onKeydown], ['paste', onPaste], ['drop', onDrop], ['dragstart', onDragstart], ['beforeinput', onBeforeInput], ['cut', onCut], ['input', onChange]];
	owner.addEventListener('selectionchange', onSelection);
	for (const [name, listener] of listeners) element.addEventListener(name, listener);
	onSelection();

	/** Restores the user's selection, which a click in the inspector can take away. */
	function restore() {
		element.focus({ preventScroll: true });
		if (saved && !inside()) { selection.removeAllRanges(); selection.addRange(saved); }
	}
	function stop() {
		owner.removeEventListener('selectionchange', onSelection);
		for (const [name, listener] of listeners) element.removeEventListener(name, listener);
		element.removeAttribute('contenteditable');
		element.style.cursor = '';
		element.style.outline = '';
		selection.removeAllRanges();
	}
	return { selection, inside, restore, onSelection, stop };
}

/** A selection end as a point in a text node where there is one beside it. */
function textPoint(node, offset, mark) {
	if (node?.nodeType === 1) {
		const before = node.childNodes[offset - 1];
		const after = node.childNodes[offset];
		if (before?.nodeType === 3) return { node: before, offset: before.data.length, mark };
		if (after?.nodeType === 3) return { node: after, offset: 0, mark };
	}
	return { node, offset, mark };
}

/**
 * Where each character of a text run's value sits in its source text. The
 * parser decodes entities and folds whitespace into single spaces, and export
 * may add a leading or trailing line break, so a run's value and its source
 * differ in length.
 *
 * @param {string} raw The run's text as written in the file.
 * @returns {number[]} For each value offset (and one past the end), the offset in `raw`.
 */
export function runOffsets(raw) {
	const at = [];
	let space = false;
	for (let index = 0; index < raw.length;) {
		if (raw.startsWith('<!--', index)) {
			const end = raw.indexOf('-->', index);
			index = end < 0 ? raw.length : end + 3;
			continue;
		}
		let length = 1;
		let units = 1;
		let blank = /\s/.test(raw[index]);
		const entity = raw[index] === '&' && /^&(#x[\da-f]+|#\d+|[a-z]+);/i.exec(raw.slice(index, index + 12));
		if (entity) {
			length = entity[0].length;
			const code = /^#x/i.test(entity[1]) ? parseInt(entity[1].slice(2), 16) : entity[1][0] === '#' ? parseInt(entity[1].slice(1), 10) : 0;
			if (code === 0xa0 || /^nbsp$/i.test(entity[1])) blank = true;
			else if (code > 0xffff) units = 2;
		}
		if (blank) {
			if (!space) at.push(index);
			space = true;
		} else {
			space = false;
			for (let unit = 0; unit < units; unit += 1) at.push(index);
		}
		index += length;
	}
	at.push(raw.length);
	return at;
}

/**
 * A text run offset as an offset in the exported source.
 *
 * @param {string} source Exported file.
 * @param {[number, number]} range The run's offsets in `source`.
 * @param {string} value The run's value.
 * @param {number} offset Offset in `value`.
 * @returns {number} Offset in `source`.
 */
export function sourceOffset(source, [start, end], value, offset) {
	const raw = source.slice(start, end);
	const at = runOffsets(raw);
	return start + at[Math.max(0, Math.min(offset + leadShift(raw, value), at.length - 1))];
}

/** 1 when the source starts with a line break the value does not have, as runs printed on their own line do. */
function leadShift(raw, value) {
	return /^\s/.test(raw) && !/^\s/.test(value) ? 1 : 0;
}

/**
 * A source offset inside a text run as an offset in the run's value.
 *
 * @param {string} source Exported file.
 * @param {[number, number]} range The run's offsets in `source`.
 * @param {string} value The run's value.
 * @param {number} offset Offset in `source`, clamped to the run.
 * @returns {number} Offset in `value`.
 */
export function runOffset(source, [start, end], value, offset) {
	const raw = source.slice(start, end);
	const at = runOffsets(raw);
	const local = Math.max(0, Math.min(offset, end) - start);
	let index = 0;
	while (index + 1 < at.length && at[index + 1] <= local) index += 1;
	return Math.max(0, Math.min(value.length, index - leadShift(raw, value)));
}
