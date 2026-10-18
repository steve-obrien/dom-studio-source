import { attributeEntries, buildTemplate } from '../canvas/canvasDocument.js';

/**
 * Patch-based Vue export: the file's own text, with only what changed rewritten.
 *
 * Importing a file records a source map beside it (`file.source`): the
 * original text, and for each node its offsets, its attributes' offsets and a
 * canonical form of how it prints. Export walks the current document against
 * that map. A subtree whose nodes all print as they did is copied from the
 * original text byte for byte; a changed element keeps its untouched
 * attributes, their order and the whitespace between children, and rewrites
 * only the attributes, text or children that differ. New nodes are printed and
 * indented to match their siblings.
 *
 * Export is a pure function of the document and the map, so undo and redo
 * return the text to exactly what it was. Script and style blocks, comments and
 * anything else outside the template's nodes are never touched.
 */

/** How a canvas node prints, for telling whether it changed. Text compares by value; elements by tag and attributes. */
export function canonicalNode(node, parent) {
	if (node.tag === '#text') return JSON.stringify(['#text', node.expression ? `{{ ${node.expression} }}` : node.text]);
	return JSON.stringify([node.tag, attributeEntries(node, parent)]);
}

/**
 * Builds the source map for a freshly imported file.
 *
 * @param {string} text The whole file.
 * @param {number} templateOffset Where the template content starts in `text`.
 * @param {object} parsedRoot Root canvas node from `parseTemplate`, with spans and the ids it was given.
 * @param {object} currentRoot The same tree from `toCanvasNode(doc)`, for canonical forms.
 * @returns {{ text: string, root: string, nodes: Record<string, object> }} Source map.
 */
export function createSourceMap(text, templateOffset, parsedRoot, currentRoot) {
	const nodes = {};
	(function walk(parsed, current, parent) {
		const span = parsed.span;
		const entry = { canon: canonicalNode(current, parent), children: current.children?.map((child) => child.id) || [] };
		if (span) {
			Object.assign(entry, { start: templateOffset + span.start, end: templateOffset + span.end });
			if (current.tag !== '#text') {
				Object.assign(entry, { tagEnd: templateOffset + span.tagEnd, closeStart: templateOffset + span.closeStart, closed: span.closed, attrs: span.attrs.map((attribute) => ({ ...attribute, start: templateOffset + attribute.start, end: templateOffset + attribute.end })) });
			}
		} else {
			// The wrapper the importer adds around several root nodes has no markup of its own.
			const first = parsed.children[0]?.span;
			const last = parsed.children.at(-1)?.span;
			Object.assign(entry, { synthetic: true, start: templateOffset + (first?.start ?? 0), end: templateOffset + (last?.end ?? 0) });
			Object.assign(entry, { tagEnd: entry.start, closeStart: entry.end, closed: true, attrs: [] });
		}
		nodes[current.id] = entry;
		(parsed.children || []).forEach((child, index) => walk(child, current.children[index], current));
	})(parsedRoot, currentRoot, null);
	return { text, root: currentRoot.id, nodes };
}

/** Renames the ids in a source map, as when reconciled nodes keep their previous ids. */
export function renameSourceMap(map, ids) {
	const rename = (id) => ids.get(id) || id;
	const nodes = Object.fromEntries(Object.entries(map.nodes).map(([id, entry]) => [rename(id), { ...entry, children: entry.children.map(rename) }]));
	return { ...map, root: rename(map.root), nodes };
}

/** The whitespace that indents the line `offset` is on. */
function lineIndent(text, offset) {
	const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
	return /^[ \t]*/.exec(text.slice(lineStart, offset))[0];
}

/**
 * Exports a canvas tree against a source map.
 *
 * @param {object} root Current root canvas node (`toCanvasNode(doc)`).
 * @param {object} map Source map from `createSourceMap`.
 * @returns {{ source: string, offsets: Record<string, [number, number]> } | null} The file and each node's offsets, or null when the tree no longer fits the map.
 */
export function patchSource(root, map) {
	const base = map.nodes[map.root];
	if (!base || root.id !== map.root) return null;
	const { text } = map;
	const parts = [];
	const offsets = {};
	let length = 0;
	let unfit = false;
	const push = (value) => { parts.push(value); length += value.length; };

	/** Whether a subtree prints exactly as in the source, so it can be copied. */
	function clean(node, parent) {
		const entry = map.nodes[node.id];
		if (!entry || entry.synthetic || entry.canon !== canonicalNode(node, parent)) return false;
		const children = node.children || [];
		if (children.length !== entry.children.length || children.some((child, index) => child.id !== entry.children[index])) return false;
		return children.every((child) => clean(child, node));
	}

	/** Records copied offsets for a clean subtree that starts at `at` in the output. */
	function markCopied(node, at, origin) {
		const entry = map.nodes[node.id];
		offsets[node.id] = [at + entry.start - origin, at + entry.end - origin];
		(node.children || []).forEach((child) => markCopied(child, at, origin));
	}

	/** Prints a node that has no place in the source, indented like `indent`. */
	function fresh(node, parent, indent) {
		const local = {};
		const lines = buildTemplate(node, local, parent).split('\n');
		const starts = [];
		let at = length;
		lines.forEach((line, index) => { starts.push(at); at += (index ? indent.length : 0) + line.length + 1; });
		push(lines.map((line, index) => (index ? indent + line : line)).join('\n'));
		for (const [id, range] of Object.entries(local)) offsets[id] = [starts[range.start] + (range.start ? indent.length : 0), starts[range.end] + lines[range.end].length + (range.end ? indent.length : 0)];
	}

	/** The opening tag with only changed attributes rewritten; kept attributes stay in place and in order. */
	function openTag(node, parent, entry) {
		const wanted = new Map(attributeEntries(node, parent).map((attribute) => [attribute.key, attribute.text]));
		const was = new Map(JSON.parse(entry.canon)[1].map((attribute) => [attribute.key, attribute.text]));
		let out = '';
		let cursor = entry.start;
		for (const attribute of entry.attrs) {
			const gapStart = cursor;
			if (attribute.kept || (wanted.has(attribute.key) && wanted.get(attribute.key) === was.get(attribute.key))) {
				out += text.slice(gapStart, attribute.end);
			} else if (wanted.has(attribute.key)) {
				out += text.slice(gapStart, attribute.start) + wanted.get(attribute.key);
			} else {
				// Removed: drop the attribute and the space before it.
				out += text.slice(gapStart, attribute.start).replace(/\s+$/, '');
			}
			cursor = attribute.end;
			wanted.delete(attribute.key);
		}
		const tail = text.slice(cursor, entry.tagEnd);
		const added = [...wanted.values()];
		if (!added.length) return out + tail;
		const close = /\s*\/?>$/.exec(tail);
		return `${out}${tail.slice(0, close.index)} ${added.join(' ')}${tail.slice(close.index)}`;
	}

	function emit(node, parent, indent) {
		const entry = map.nodes[node.id];
		const start = length;
		if (entry && clean(node, parent)) {
			push(text.slice(entry.start, entry.end));
			markCopied(node, start, entry.start);
			return;
		}
		if (!entry) { fresh(node, parent, indent); return; }
		if (node.tag === '#text') {
			const raw = text.slice(entry.start, entry.end);
			const value = JSON.parse(canonicalNode(node, parent))[1];
			const printed = node.expression ? value : value.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\{\{/g, '{<!-- -->{');
			push(`${/^\s*/.exec(raw)[0]}${printed}${/\s*$/.exec(raw)[0]}`);
			offsets[node.id] = [start, length];
			return;
		}
		const was = JSON.parse(entry.canon)[0];
		const children = node.children || [];
		// A different tag, or children added to an element written without a closing tag, is printed afresh.
		if (was !== node.tag || (!entry.closed && !entry.synthetic && children.length)) { fresh(node, parent, lineIndent(text, entry.start)); return; }
		// The importer's wrapper around several roots has no markup to carry a change.
		if (entry.synthetic && entry.canon !== canonicalNode(node, parent)) unfit = true;
		push(entry.synthetic ? '' : entry.canon === canonicalNode(node, parent) ? text.slice(entry.start, entry.tagEnd) : openTag(node, parent, entry));
		if (entry.closed) {
			const childIndent = entry.children.length ? lineIndent(text, map.nodes[entry.children[0]].start) : `${lineIndent(text, entry.start)}\t`;
			children.forEach((child, index) => {
				const previous = index ? children[index - 1].id : null;
				const at = entry.children.indexOf(child.id);
				if (index === 0) push(at === 0 ? text.slice(entry.tagEnd, map.nodes[child.id].start) : entry.children.length ? text.slice(entry.tagEnd, map.nodes[entry.children[0]].start) : `\n${childIndent}`);
				else if (at > 0 && entry.children[at - 1] === previous) push(text.slice(map.nodes[previous].end, map.nodes[child.id].start));
				else push(`\n${childIndent}`);
				emit(child, node, childIndent);
			});
			const lastBase = entry.children.at(-1);
			if (children.length) push(children.at(-1).id === lastBase ? text.slice(map.nodes[lastBase].end, entry.closeStart) : `\n${lineIndent(text, entry.start)}`);
			push(entry.synthetic ? '' : text.slice(entry.closeStart, entry.end));
		}
		offsets[node.id] = [start, length];
	}

	emit(root, null, lineIndent(text, base.start));
	if (unfit) return null;
	const body = parts.join('');
	const prefix = text.slice(0, base.start);
	for (const range of Object.values(offsets)) { range[0] += prefix.length; range[1] += prefix.length; }
	return { source: prefix + body + text.slice(base.end), offsets };
}

/**
 * Converts offsets to the one-based `{ start, end }` lines the code view uses.
 *
 * @param {string} source File text.
 * @param {Record<string, [number, number]>} offsets Offsets by node id.
 * @returns {Record<string, { start: number, end: number }>} Lines by node id.
 */
export function offsetsToLines(source, offsets) {
	const lineStarts = [0];
	for (let index = 0; index < source.length; index++) if (source[index] === '\n') lineStarts.push(index + 1);
	const lineOf = (offset) => {
		let low = 0;
		let high = lineStarts.length - 1;
		while (low < high) {
			const middle = (low + high + 1) >> 1;
			if (lineStarts[middle] <= offset) low = middle;
			else high = middle - 1;
		}
		return low + 1;
	};
	return Object.fromEntries(Object.entries(offsets).map(([id, [start, end]]) => [id, { start: lineOf(start), end: lineOf(Math.max(start, end - 1)) }]));
}
