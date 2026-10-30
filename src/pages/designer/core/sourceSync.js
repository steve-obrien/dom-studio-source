import { cloneValue } from './editorDocument.js';
import { exportVue, importVue } from './vueAdapter.js';
import { renameSourceMap } from './sourcePatch.js';

/**
 * Two-way sync between a document and its Vue source.
 *
 * Design → code is an export with a source map (`exportMappedVue`). Code →
 * design parses the edited text and reconciles it with the current document:
 * nodes keep their ids where the structure still matches, so selection,
 * history and collaboration survive typing. Designer-only fields that the
 * markup cannot express (layer names, locks, explicit frame layouts) are kept
 * for any node whose own markup the edit did not change.
 */

const designerFields = ['label', 'locked', 'hidden'];

/** A node's own content, without identity or structure, for comparisons. */
function ownContent(node) {
	return JSON.stringify({ type: node.type, props: node.props, directives: node.directives || [], style: node.style || {} });
}

/**
 * Pairs each node of `next` with a node of `previous`: roots of the same type,
 * then children in order, each taking the next unmatched sibling of the same
 * type.
 *
 * @param {object} previous Current document.
 * @param {object} next Parsed document.
 * @returns {Map<string, string>} Next id → previous id.
 */
export function matchNodes(previous, next) {
	const pairs = new Map();
	function match(previousId, nextId) {
		pairs.set(nextId, previousId);
		const before = previous.nodes[previousId];
		let cursor = 0;
		for (const childId of next.nodes[nextId].children) {
			const type = next.nodes[childId].type;
			const index = before.children.findIndex((id, position) => position >= cursor && previous.nodes[id].type === type);
			if (index < 0) continue;
			match(before.children[index], childId);
			cursor = index + 1;
		}
	}
	if (previous.nodes[previous.rootId]?.type === next.nodes[next.rootId]?.type) match(previous.rootId, next.rootId);
	return pairs;
}

/**
 * Reconciles a parsed document with the current one.
 *
 * @param {object} previous Current document.
 * @param {object} next Parsed document (from `importVue`).
 * @param {object} [exported] The current document as it exports and parses again, to tell which nodes the edit changed. Pass `roundTrip(previous, file)`.
 * @returns {{ doc: object, ids: Map<string, string> }} Reconciled document and next id → final id.
 */
export function reconcileDocument(previous, next, exported = null) {
	const pairs = matchNodes(previous, next);
	const unchanged = exported ? unchangedNodes(previous, exported) : new Map();
	const ids = new Map(Object.keys(next.nodes).map((id) => [id, pairs.get(id) || id]));
	const nodes = {};
	for (const [id, node] of Object.entries(next.nodes)) {
		const finalId = ids.get(id);
		const before = pairs.has(id) ? previous.nodes[pairs.get(id)] : null;
		let entry = { ...cloneValue(node), id: finalId, parent: node.parent ? ids.get(node.parent) : null, children: node.children.map((child) => ids.get(child)) };
		if (before) {
			// Untouched markup keeps the node exactly as the designer had it, including fields the code cannot carry.
			if (unchanged.get(before.id) === ownContent(node)) entry = { ...cloneValue(before), parent: entry.parent, children: entry.children };
			else for (const field of designerFields) if (before[field] !== undefined) entry[field] = cloneValue(before[field]);
		}
		nodes[finalId] = entry;
	}
	return { doc: { ...previous, rootId: ids.get(next.rootId), nodes, data: cloneValue(previous.data) }, ids };
}

/**
 * How each node of the current document looks after exporting and parsing it
 * again: the baseline an edit is compared against.
 *
 * @param {object} file Editor file (`doc`, `script`, `style`).
 * @param {(tag: string) => boolean} [isStudioComponent] Component test passed to export.
 * @returns {object} Re-imported document, structurally parallel to `file.doc`.
 */
export function roundTrip(file, isStudioComponent) {
	return importVue(exportVue(file, isStudioComponent)).doc;
}

/** Maps each previous node id to the content its export parses back to. */
function unchangedNodes(previous, exported) {
	const result = new Map();
	(function walk(previousId, exportedId) {
		const before = previous.nodes[previousId];
		const after = exported.nodes[exportedId];
		if (!before || !after) return;
		result.set(previousId, ownContent(after));
		before.children.forEach((child, index) => walk(child, after.children[index]));
	})(previous.rootId, exported.rootId);
	return result;
}

/**
 * Parses edited source and reconciles it with a file.
 *
 * @param {object} file Editor file.
 * @param {string} source Edited Vue source.
 * @param {{ isStudioComponent?: (tag: string) => boolean, exported?: object }} [options] Component test, and a cached `roundTrip` of the file.
 * `source` is the source map of the edited text under the reconciled ids:
 * typed code becomes the text that later visual edits patch.
 *
 * @returns {{ doc: object, script: string, style: string, ranges: Record<string, { start: number, end: number }>, unsupported: number, changed: boolean, source: object }}
 */
export function applySource(file, source, { isStudioComponent, exported } = {}) {
	const parsed = importVue(source);
	const { doc, ids } = reconcileDocument(file.doc, parsed.doc, exported || roundTrip(file, isStudioComponent));
	const ranges = Object.fromEntries(Object.entries(parsed.ranges).map(([id, range]) => [ids.get(id), range]));
	const changed = JSON.stringify(doc) !== JSON.stringify(file.doc) || parsed.script !== (file.script || '') || parsed.style !== (file.style || '');
	return { doc, script: parsed.script, style: parsed.style, ranges, unsupported: parsed.unsupported, changed, source: renameSourceMap(parsed.sourceMap, ids) };
}

/**
 * The innermost node whose lines contain `line`.
 *
 * @param {Record<string, { start: number, end: number }>} ranges Line ranges by node id.
 * @param {number} line One-based line.
 * @param {(id: string) => boolean} [accept] Filter, such as skipping text nodes.
 * @returns {string|null} Node id.
 */
export function nodeAtLine(ranges, line, accept = () => true) {
	let best = null;
	for (const [id, range] of Object.entries(ranges)) {
		if (line < range.start || line > range.end || !accept(id)) continue;
		if (!best || range.end - range.start < best.span || (range.end - range.start === best.span && range.start >= best.start)) best = { id, span: range.end - range.start, start: range.start };
	}
	return best?.id ?? null;
}
