import { cloneValue } from '../core/editorDocument.js';
import { applyOperation } from '../core/operations.js';
import { exportVue, fromCanvasNode, importVue } from '../core/vueAdapter.js';
import { createDocument } from '../core/editorDocument.js';
import { sampleVueFile } from './canvasDocument.js';

/**
 * Canvas workspace: Vue files, each holding an editor document, and the
 * artboards that show them at different widths.
 *
 * Every change is an operation, so one history covers node edits and artboard
 * moves alike. Node operations carry the `file` they apply to; workspace
 * operations manage files and artboards.
 *
 * | Operation | Shape |
 * | --- | --- |
 * | any document operation | `{ file, op: 'setProp', … }` |
 * | addFile / removeFile | `{ op: 'addFile', value: file, index }`, `{ op: 'removeFile', id }` |
 * | setFile | `{ op: 'setFile', id, key: 'name' \| 'path' \| 'script' \| 'style' \| 'doc', value }` |
 * | addArtboard / removeArtboard | `{ op: 'addArtboard', board, index }`, `{ op: 'removeArtboard', id }` |
 * | setArtboard | `{ op: 'setArtboard', id, key, value }` |
 * | setWorkspace | `{ op: 'setWorkspace', value }` |
 */

export const WORKSPACE_VERSION = 2;
const fileKeys = ['name', 'path', 'script', 'style', 'doc', 'source'];
const artboardKeys = ['name', 'x', 'y', 'width', 'height'];

/** Allocates a file or artboard id. */
export function workspaceId(prefix) {
	return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-3)}`;
}

function findIndex(list, id, kind) {
	const index = list.findIndex((item) => item.id === id);
	if (index < 0) throw new Error(`Unknown ${kind} ${id}.`);
	return index;
}

/**
 * Applies one workspace or document operation and returns its inverse.
 *
 * @param {object} workspace Workspace, mutated in place.
 * @param {object} operation Operation.
 * @returns {object} Inverse.
 */
export function applyWorkspaceOperation(workspace, operation) {
	if (typeof operation.file === 'string') {
		const file = workspace.files[findIndex(workspace.files, operation.file, 'file')];
		const { file: fileId, ...rest } = operation;
		return { ...applyOperation(file.doc, rest), file: fileId };
	}
	switch (operation.op) {
		case 'addFile': {
			const index = Number.isInteger(operation.index) ? operation.index : workspace.files.length;
			workspace.files.splice(index, 0, cloneValue(operation.value));
			return { op: 'removeFile', id: operation.value.id };
		}
		case 'removeFile': {
			const index = findIndex(workspace.files, operation.id, 'file');
			const [file] = workspace.files.splice(index, 1);
			return { op: 'addFile', value: cloneValue(file), index };
		}
		case 'setFile': {
			if (!fileKeys.includes(operation.key)) throw new Error(`File field ${operation.key} is not editable.`);
			const file = workspace.files[findIndex(workspace.files, operation.id, 'file')];
			const previous = cloneValue(file[operation.key]);
			file[operation.key] = cloneValue(operation.value);
			return { op: 'setFile', id: operation.id, key: operation.key, value: previous };
		}
		case 'addArtboard': {
			const index = Number.isInteger(operation.index) ? operation.index : workspace.artboards.length;
			workspace.artboards.splice(index, 0, cloneValue(operation.board));
			return { op: 'removeArtboard', id: operation.board.id };
		}
		case 'removeArtboard': {
			const index = findIndex(workspace.artboards, operation.id, 'artboard');
			const [board] = workspace.artboards.splice(index, 1);
			return { op: 'addArtboard', board: cloneValue(board), index };
		}
		case 'setArtboard': {
			if (!artboardKeys.includes(operation.key)) throw new Error(`Artboard field ${operation.key} is not editable.`);
			const board = workspace.artboards[findIndex(workspace.artboards, operation.id, 'artboard')];
			const previous = board[operation.key];
			board[operation.key] = operation.value;
			return { op: 'setArtboard', id: operation.id, key: operation.key, value: previous };
		}
		case 'setWorkspace': {
			const previous = cloneValue({ files: workspace.files, artboards: workspace.artboards });
			workspace.files = cloneValue(operation.value.files);
			workspace.artboards = cloneValue(operation.value.artboards);
			return { op: 'setWorkspace', value: previous };
		}
		default:
			throw new Error(`Unknown operation ${operation.op}.`);
	}
}

/**
 * Imports Vue or HTML source as a canvas file.
 *
 * @param {string} source File source.
 * @param {string} name File name.
 * @param {{ makeId?: () => string }} [options] Node id factory.
 * @returns {{ file: object, unsupported: number, seeded: Array<string> }} File, dropped node count and data keys read from the script.
 */
export function importFile(source, name, options) {
	const { doc, script, style, unsupported, seeded, sourceMap } = importVue(source, options);
	return { file: { id: workspaceId('file'), name, script, style, doc, source: sourceMap }, unsupported, seeded };
}

/**
 * Exports a canvas file as a Vue SFC.
 *
 * @param {object} file Canvas file.
 * @param {(tag: string) => boolean} [isStudioComponent] Whether a tag is exported by `@getdom/studio/vue`.
 * @returns {string} Vue SFC source.
 */
export function exportFile(file, isStudioComponent) {
	return exportVue(file, isStudioComponent);
}

/**
 * Creates a workspace from source files: each file gets an artboard per width,
 * laid out in rows.
 *
 * @param {Array<{ source: string, name: string, path?: string }>} sources Vue or HTML files.
 * @param {{ widths?: Array<number>, height?: number, makeId?: () => string }} [options] Artboard widths and height, and ids that are the same each time (for a page rendered on the server and hydrated).
 * @returns {object} Workspace.
 */
export function createWorkspace(sources, { widths = [1200, 390], height = 760, makeId = null } = {}) {
	const id = (prefix) => (makeId ? `${prefix}_${makeId()}` : workspaceId(prefix));
	const files = sources.map(({ source, name, path }) => {
		const { file } = importFile(source, name, makeId ? { makeId } : undefined);
		file.id = id('file');
		if (path) file.path = path;
		return file;
	});
	const gap = 80;
	const artboards = files.flatMap((file, row) => {
		let x = 0;
		return widths.map((width) => {
			const board = { id: id('board'), fileId: file.id, name: `${file.name.replace(/\.(vue|html)$/, '')} ${width}`, x, y: row * (height + gap), width, height };
			x += width + gap;
			return board;
		});
	});
	return { version: WORKSPACE_VERSION, files, artboards };
}

/** The starter canvas: one Vue file viewed at desktop and mobile widths, with stable ids for hydration. */
export function createCanvasDemo() {
	let index = 0;
	const { file } = importFile(sampleVueFile, 'ProjectOverview.vue', { makeId: () => `n_demo${String(index++).padStart(3, '0')}` });
	file.id = 'file_demo';
	return {
		version: WORKSPACE_VERSION,
		files: [file],
		artboards: [
			{ id: 'board_desktop', fileId: file.id, name: 'Desktop', x: 0, y: 0, width: 1200, height: 760 },
			{ id: 'board_mobile', fileId: file.id, name: 'Mobile', x: 1280, y: 0, width: 390, height: 760 },
		],
	};
}

/**
 * Reads a saved workspace, upgrading the first canvas format (nested trees).
 *
 * @param {unknown} saved Parsed storage value.
 * @returns {object|null} Workspace, or null when the value is not one.
 */
export function restoreWorkspace(saved) {
	if (!saved || !Array.isArray(saved.files) || !Array.isArray(saved.artboards) || !saved.files.length || !saved.artboards.length) return null;
	if (saved.version === WORKSPACE_VERSION && saved.files.every((file) => file.doc?.nodes?.[file.doc.rootId])) return saved;
	if (saved.files.every((file) => file.root)) {
		return {
			version: WORKSPACE_VERSION,
			files: saved.files.map((file) => ({ id: file.id, name: file.name, script: file.script || '', style: file.style || '', doc: createDocument(fromCanvasNode(file.root)) })),
			artboards: saved.artboards,
		};
	}
	return null;
}
