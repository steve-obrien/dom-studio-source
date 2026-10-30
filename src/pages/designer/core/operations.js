import { cloneValue, contains, copySubtree, nodeFields } from './editorDocument.js';

/**
 * Operations: every change to an editor document.
 *
 * `applyOperation` mutates the document in place (so a reactive document
 * re-renders) and returns the inverse operation. History is a stack of
 * inverses; collaboration sends the same operations to other people.
 *
 * | Operation | Shape |
 * | --- | --- |
 * | insert | `{ op: 'insert', parent, index, fragment: { rootId, nodes } }` |
 * | remove | `{ op: 'remove', id }` |
 * | move | `{ op: 'move', id, parent, index }` |
 * | setProp | `{ op: 'setProp', id, key, value }` (`value: undefined` removes the prop) |
 * | setText | `{ op: 'setText', id, value }` (a text node's `value` prop) |
 * | setField | `{ op: 'setField', id, key, value }` for `layout`, `style`, `directives`, … |
 * | setData | `{ op: 'setData', path: ['project', 'name'], value }` |
 */

/**
 * Applies one operation and returns its inverse.
 *
 * @param {object} doc Editor document, mutated in place.
 * @param {object} operation Operation.
 * @returns {object} Inverse operation.
 */
export function applyOperation(doc, operation) {
	const handler = handlers[operation?.op];
	if (!handler) throw new Error(`Unknown operation ${operation?.op}.`);
	return handler(doc, operation);
}

/**
 * Applies operations in order, returning inverses in undo order (last first).
 *
 * @param {object} doc Editor document.
 * @param {Array<object>} operations Operations.
 * @returns {Array<object>} Inverse operations, ready to apply in sequence.
 */
export function applyOperations(doc, operations) {
	return operations.map((operation) => applyOperation(doc, operation)).reverse();
}

function requireNode(doc, id) {
	const entry = doc.nodes[id];
	if (!entry) throw new Error(`Unknown node ${id}.`);
	return entry;
}

function clampIndex(list, index) {
	return Number.isInteger(index) ? Math.max(0, Math.min(list.length, index)) : list.length;
}

const handlers = {
	insert(doc, { parent, index, fragment }) {
		const host = requireNode(doc, parent);
		const root = fragment?.nodes?.[fragment.rootId];
		if (!root) throw new Error('Insert needs a fragment with a root node.');
		for (const id of Object.keys(fragment.nodes)) if (doc.nodes[id]) throw new Error(`Node ${id} already exists.`);
		for (const [id, entry] of Object.entries(fragment.nodes)) {
			doc.nodes[id] = { ...cloneValue(entry), parent: id === fragment.rootId ? parent : entry.parent };
		}
		host.children.splice(clampIndex(host.children, index), 0, fragment.rootId);
		return { op: 'remove', id: fragment.rootId };
	},

	remove(doc, { id }) {
		const entry = requireNode(doc, id);
		if (!entry.parent) throw new Error('The root node cannot be removed.');
		const host = requireNode(doc, entry.parent);
		const index = host.children.indexOf(id);
		const fragment = copySubtree(doc, id);
		const ids = Object.keys(fragment.nodes);
		host.children.splice(index, 1);
		for (const item of ids) delete doc.nodes[item];
		return { op: 'insert', parent: host.id, index, fragment };
	},

	move(doc, { id, parent, index }) {
		const entry = requireNode(doc, id);
		const target = requireNode(doc, parent);
		if (!entry.parent) throw new Error('The root node cannot be moved.');
		if (contains(doc, id, parent)) throw new Error('A node cannot move inside itself.');
		const source = requireNode(doc, entry.parent);
		const oldIndex = source.children.indexOf(id);
		source.children.splice(oldIndex, 1);
		target.children.splice(clampIndex(target.children, index), 0, id);
		entry.parent = parent;
		return { op: 'move', id, parent: source.id, index: oldIndex };
	},

	setProp(doc, { id, key, value }) {
		const entry = requireNode(doc, id);
		const previous = cloneValue(entry.props[key]);
		if (value === undefined) delete entry.props[key];
		else entry.props[key] = cloneValue(value);
		return { op: 'setProp', id, key, value: previous };
	},

	setText(doc, { id, value }) {
		const inverse = handlers.setProp(doc, { id, key: 'value', value });
		return { op: 'setText', id, value: inverse.value };
	},

	setField(doc, { id, key, value }) {
		if (!nodeFields.includes(key)) throw new Error(`Field ${key} is not editable.`);
		const entry = requireNode(doc, id);
		const previous = cloneValue(entry[key]);
		if (value === undefined) delete entry[key];
		else entry[key] = cloneValue(value);
		return { op: 'setField', id, key, value: previous };
	},

	setData(doc, { path = [], value }) {
		if (!path.length) {
			const previous = cloneValue(doc.data);
			doc.data = cloneValue(value ?? {});
			return { op: 'setData', path: [], value: previous };
		}
		doc.data ??= {};
		// The inverse restores the whole top-level entry, so intermediate objects created here disappear on undo.
		const top = path[0];
		const previous = cloneValue(doc.data[top]);
		let target = doc.data;
		for (const key of path.slice(0, -1)) {
			if (!target[key] || typeof target[key] !== 'object') target[key] = {};
			target = target[key];
		}
		const last = path[path.length - 1];
		if (value === undefined) delete target[last];
		else target[last] = cloneValue(value);
		return { op: 'setData', path: [top], value: previous };
	},
};
