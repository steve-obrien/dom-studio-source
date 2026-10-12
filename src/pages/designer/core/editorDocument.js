/**
 * Editor document: the one data model every DOM Studio editor shares.
 *
 * A document is a flat map of nodes keyed by id. Each node knows its parent and
 * its ordered children, so nothing has to walk a tree to find a node, and ids
 * stay stable across edits, undo and collaboration.
 *
 * ```js
 * {
 * 	version: 1,
 * 	rootId: 'n_root',
 * 	nodes: {
 * 		n_root: { id: 'n_root', type: 'html:section', parent: null, children: ['n_title'], props: { class: 'p-8' } },
 * 		n_title: { id: 'n_title', type: 'html:h1', parent: 'n_root', children: ['n_text'], props: {} },
 * 		n_text: { id: 'n_text', type: 'text', parent: 'n_title', children: [], props: { value: { expr: 'project.name' } } },
 * 	},
 * 	data: { project: { name: 'Website relaunch' } },
 * }
 * ```
 *
 * - `type` names an entry in the type registry (`html:div`, `vue:DomButton`, `text`).
 * - `props` values are literals, or `{ expr }` for a binding or interpolation.
 * - `directives` keeps template logic (`v-if`, `v-for`, `@click`, `#slot`) verbatim.
 * - `style`, `layout` and `placements` carry designer geometry for frames.
 * - `locked` and `hidden` are editor states: a locked node cannot be moved or edited, a hidden one is not rendered.
 * - `data` is preview data used to render bindings. It is never exported.
 *
 * The document is plain JSON, so it can be stored, diffed, sent over a socket,
 * or mapped onto Yjs without conversion.
 */

export const DOCUMENT_VERSION = 1;
const idAlphabet = 'abcdefghijkmnopqrstuvwxyz23456789';

/** Node fields other than props that operations may set. */
export const nodeFields = ['label', 'slot', 'directives', 'style', 'layout', 'placements', 'absoluteHeight', 'sourceAbsolute', 'locked', 'hidden'];

/**
 * Creates a node id: `n_` plus ten random characters.
 *
 * @returns {string} Unique node id.
 */
export function nodeId() {
	let id = 'n_';
	const random = globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(new Uint8Array(10)) : null;
	for (let index = 0; index < 10; index += 1) id += idAlphabet[(random ? random[index] : Math.floor(Math.random() * 256)) % idAlphabet.length];
	return id;
}

/**
 * Wraps a template expression as a prop value.
 *
 * @param {string} source Expression source, such as `project.name`.
 * @returns {{ expr: string }} Bound value.
 */
export function expr(source) {
	return { expr: String(source) };
}

/**
 * Whether a prop value is a binding rather than a literal.
 *
 * @param {unknown} value Prop value.
 * @returns {boolean}
 */
export function isExpr(value) {
	return !!value && typeof value === 'object' && !Array.isArray(value) && typeof value.expr === 'string';
}

/** Deep-copies JSON values; undefined stays undefined so it can mean "absent". */
export function cloneValue(value) {
	return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

/**
 * Creates a detached node tree description. `fromTree` turns it into map entries.
 *
 * @param {string} type Node type.
 * @param {object} [props] Prop values.
 * @param {Array<object>} [children] Child tree descriptions.
 * @param {object} [fields] Extra node fields (`directives`, `style`, …).
 * @returns {object} Tree description.
 */
export function node(type, props = {}, children = [], fields = {}) {
	return { type, props, children, ...fields };
}

/**
 * Creates a text tree description.
 *
 * @param {string|{expr: string}} value Literal text or a binding.
 * @returns {object} Tree description.
 */
export function text(value) {
	return { type: 'text', props: { value }, children: [] };
}

/**
 * Flattens a tree description into map entries with fresh ids (or the ids it
 * already carries), parent pointers and child id lists.
 *
 * @param {object} tree Tree description.
 * @param {{ parent?: string|null, makeId?: () => string }} [options] Root parent and id factory.
 * @returns {{ rootId: string, nodes: Record<string, object> }} Subtree fragment.
 */
export function fromTree(tree, { parent = null, makeId = nodeId } = {}) {
	const nodes = {};
	function visit(item, parentId) {
		const id = item.id || makeId();
		if (nodes[id]) throw new Error(`Duplicate node id ${id}.`);
		// eslint-disable-next-line no-unused-vars
		const { children = [], id: ignored, parent: ignoredParent, ...rest } = item;
		const entry = { ...cloneValue(rest), id, parent: parentId, children: [], props: cloneValue(item.props || {}) };
		nodes[id] = entry;
		for (const child of children) entry.children.push(visit(child, id));
		return id;
	}
	const rootId = visit(tree, parent);
	return { rootId, nodes };
}

/**
 * Rebuilds a nested tree description from the map, for adapters and export.
 *
 * @param {object} doc Document.
 * @param {string} [id] Subtree root id; the document root by default.
 * @returns {object} Tree description with ids.
 */
export function toTree(doc, id = doc.rootId) {
	const entry = doc.nodes[id];
	if (!entry) throw new Error(`Unknown node ${id}.`);
	const { parent, children, ...rest } = entry;
	return { ...cloneValue(rest), children: children.map((child) => toTree(doc, child)) };
}

/**
 * Creates a document from a root tree description.
 *
 * @param {object} tree Root tree description.
 * @param {{ data?: object, makeId?: () => string }} [options] Preview data and id factory.
 * @returns {object} Document.
 */
export function createDocument(tree, { data = {}, makeId } = {}) {
	const { rootId, nodes } = fromTree(tree, { makeId });
	return { version: DOCUMENT_VERSION, rootId, nodes, data: cloneValue(data) };
}

/**
 * Looks up a node by id.
 *
 * @param {object} doc Document.
 * @param {string} id Node id.
 * @returns {object|null}
 */
export function getNode(doc, id) {
	return (id && doc.nodes[id]) || null;
}

/** Returns a node's parent node, or null for the root. */
export function parentOf(doc, id) {
	return getNode(doc, doc.nodes[id]?.parent);
}

/** Lists the ids of a subtree, root first, in document order. */
export function subtreeIds(doc, id) {
	const entry = doc.nodes[id];
	if (!entry) return [];
	return [id, ...entry.children.flatMap((child) => subtreeIds(doc, child))];
}

/** Lists ancestors from the parent up to the root. */
export function ancestorIds(doc, id) {
	const out = [];
	let current = doc.nodes[id]?.parent;
	while (current) {
		out.push(current);
		current = doc.nodes[current]?.parent;
	}
	return out;
}

/** Whether `ancestor` contains `id` (or is it). */
export function contains(doc, ancestor, id) {
	return ancestor === id || ancestorIds(doc, id).includes(ancestor);
}

/**
 * Copies a subtree as a detached fragment, ready for an `insert` operation.
 *
 * @param {object} doc Document.
 * @param {string} id Subtree root id.
 * @param {{ freshIds?: boolean, makeId?: () => string }} [options] Whether to allocate new ids.
 * @returns {{ rootId: string, nodes: Record<string, object> }} Fragment.
 */
export function copySubtree(doc, id, { freshIds = false, makeId = nodeId } = {}) {
	const tree = toTree(doc, id);
	if (freshIds) {
		const strip = (item) => { delete item.id; item.children.forEach(strip); };
		strip(tree);
	}
	return fromTree(tree, { parent: null, makeId });
}

/**
 * Checks the map's invariants: every child points back at its parent, every
 * node is reachable from the root once, and ids match their keys.
 *
 * @param {object} doc Document.
 * @returns {Array<string>} Problems found; empty when the document is sound.
 */
export function validateDocument(doc) {
	const problems = [];
	if (!doc?.nodes || !doc.nodes[doc.rootId]) return ['Missing root node.'];
	const seen = new Set();
	function visit(id, parent) {
		const entry = doc.nodes[id];
		if (!entry) { problems.push(`Missing node ${id}.`); return; }
		if (seen.has(id)) { problems.push(`Node ${id} appears twice.`); return; }
		seen.add(id);
		if (entry.id !== id) problems.push(`Node ${id} has id ${entry.id}.`);
		if (entry.parent !== parent) problems.push(`Node ${id} points at parent ${entry.parent}, expected ${parent}.`);
		entry.children.forEach((child) => visit(child, id));
	}
	visit(doc.rootId, null);
	for (const id of Object.keys(doc.nodes)) if (!seen.has(id)) problems.push(`Node ${id} is not reachable from the root.`);
	return problems;
}
