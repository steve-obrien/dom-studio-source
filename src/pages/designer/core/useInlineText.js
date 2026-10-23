import { markRaw, ref, shallowRef } from 'vue';
import { cloneValue } from './editorDocument.js';
import { applyOperations } from './operations.js';
import { beginInlineEdit, inlineEditTarget } from './inlineText.js';

/**
 * Editing text in place on a rendered element: double-click, type, select
 * words and mark them, then write the result back as one undo step.
 *
 * The browser session itself is in inlineText.js. This keeps the edit's state
 * for the rest of the editor: `editDoc` is the document as the edit would save
 * it (so a code view shows the text while it is typed), `editState` is where
 * the selection falls and its marks (for the Text panel), and `revisions`
 * counts finished edits per layer so the renderer draws the element afresh.
 *
 * @param {object} options
 * @param {ReturnType<import('./useEditorSession.js').useEditorSession>} options.session Editor session.
 * @param {() => string} [options.view] What is on screen; the edit ends when it changes.
 * @param {(message: string) => void} [options.notify] Says why some text cannot be edited.
 */
export function useInlineText({ session, view = () => '', notify = () => {} }) {
	const { activeArtboardId, selected, fileById, run } = session;
	// Text being edited: its artboard, file, layer and browser session.
	const editing = shallowRef(null);
	// Where the edit's selection falls in the text runs, and its marks for the Text panel.
	const editState = ref({ anchor: null, focus: null, marks: null });
	// The document as the edit would save it.
	const editDoc = shallowRef(null);
	const revisions = ref({});
	let readFrame = 0;

	/** Double-click on the canvas: edit that text where it is, or say why it cannot be (see inlineText.js). */
	function start(board, { id, element, x, y }) {
		finish();
		const file = fileById(board.fileId);
		if (!file) return;
		activeArtboardId.value = board.id;
		const target = inlineEditTarget(file.doc, id);
		if (target.error) { selected.value = id; notify(target.error); return; }
		let host = element;
		while (host && host.dataset?.designerId !== target.id) host = host.parentElement?.closest('[data-designer-id]');
		if (!host) return;
		selected.value = target.id;
		const edit = beginInlineEdit({ element: host, doc: file.doc, id: target.id, point: { x, y }, onChange: queueRead, onEnd: finish });
		editing.value = { board: board.id, file: file.id, id: target.id, session: edit, view: view(), operations: '[]' };
		read();
	}

	/** Typing and selecting fire many events a frame; the edit is read once per frame. */
	function queueRead() {
		if (!readFrame) readFrame = requestAnimationFrame(() => { readFrame = 0; read(); });
	}

	/** Reads the edit as it stands: the document it would save, where its selection falls, and the selected words' marks. */
	function read() {
		const current = editing.value;
		const file = current && fileById(current.file);
		if (!file) { editState.value = { anchor: null, focus: null, marks: null }; return; }
		const preview = current.session.preview(file.doc);
		// The document is rebuilt only when the text changed, not when the caret moved.
		const operations = JSON.stringify(preview.operations);
		if (operations !== current.operations) {
			current.operations = operations;
			let next = null;
			if (preview.operations.length) {
				try { next = cloneValue(file.doc); applyOperations(next, preview.operations); }
				catch { next = null; }
			}
			editDoc.value = next ? { file: file.id, doc: markRaw(next) } : null;
		}
		editState.value = { anchor: preview.anchor, focus: preview.focus, marks: current.session.marks() };
	}

	/** Ends in-place editing, writing the edited text to the document as one undo step. */
	function finish() {
		const current = editing.value;
		if (!current) return;
		editing.value = null;
		cancelAnimationFrame(readFrame);
		readFrame = 0;
		const file = fileById(current.file);
		const operations = file ? current.session.operations(file.doc) : [];
		current.session.stop();
		// The browser changed the element's DOM itself, so it is rendered afresh from the document.
		revisions.value = { ...revisions.value, [current.id]: (revisions.value[current.id] || 0) + 1 };
		editState.value = { anchor: null, focus: null, marks: null };
		editDoc.value = null;
		if (operations.length) run(operations.map((operation) => ({ file: current.file, ...operation })));
	}

	/** Bold, italic, underline or strike on the selected words of the edit. */
	function toggle(mark) {
		if (!editing.value) return;
		editing.value.session.toggle(mark);
		read();
	}

	return { editing, editState, editDoc, revisions, start, finish, toggle };
}
