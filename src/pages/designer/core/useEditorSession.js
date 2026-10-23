import { computed, ref } from 'vue';
import { createHistory } from './history.js';
import { applyWorkspaceOperation } from '../canvas/canvasWorkspace.js';

/**
 * The document a designer edits: the workspace of files and artboards, the
 * active artboard and file, the selection, and one history of operations.
 *
 * Every part of an editor reads from and writes through the same session, so
 * the stage, the layers, the inspector and the code view always show one tree.
 * Changes are operations (see operations.js and canvasWorkspace.js) applied as
 * undo steps; nothing edits the workspace directly.
 *
 * @param {object} options
 * @param {object} options.workspace The workspace to start with.
 * @param {() => void} [options.onChange] Called after any change, undo or redo (save, compile).
 * @param {() => void} [options.afterChange] Called after `run`, `undo` and `redo` once the selection is checked (re-measure).
 * @param {(message: string) => void} [options.onError] Reports an operation that could not apply.
 */
export function useEditorSession({ workspace: initial, onChange = () => {}, afterChange = () => {}, onError = () => {} }) {
	const workspace = ref(initial);
	const activeArtboardId = ref(workspace.value.artboards[0].id);
	const selected = ref('');
	const historySize = ref({ undo: 0, redo: 0 });

	const history = createHistory({
		apply: (operation) => applyWorkspaceOperation(workspace.value, operation),
		onChange() {
			historySize.value = history.size();
			onChange();
		},
	});

	const artboards = computed(() => workspace.value.artboards);
	const activeArtboard = computed(() => artboards.value.find((board) => board.id === activeArtboardId.value) || artboards.value[0]);
	const activeFile = computed(() => fileById(activeArtboard.value?.fileId) || workspace.value.files[0]);
	const doc = computed(() => activeFile.value?.doc || null);
	const active = computed(() => doc.value?.nodes[selected.value] || null);
	const parent = computed(() => (active.value?.parent ? doc.value.nodes[active.value.parent] : null));

	function fileById(id) { return workspace.value.files.find((file) => file.id === id) || null; }

	/** Tags a document operation with the active file. */
	function onFile(operation) { return { file: activeFile.value.id, ...operation }; }

	/** Keeps the selection and active artboard valid after any change. */
	function settle() {
		if (!artboards.value.some((board) => board.id === activeArtboardId.value)) activeArtboardId.value = artboards.value[0]?.id;
		if (selected.value && !doc.value?.nodes[selected.value]) selected.value = '';
		afterChange();
	}

	/**
	 * Applies operations as one undo step. `merge` folds continuous input (typing,
	 * dragging) into the same step.
	 */
	function run(operations, options = {}) {
		try {
			history.run(operations, options);
		} catch (error) {
			onError(error.message);
		}
		settle();
	}
	function undo() { history.undo(); settle(); }
	function redo() { history.redo(); settle(); }

	return { workspace, activeArtboardId, selected, historySize, history, artboards, activeArtboard, activeFile, doc, active, parent, fileById, onFile, run, undo, redo };
}
