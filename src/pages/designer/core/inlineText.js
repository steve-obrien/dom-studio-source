import { cloneValue, isExpr, nodeId } from './editorDocument.js';

/**
 * Editing text in place on the canvas.
 *
 * A double-clicked paragraph, heading or other text element becomes
 * `contenteditable` in its artboard. The browser does the typing, selection
 * and marks (bold, italic, underline, strikethrough); nothing is written to
 * the document until the edit ends. Meanwhile `preview()` reads a copy of the
 * element on every change, so the code view shows the text and selection as
 * they are typed. When the edit ends the element's DOM is read back into
 * operations: text runs keep their ids (so the file keeps its formatting),
 * new marks become `<strong>`, `<em>`, `<u>` and `<s>` elements, and anything
 * the browser added that the file cannot hold is unwrapped.
 *
 * Only literal text and inline elements are edited this way. Text bound to
 * data (`{{ item.title }}`) and elements that mix text with components are
 * left to the Data panel and the inspector.
 */

/** Elements that may sit inside edited text. */
export const inlineTags = new Set(['a', 'abbr', 'b', 'br', 'code', 'em', 'i', 'kbd', 'mark', 's', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u']);
/** Elements the browser may create while editing, by the tag they are saved as. */
const createdTags = { b: 'strong', strong: 'strong', i: 'em', em: 'em', u: 'u', s: 's', strike: 's', br: 'br', sub: 'sub', sup: 'sup' };
const marks = { bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strikeThrough' };
/** Placeholders for the selection's ends while a copy of the edit is read (private-use characters, never typed). */
const ANCHOR = '\uE000';
const FOCUS = '\uE001';
const pointMarks = /[\uE000\uE001]/g;

function tagName(node) { return node.type.startsWith('html:') ? node.type.slice(5) : ''; }

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
 * @param {{ element: HTMLElement, doc: object, id: string, point?: { x: number, y: number }, onChange?: () => void, onEnd?: () => void }} options
 *   The rendered element and its node; `point` places the caret where the user double-clicked; `onChange` runs when the caret, selection or text changes; `onEnd` when the user finishes with Enter or Escape.
 * @returns {object} Session: `preview(doc)`, `marks()`, `toggle(mark)`, `operations(doc)` and `stop()`.
 */
export function beginInlineEdit({ element, doc, id, point, onChange = () => {}, onEnd = () => {} }) {
	const owner = element.ownerDocument;
	const view = owner.defaultView;
	// Rendered text nodes, matched to the runs they show, so the selection and edits find their source.
	const texts = new Map();
	const original = new Set();
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
			match(rendered[cursor++], childId);
		}
	})(element, id);

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
		if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.stopPropagation(); onEnd(); }
		else if (event.key === 'Enter') { event.preventDefault(); owner.execCommand('insertLineBreak'); }
		else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onEnd(); }
	}
	/** Pasted and dropped content arrives as plain text, so no foreign markup reaches the file. */
	function onPaste(event) {
		event.preventDefault();
		owner.execCommand('insertText', false, (event.clipboardData?.getData('text/plain') || '').replace(/\s+/g, ' '));
	}
	function onDrop(event) { event.preventDefault(); }
	owner.addEventListener('selectionchange', onSelection);
	element.addEventListener('keydown', onKeydown);
	element.addEventListener('paste', onPaste);
	element.addEventListener('drop', onDrop);
	element.addEventListener('input', onChange);
	onSelection();

	/** Restores the user's selection, which a click in the inspector can take away. */
	function restore() {
		element.focus({ preventScroll: true });
		if (saved && !inside()) { selection.removeAllRanges(); selection.addRange(saved); }
	}

	return {
		id,
		element,
		/**
		 * The edit as it would be saved now, read from a copy so the text being
		 * typed is never disturbed: operations against `current`, and where the
		 * selection's anchor and focus fall, as `{ id, offset }` in a text run
		 * of the edited document or `{ element }` between elements.
		 */
		preview(current) {
			const copy = element.cloneNode(true);
			const counterpart = new Map();
			(function pair(from, to) {
				counterpart.set(from, to);
				from.childNodes.forEach((child, index) => pair(child, to.childNodes[index]));
			})(element, copy);
			const copied = new Map();
			for (const [node, runId] of texts) if (counterpart.has(node)) copied.set(counterpart.get(node), runId);
			const found = {};
			if (inside()) {
				const points = [textPoint(selection.anchorNode, selection.anchorOffset, ANCHOR), textPoint(selection.focusNode, selection.focusOffset, FOCUS)];
				// The later point goes in first, so the earlier one's offset still holds.
				if (points[0].node === points[1].node && points[0].offset < points[1].offset) points.reverse();
				for (const point of points) {
					const target = counterpart.get(point.node);
					if (point.node.nodeType === 3 && target) target.data = target.data.slice(0, point.offset) + point.mark + target.data.slice(point.offset);
					else {
						const host = (point.node.nodeType === 1 ? point.node : point.node.parentElement)?.closest('[data-designer-id]');
						found[point.mark] = { element: host && element.contains(host) ? host.dataset.designerId : id };
					}
				}
			}
			normalize(copy);
			let count = 0;
			// Ids for new runs count up, so the same text previews as the same operations.
			const operations = reconcile(current, id, copy, copied, original, () => `preview-${count++}`, found);
			return { operations, anchor: found[ANCHOR] || null, focus: found[FOCUS] || null };
		},
		/** Which marks the selection has, for the inspector's toggles. */
		marks() {
			return Object.fromEntries(Object.entries(marks).map(([name, command]) => [name, Boolean(owner.queryCommandState(command))]));
		},
		/** Toggles bold, italic, underline or strikethrough on the selected text. */
		toggle(mark) {
			if (!marks[mark]) return;
			restore();
			owner.execCommand('styleWithCSS', false, false);
			owner.execCommand(marks[mark]);
			onSelection();
		},
		/** Reads the edited element back into operations against the current document. */
		operations(current, { makeId = nodeId } = {}) {
			normalize(element);
			return reconcile(current, id, element, texts, original, makeId);
		},
		stop() {
			owner.removeEventListener('selectionchange', onSelection);
			element.removeEventListener('keydown', onKeydown);
			element.removeEventListener('paste', onPaste);
			element.removeEventListener('drop', onDrop);
			element.removeEventListener('input', onChange);
			element.removeAttribute('contenteditable');
			element.style.cursor = '';
			element.style.outline = '';
			selection.removeAllRanges();
		},
	};
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

/** Turns what the browser produced into elements the file can hold: `<b>` becomes `<strong>`, styled spans are unwrapped. */
function normalize(el) {
	for (let child of [...el.childNodes]) {
		if (child.nodeType === 8) { child.remove(); continue; }
		if (child.nodeType !== 1) continue;
		const known = child.dataset.designerId;
		const tag = child.tagName.toLowerCase();
		if (!known) {
			const wanted = createdTags[tag];
			if (!wanted) {
				normalize(child);
				child.replaceWith(...child.childNodes);
				continue;
			}
			if (wanted !== tag) {
				const renamed = child.ownerDocument.createElement(wanted);
				renamed.append(...child.childNodes);
				child.replaceWith(renamed);
				child = renamed;
			}
			for (const name of child.getAttributeNames()) child.removeAttribute(name);
		}
		normalize(child);
		if (!known && tag !== 'br' && !child.textContent) child.remove();
	}
	el.normalize();
}

/**
 * Operations that make the document's subtree at `hostId` match the edited DOM.
 * Runs keep their ids where the DOM still holds their text node; elements keep
 * theirs by `data-designer-id`. Ops are computed against a running copy of the
 * child lists, so they apply in order. Selection placeholders in the text are
 * taken out and their places recorded in `found`.
 */
function reconcile(doc, hostId, element, texts, original, makeId, found = null) {
	const operations = [];
	const children = new Map();
	const parents = new Map();
	const claimed = new Set();
	const listOf = (id) => {
		if (!children.has(id)) children.set(id, [...(doc.nodes[id]?.children || [])]);
		return children.get(id);
	};
	const parentOf = (id) => (parents.has(id) ? parents.get(id) : doc.nodes[id]?.parent);
	const exists = (id) => Boolean(doc.nodes[id]) && !parents.has(`removed:${id}`);

	function place(id, parent, index) {
		const from = parentOf(id);
		const list = listOf(from);
		if (from === parent && list[index] === id) return;
		list.splice(list.indexOf(id), 1);
		listOf(parent).splice(index, 0, id);
		parents.set(id, parent);
		operations.push({ op: 'move', id, parent, index });
	}
	function add(parent, index, entry) {
		listOf(parent).splice(index, 0, entry.id);
		children.set(entry.id, []);
		parents.set(entry.id, parent);
		claimed.add(entry.id);
		operations.push({ op: 'insert', parent, index, fragment: { rootId: entry.id, nodes: { [entry.id]: { ...entry, parent, children: [] } } } });
	}

	(function visit(parent, el) {
		let index = 0;
		for (const child of [...el.childNodes]) {
			if (child.nodeType === 3) {
				// The browser keeps typed spaces with no-break spaces; the file holds plain, single ones.
				let value = child.data.replace(/\s+/g, ' ');
				const points = [];
				if (found) {
					const plain = (text) => text.replace(pointMarks, '').replace(/\s+/g, ' ');
					for (const mark of [ANCHOR, FOCUS]) {
						const at = value.indexOf(mark);
						if (at >= 0) points.push({ mark, offset: plain(value.slice(0, at)).length });
					}
					value = plain(value);
				}
				if (!value) { for (const point of points) found[point.mark] = { element: parent }; continue; }
				let id = texts.get(child);
				if (id && original.has(id) && !claimed.has(id) && doc.nodes[id]?.type === 'text') {
					claimed.add(id);
					place(id, parent, index);
					if (String(doc.nodes[id].props.value ?? '') !== value) operations.push({ op: 'setText', id, value });
				} else {
					id = makeId();
					add(parent, index, { id, type: 'text', props: { value } });
				}
				for (const point of points) found[point.mark] = { id, offset: Math.min(point.offset, value.length) };
				index += 1;
				continue;
			}
			if (child.nodeType !== 1) continue;
			const known = child.dataset.designerId;
			// An element the browser made that holds only the caret (bold switched on, nothing typed yet) is not text yet.
			if (found && !known && child.tagName !== 'BR' && !child.textContent.replace(pointMarks, '')) {
				for (const mark of child.textContent) found[mark] = { element: parent };
				continue;
			}
			if (known && original.has(known) && !claimed.has(known)) {
				claimed.add(known);
				place(known, parent, index);
				visit(known, child);
			} else {
				// A known id seen twice is the browser splitting an element; the copy keeps its attributes.
				const source = known && doc.nodes[known];
				const id = makeId();
				add(parent, index, source ? { id, type: source.type, props: cloneValue(source.props) } : { id, type: `html:${child.tagName.toLowerCase()}`, props: {} });
				visit(id, child);
			}
			index += 1;
		}
	})(hostId, element);

	// Whatever the DOM no longer shows is removed, outermost first.
	for (const id of original) {
		if (id === hostId || claimed.has(id) || !exists(id)) continue;
		const from = parentOf(id);
		if (from && !claimed.has(from) && from !== hostId && original.has(from) && exists(from)) continue;
		const list = listOf(from);
		list.splice(list.indexOf(id), 1);
		markRemoved(id);
		operations.push({ op: 'remove', id });
	}
	function markRemoved(id) {
		parents.set(`removed:${id}`, true);
		for (const child of listOf(id)) markRemoved(child);
	}
	return operations;
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
