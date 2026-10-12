/**
 * Undo and redo over operations.
 *
 * History never snapshots the document. Each entry stores the operations that
 * were applied and their inverses; undo applies the inverses and keeps what
 * they return as the redo operations. The same history serves any editor
 * whose changes go through an `apply(operation) => inverse` function.
 *
 * Continuous input (typing, dragging) passes a `merge` key. Consecutive
 * changes with the same key, within `mergeWindow` milliseconds, extend one
 * entry, so a drag is a single undo step.
 */

/**
 * @typedef {object} EditorHistory
 * @property {(operations: Array<object>|object, options?: { merge?: string, label?: string }) => Array<object>} run Applies and records operations.
 * @property {() => boolean} undo Undoes the last entry.
 * @property {() => boolean} redo Redoes the last undone entry.
 * @property {() => void} seal Ends the current merge run, so the next change starts a new entry.
 * @property {() => void} clear Forgets every entry.
 * @property {() => { undo: number, redo: number }} size Entry counts.
 */

/**
 * Creates a history bound to an apply function.
 *
 * @param {{ apply: (operation: object) => object, limit?: number, mergeWindow?: number, now?: () => number, onChange?: () => void }} options Apply function and limits.
 * @returns {EditorHistory}
 */
export function createHistory({ apply, limit = 200, mergeWindow = 1000, now = () => Date.now(), onChange = () => {} }) {
	const past = [];
	const future = [];
	let sealed = true;

	/** Applies operations in order and returns their inverses in undo order. */
	function applyAll(operations) {
		const inverses = [];
		try {
			for (const operation of operations) inverses.unshift(apply(operation));
		} catch (error) {
			// A batch is all or nothing: roll back what already applied, then report.
			for (const inverse of inverses) apply(inverse);
			throw error;
		}
		return inverses;
	}

	function run(operations, { merge = '', label = '' } = {}) {
		const list = (Array.isArray(operations) ? operations : [operations]).filter(Boolean);
		if (!list.length) return [];
		const inverses = applyAll(list);
		const last = past[past.length - 1];
		const time = now();
		if (merge && !sealed && last?.merge === merge && time - last.time <= mergeWindow) {
			last.operations.push(...list);
			last.inverses.unshift(...inverses);
			last.time = time;
		} else {
			past.push({ operations: list, inverses, merge, label, time });
			if (past.length > limit) past.shift();
		}
		sealed = !merge;
		future.length = 0;
		onChange();
		return inverses;
	}

	function undo() {
		const entry = past.pop();
		if (!entry) return false;
		// Inverting the inverses yields the original changes again, in their original order.
		future.push({ ...entry, operations: applyAll(entry.inverses) });
		sealed = true;
		onChange();
		return true;
	}

	function redo() {
		const entry = future.pop();
		if (!entry) return false;
		const inverses = applyAll(entry.operations);
		past.push({ ...entry, inverses, time: now() });
		sealed = true;
		onChange();
		return true;
	}

	return {
		run,
		undo,
		redo,
		seal() { sealed = true; },
		clear() { past.length = 0; future.length = 0; sealed = true; onChange(); },
		size: () => ({ undo: past.length, redo: future.length }),
	};
}
