import { cloneValue, nodeId, subtreeIds } from './editorDocument.js';

/**
 * Rich text as the editor's own model.
 *
 * A paragraph, heading or other text element holds text runs and inline
 * elements (`<strong>`, `<em>`, `<a>`…). For editing, that subtree is read as
 * a flat list of pieces: each piece is a stretch of text (or a `<br>`) with
 * the inline elements it sits in, outermost first. Character offsets count
 * across the whole element, with a `<br>` as one character.
 *
 * Edits are made on the pieces: marking or unmarking a range, replacing a
 * range with text, inserting a line break. The pieces are then built back
 * into DOM, and `reconcile` turns that DOM into operations on the document.
 * Elements keep their ids where they still hold the same text, text runs keep
 * theirs, and an element split in two keeps its attributes on both halves.
 *
 * The canvas (inlineText.js) and the code panel (useCodeSync.js) both edit
 * through here, so a mark means the same thing wherever it is made.
 */

/** Elements that may sit inside edited text. */
export const inlineTags = new Set(['a', 'abbr', 'b', 'br', 'code', 'em', 'i', 'kbd', 'mark', 's', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u']);
/** The elements each mark is written as; the first is used for new marks. */
export const markTags = { bold: ['strong', 'b'], italic: ['em', 'i'], underline: ['u'], strike: ['s', 'del', 'strike'] };
/** Elements the browser may create while editing, by the tag they are saved as. */
const createdTags = { b: 'strong', strong: 'strong', i: 'em', em: 'em', u: 'u', s: 's', strike: 's', br: 'br', sub: 'sub', sup: 'sup' };
/** Placeholders for two points while edited DOM is read (private-use characters, never typed). */
export const ANCHOR = '';
export const FOCUS = '';
const pointMarks = /[]/g;
const markTagSet = new Set(Object.values(markTags).flat());

/** An HTML node's tag, or '' for components and text. */
export function tagName(node) { return node?.type.startsWith('html:') ? node.type.slice(5) : ''; }

/**
 * The text of an element as pieces: `{ text, run, stack }`, or `{ text: '\n', br, stack }`
 * for a line break. `stack` lists the inline elements around the piece,
 * outermost first, as `{ id, tag }`.
 *
 * @param {object} doc Editor document.
 * @param {string} hostId The text element.
 * @returns {Array<object>} Pieces in reading order.
 */
export function flatten(doc, hostId) {
	const pieces = [];
	(function walk(id, stack) {
		for (const childId of doc.nodes[id]?.children || []) {
			const child = doc.nodes[childId];
			if (!child) continue;
			if (child.type === 'text') {
				const text = String(child.props.value ?? '');
				if (text) pieces.push({ text, run: childId, stack });
			} else if (tagName(child) === 'br') pieces.push({ text: '\n', br: childId, stack });
			else walk(childId, [...stack, { id: childId, tag: tagName(child) }]);
		}
	})(hostId, []);
	return pieces;
}

/** Total length of pieces. */
export function lengthOf(pieces) { return pieces.reduce((sum, piece) => sum + piece.text.length, 0); }

/** Where a text run starts in the element's offsets, or -1. */
export function runStart(pieces, runId) {
	let at = 0;
	for (const piece of pieces) {
		if (piece.run === runId) return at;
		at += piece.text.length;
	}
	return -1;
}

/** Splits pieces so that each offset falls between two pieces. */
function splitAt(pieces, offsets) {
	const result = [];
	let at = 0;
	for (const piece of pieces) {
		const cuts = piece.br ? [] : offsets.filter((offset) => offset > at && offset < at + piece.text.length).sort((a, b) => a - b);
		let from = 0;
		for (const cut of [...new Set(cuts)]) {
			result.push({ ...piece, text: piece.text.slice(from, cut - at) });
			from = cut - at;
		}
		result.push(from ? { ...piece, text: piece.text.slice(from) } : piece);
		at += piece.text.length;
	}
	return result;
}

/** Pieces with their offsets, `{ piece, start, end }`. */
function spans(pieces) {
	let at = 0;
	return pieces.map((piece) => {
		const span = { piece, start: at, end: at + piece.text.length };
		at = span.end;
		return span;
	});
}

function hasMark(piece, mark) { return piece.stack.some((entry) => markTags[mark].includes(entry.tag)); }

/**
 * Which marks the text between two offsets has: a mark counts when all of
 * that text has it. With no range, the marks typing at `start` would get
 * (the text before the caret, else after it).
 */
export function marksAt(pieces, start, end = start) {
	const covered = spans(pieces).filter(({ piece, start: from, end: to }) => !piece.br && (start < end ? from < end && to > start : from < start && to >= start));
	if (!covered.length && start === end) {
		const after = spans(pieces).find(({ piece, start: from }) => !piece.br && from === start);
		if (after) covered.push(after);
	}
	return Object.fromEntries(Object.keys(markTags).map((mark) => [mark, covered.length > 0 && covered.every(({ piece }) => hasMark(piece, mark))]));
}

/**
 * Turns a mark on or off for the text between two offsets.
 *
 * @param {Array<object>} pieces Pieces from `flatten`.
 * @param {number} start Start offset.
 * @param {number} end End offset.
 * @param {string} mark `bold`, `italic`, `underline` or `strike`.
 * @param {boolean} [on] Whether to add the mark; by default it is added unless all the text has it.
 * @returns {Array<object>} New pieces.
 */
export function toggleMark(pieces, start, end, mark, on = !marksAt(pieces, start, end)[mark]) {
	if (start >= end || !markTags[mark]) return pieces;
	const parts = splitAt(pieces, [start, end]);
	const inside = spans(parts).filter(({ piece, start: from, end: to }) => from >= start && to <= end && !piece.br).map(({ piece }) => piece);
	if (!on) return parts.map((piece) => (inside.includes(piece) ? { ...piece, stack: piece.stack.filter((entry) => !markTags[mark].includes(entry.tag)) } : piece));
	// The new element goes inside the elements all the marked text shares, so it wraps as much as it can in one.
	let shared = inside[0]?.stack || [];
	for (const piece of inside) {
		let depth = 0;
		while (depth < shared.length && sameEntry(piece.stack[depth], shared[depth])) depth += 1;
		shared = shared.slice(0, depth);
	}
	const added = { id: null, tag: markTags[mark][0], key: Symbol(mark) };
	return parts.map((piece) => {
		if (!inside.includes(piece) || hasMark(piece, mark)) return piece;
		const depth = Math.min(shared.length, piece.stack.length);
		return { ...piece, stack: [...piece.stack.slice(0, depth), added, ...piece.stack.slice(depth)] };
	});
}

function sameEntry(a, b) { return Boolean(a && b) && (a.id ? a.id === b.id : a.key === b.key); }

/**
 * Replaces the text between two offsets with `text`; line breaks in it become `<br>`.
 * The new text takes the inline elements of the text before it (else after
 * it), changed by `marks` (`{ bold: true }` adds bold, `false` takes it off).
 *
 * @returns {{ pieces: Array<object>, caret: number }} New pieces and the offset after the new text.
 */
export function replaceRange(pieces, start, end, text = '', marks = null) {
	const parts = splitAt(pieces, [start, end]);
	const all = spans(parts);
	const before = all.filter((span) => span.end <= start);
	const after = all.filter((span) => span.start >= end && span.start >= start);
	const neighbour = [...before].reverse().find((span) => !span.piece.br) || after.find((span) => !span.piece.br) || before.at(-1) || after[0];
	let stack = neighbour?.piece.stack || [];
	for (const [mark, on] of Object.entries(marks || {})) {
		if (!markTags[mark]) continue;
		const has = stack.some((entry) => markTags[mark].includes(entry.tag));
		if (on && !has) stack = [...stack, { id: null, tag: markTags[mark][0], key: Symbol(mark) }];
		if (!on && has) stack = stack.filter((entry) => !markTags[mark].includes(entry.tag));
	}
	const inserted = [];
	text.split('\n').forEach((line, index) => {
		if (index) inserted.push({ text: '\n', br: null, stack });
		if (line) inserted.push({ text: line, run: null, stack });
	});
	return { pieces: [...before.map((span) => span.piece), ...inserted, ...after.map((span) => span.piece)], caret: start + text.length };
}

/**
 * Builds pieces into DOM. Elements open and close as the pieces' stacks
 * change; an element that opens again after it closed is a copy of the same
 * element (it keeps its attributes, and `reconcile` gives it a new id).
 * Neighbouring marks of the same kind are merged, as are neighbouring text.
 *
 * @param {Array<object>} pieces Pieces.
 * @param {object} options
 * @param {Document} options.document Document to create nodes in.
 * @param {(entry: { id: string|null, tag: string }) => Element} options.element Creates an element for a stack entry.
 * @param {(id: string|null) => Element} [options.lineBreak] Creates a `<br>`.
 * @returns {{ fragment: DocumentFragment, texts: Map<Text, string>, position: (offset: number, bias?: 'left'|'right') => { node: Node, offset: number } }}
 */
export function buildInline(pieces, { document, element, lineBreak = () => document.createElement('br') }) {
	const fragment = document.createDocumentFragment();
	const texts = new Map();
	const usedRuns = new Set();
	const usedBreaks = new Set();
	let open = [];
	for (const piece of pieces) {
		let depth = 0;
		while (depth < open.length && depth < piece.stack.length && sameEntry(open[depth].entry, piece.stack[depth])) depth += 1;
		open = open.slice(0, depth);
		for (const entry of piece.stack.slice(depth)) {
			const el = element(entry);
			(open.at(-1)?.el || fragment).append(el);
			open.push({ entry, el });
		}
		const parent = open.at(-1)?.el || fragment;
		if (piece.text === '\n' && 'br' in piece) {
			const reuse = piece.br && !usedBreaks.has(piece.br);
			if (reuse) usedBreaks.add(piece.br);
			parent.append(lineBreak(reuse ? piece.br : null));
			continue;
		}
		const node = document.createTextNode(piece.text);
		parent.append(node);
		if (piece.run && !usedRuns.has(piece.run)) {
			usedRuns.add(piece.run);
			texts.set(node, piece.run);
		}
	}
	mergeSiblings(fragment, texts);
	return { fragment, texts, position: (offset, bias) => positionIn(fragment, offset, bias) };
}

/** Merges neighbouring marks of the same kind and neighbouring text, keeping ids where there are any. */
function mergeSiblings(parent, texts) {
	let child = parent.firstChild;
	while (child) {
		const next = child.nextSibling;
		if (next && child.nodeType === 3 && next.nodeType === 3) {
			child.data += next.data;
			if (!texts.has(child) && texts.has(next)) texts.set(child, texts.get(next));
			texts.delete(next);
			next.remove();
			continue;
		}
		if (next && child.nodeType === 1 && next.nodeType === 1 && child.tagName === next.tagName && markTagSet.has(child.tagName.toLowerCase()) && attributesKey(child) === attributesKey(next)) {
			const [keep, drop] = !child.dataset.designerId && next.dataset.designerId ? [next, child] : [child, next];
			if (keep === next) keep.prepend(...drop.childNodes);
			else keep.append(...drop.childNodes);
			drop.remove();
			child = keep;
			continue;
		}
		if (child.nodeType === 1) mergeSiblings(child, texts);
		child = next;
	}
}

function attributesKey(el) {
	return el.getAttributeNames().filter((name) => name !== 'data-designer-id').sort().map((name) => `${name}=${el.getAttribute(name)}`).join('\n');
}

/** Text nodes and line breaks in order, with their offsets. */
function leaves(root) {
	const list = [];
	let at = 0;
	(function walk(node) {
		for (const child of node.childNodes) {
			if (child.nodeType === 3) {
				const length = child.data.replace(pointMarks, '').length;
				list.push({ node: child, start: at, end: at + length });
				at += length;
			} else if (child.nodeType === 1 && child.tagName === 'BR') {
				if (child.dataset.designerPlaceholder === undefined) {
					list.push({ node: child, start: at, end: at + 1, br: true });
					at += 1;
				}
			} else if (child.nodeType === 1) walk(child);
		}
	})(root);
	return list;
}

/**
 * A DOM position for an offset: in a text node where there is one, else beside a line break.
 * At a boundary, `left` keeps to the text before it (where typing continues
 * its marks) and `right` to the text after.
 */
export function positionIn(root, offset, bias = 'left') {
	const list = leaves(root);
	const after = list.find((leaf) => leaf.br && leaf.end === offset);
	const besideBreak = after && { node: after.node.parentNode, offset: [...after.node.parentNode.childNodes].indexOf(after.node) + 1 };
	// Just after a line break the caret stays beside it, inside the same elements, as typing there would continue them.
	if (besideBreak && bias === 'left') return besideBreak;
	const texts = list.filter((leaf) => !leaf.br && leaf.start <= offset && offset <= leaf.end);
	const text = bias === 'right' ? texts.at(-1) : texts[0];
	if (text) return { node: text.node, offset: offset - text.start };
	if (besideBreak) return besideBreak;
	const before = list.find((leaf) => leaf.br && leaf.start === offset);
	if (before) return { node: before.node.parentNode, offset: [...before.node.parentNode.childNodes].indexOf(before.node) };
	return { node: root, offset: offset > 0 ? root.childNodes.length : 0 };
}

/**
 * Turns what the browser produced into elements the file can hold: `<b>` becomes `<strong>`, styled spans are unwrapped.
 *
 * The browser also rewrites the file's own elements: taking bold off a
 * `<strong>` turns it into `<span style="font-weight: normal">`, keeping its
 * attributes. An element whose tag no longer matches its layer in `doc` is
 * no longer that layer, so it is read like one the browser made.
 */
export function normalize(el, doc) {
	for (let child of [...el.childNodes]) {
		if (child.nodeType === 8) { child.remove(); continue; }
		if (child.nodeType !== 1) continue;
		if (child.dataset.designerPlaceholder !== undefined) continue;
		let known = child.dataset.designerId;
		const tag = child.tagName.toLowerCase();
		if (known && doc.nodes[known] && tagName(doc.nodes[known]) !== tag) {
			delete child.dataset.designerId;
			known = '';
		}
		if (!known) {
			const wanted = createdTags[tag];
			if (!wanted) {
				normalize(child, doc);
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
		normalize(child, doc);
		if (!known && tag !== 'br' && !child.textContent) child.remove();
	}
	el.normalize();
}

/**
 * Operations that make the document's subtree at `hostId` match the edited DOM.
 * Runs keep their ids where the DOM still holds their text node; elements keep
 * theirs by `data-designer-id`. Ops are computed against a running copy of the
 * child lists, so they apply in order. Point placeholders in the text are
 * taken out and their places recorded in `found`, as `{ id, offset, at }`
 * in a text run (`at` counts across the whole element) or `{ element, at }`.
 */
export function reconcile(doc, hostId, element, texts, original, makeId, found = null) {
	const operations = [];
	const children = new Map();
	const parents = new Map();
	const claimed = new Set();
	let cursor = 0;
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
				if (!value) { for (const point of points) found[point.mark] = { element: parent, at: cursor }; continue; }
				let id = texts.get(child);
				if (id && original.has(id) && !claimed.has(id) && doc.nodes[id]?.type === 'text') {
					claimed.add(id);
					place(id, parent, index);
					if (String(doc.nodes[id].props.value ?? '') !== value) operations.push({ op: 'setText', id, value });
				} else {
					id = makeId();
					add(parent, index, { id, type: 'text', props: { value } });
				}
				for (const point of points) {
					const offset = Math.min(point.offset, value.length);
					found[point.mark] = { id, offset, at: cursor + offset };
				}
				cursor += value.length;
				index += 1;
				continue;
			}
			if (child.nodeType !== 1) continue;
			// The extra line break that keeps an empty last line visible is not part of the text.
			if (child.dataset.designerPlaceholder !== undefined) continue;
			const known = child.dataset.designerId;
			// An element the browser made that holds only the caret (bold switched on, nothing typed yet) is not text yet.
			if (found && !known && child.tagName !== 'BR' && !child.textContent.replace(pointMarks, '')) {
				for (const mark of child.textContent) found[mark] = { element: parent, at: cursor };
				continue;
			}
			if (known && original.has(known) && !claimed.has(known)) {
				claimed.add(known);
				place(known, parent, index);
				visit(known, child);
			} else {
				// A known id seen twice is an element split in two; the copy keeps its attributes.
				const source = known && doc.nodes[known];
				const id = makeId();
				add(parent, index, source ? { id, type: source.type, props: cloneValue(source.props) } : { id, type: `html:${child.tagName.toLowerCase()}`, props: {} });
				visit(id, child);
			}
			if (child.tagName === 'BR') cursor += 1;
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

/** The text element a run or inline element belongs to: its nearest ancestor that is not inline. */
export function textHost(doc, id) {
	let node = doc.nodes[doc.nodes[id]?.parent];
	while (node?.parent && inlineTags.has(tagName(node))) node = doc.nodes[node.parent];
	return node?.id || null;
}

/** Which marks a text run has from the inline elements around it. */
export function runMarks(doc, runId) {
	const tags = [];
	for (let node = doc.nodes[doc.nodes[runId]?.parent]; node && inlineTags.has(tagName(node)); node = doc.nodes[node.parent]) tags.push(tagName(node));
	return Object.fromEntries(Object.entries(markTags).map(([mark, list]) => [mark, tags.some((tag) => list.includes(tag))]));
}

/**
 * Operations that turn a mark on or off for a stretch of text in one text
 * element, as the canvas makes them. For edits outside the canvas, such as
 * text selected in the code.
 *
 * @param {object} doc Editor document.
 * @param {string} hostId The text element.
 * @param {number} start Start offset in the element's text.
 * @param {number} end End offset.
 * @param {string} mark Mark name.
 * @param {{ document: Document, on?: boolean, makeId?: () => string }} options DOM to build in, whether to add the mark, and new ids.
 * @returns {{ operations: Array<object>, start: object|null, end: object|null }} Operations, and where the marked text is afterwards (`{ id, offset }`).
 */
export function markOperations(doc, hostId, start, end, mark, { document, on, makeId = nodeId }) {
	const pieces = toggleMark(flatten(doc, hostId), start, end, mark, on);
	const built = buildInline(pieces, { document, element: (entry) => elementFor(document, entry), lineBreak: (id) => elementFor(document, { id, tag: 'br' }) });
	const container = document.createElement('div');
	container.append(built.fragment);
	// The later point goes in first, so the earlier one's place still holds.
	placeMarker(positionIn(container, end, 'left'), FOCUS, document);
	placeMarker(positionIn(container, start, 'right'), ANCHOR, document);
	const found = {};
	const operations = reconcile(doc, hostId, container, built.texts, new Set(subtreeIds(doc, hostId)), makeId, found);
	return { operations, start: found[ANCHOR] || null, end: found[FOCUS] || null };
}

function elementFor(document, { id, tag }) {
	const el = document.createElement(tag);
	if (id) el.dataset.designerId = id;
	return el;
}

/** Puts a point placeholder at a DOM position. */
export function placeMarker({ node, offset }, mark, document) {
	if (node.nodeType === 3) node.data = node.data.slice(0, offset) + mark + node.data.slice(offset);
	else node.insertBefore(document.createTextNode(mark), node.childNodes[offset] || null);
}
