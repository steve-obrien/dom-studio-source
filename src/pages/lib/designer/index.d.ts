/* eslint-disable */
// Declarations for `@getdom/studio/designer`. Keep in step with ./index.js.
import type { ComputedRef, DefineComponent, Ref, ShallowRef } from 'vue';

/** A node in an editor document: identity, type, props and children by id. */
export interface DesignerNode {
	id: string;
	type: string;
	parent: string | null;
	children: Array<string>;
	props: Record<string, unknown>;
	label?: string;
	locked?: boolean;
	hidden?: boolean;
	[key: string]: unknown;
}
/** A flat map of nodes keyed by id, with preview data. */
export interface DesignerDocument {
	version: number;
	rootId: string;
	nodes: Record<string, DesignerNode>;
	data: Record<string, unknown>;
}
/** One change to a document; `applyOperation` returns its inverse. */
export interface DesignerOperation {
	op: string;
	[key: string]: unknown;
}
/** A Vue or HTML file in a workspace. */
export interface DesignerFile {
	id: string;
	name: string;
	path?: string;
	script: string;
	style: string;
	doc: DesignerDocument;
}
/** An artboard: a view of one file at one width. */
export interface DesignerArtboard {
	id: string;
	fileId: string;
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
}
/** What the designer saves: files and the artboards that show them. */
export interface DesignerWorkspace {
	version: number;
	files: Array<DesignerFile>;
	artboards: Array<DesignerArtboard>;
}
/** One-based, inclusive line range of a node in its source. */
export interface SourceRange { start: number; end: number; }

/** Where a design is kept. `subscribe` and `list` are optional. */
export interface StorageAdapter<Value = unknown> {
	kind?: string;
	load(id: string): Promise<Value | null>;
	save(id: string, value: Value, options?: { operations?: Array<DesignerOperation> }): Promise<void>;
	subscribe?(id: string, onChange: (change: { value: Value; operations: Array<DesignerOperation> }) => void): () => void;
	list?(): Promise<Array<{ id: string; name?: string }>>;
}

/** A component people can insert, with its starter props and palette group. */
export interface ComponentCatalogEntry {
	id: string;
	label: string;
	group: string;
	component: object | string | null;
	componentName?: string;
	accepts: 'children' | 'none';
	defaults: { props?: Record<string, unknown>; children?: Array<unknown>; text?: string };
	hints?: Record<string, object>;
	[key: string]: unknown;
}
export interface ComponentCatalog {
	entries: Array<ComponentCatalogEntry>;
	lookupEntry?(component: object | string | null): ComponentCatalogEntry | null | undefined;
	lookupById?(id: string): ComponentCatalogEntry | undefined;
	lookupByName(name: string): ComponentCatalogEntry | null;
}
/** An inspector field generated from a prop. */
export interface InspectorFieldSchema {
	key: string;
	label: string;
	description?: string;
	group?: string;
	component: string;
	props: Record<string, unknown>;
}
export interface EditorHistory {
	run(operations: DesignerOperation | Array<DesignerOperation>, options?: { merge?: string; label?: string }): Array<DesignerOperation>;
	undo(): boolean;
	redo(): boolean;
	seal(): void;
	clear(): void;
	size(): { undo: number; redo: number };
}

export interface DomDesignerProps {
	/** Components people can insert. */
	catalog?: ComponentCatalog | null;
	/** Saves the whole workspace; defaults to this browser's localStorage. */
	storage?: StorageAdapter<DesignerWorkspace> | null;
	/** Id the workspace is saved under. */
	storageKey?: string;
	/** Older ids to read when nothing is saved under `storageKey`. */
	legacyStorageKeys?: Array<string>;
	/** Opens and saves project files; off when null. */
	fileStorage?: StorageAdapter<string> | null;
	/** Compiles Tailwind CSS for the workspace's classes; off when null. */
	compileCss?: ((content: string) => Promise<string>) | null;
	/** Creates the workspace shown when nothing is saved, and after Reset. */
	createWorkspace?: () => DesignerWorkspace;
	title?: string;
	badge?: string;
	/** Called after each save, with the id and the workspace saved. */
	/** Replaces the built-in code view with a component that meets the code view contract, such as DomMonacoCodeView. */
	codeEditor?: object | null;
	/** Extra props for `codeEditor`, such as `{ load }` for Monaco. */
	codeEditorProps?: Record<string, unknown>;
	/** Offer Google Fonts in the text controls and load the ones in use (default true). Turn off for email, which can only use installed fonts. */
	googleFonts?: boolean;
	onSave?: (event: { id: string; value: DesignerWorkspace }) => void;
}
/** The DOM designer: artboards, layers, a generated inspector and a two-way code view. */
export declare const DomDesigner: DefineComponent<DomDesignerProps>;
/** Editable source with line numbers and highlighted lines. */
export declare const DomCodeView: DefineComponent<{ modelValue?: string; highlight?: SourceRange | null; label?: string; readonly?: boolean }>;
/**
 * Optional Monaco code view with the same contract as DomCodeView. Monaco is not
 * a DOM Studio dependency: `load` resolves to the Monaco API from your own install.
 */
export declare const DomMonacoCodeView: DefineComponent<{ modelValue?: string; highlight?: SourceRange | null; label?: string; readonly?: boolean; load: () => Promise<unknown>; options?: Record<string, unknown> }>;

/**
 * One editor session: the workspace, the active artboard and file, the
 * selection, and one history. Every part of an editor reads and writes through
 * it, so the stage, layers, inspector and code view show one tree.
 */
export interface EditorSession {
	workspace: Ref<DesignerWorkspace>;
	activeArtboardId: Ref<string>;
	selected: Ref<string>;
	historySize: Ref<{ undo: number; redo: number }>;
	history: EditorHistory;
	artboards: ComputedRef<Array<DesignerArtboard>>;
	activeArtboard: ComputedRef<DesignerArtboard | undefined>;
	activeFile: ComputedRef<DesignerFile | undefined>;
	doc: ComputedRef<DesignerDocument | null>;
	active: ComputedRef<DesignerNode | null>;
	parent: ComputedRef<DesignerNode | null>;
	fileById(id: string): DesignerFile | null;
	/** Tags a document operation with the active file. */
	onFile(operation: DesignerOperation): DesignerOperation;
	/** Applies operations as one undo step; `merge` folds continuous input into one step. */
	run(operations: DesignerOperation | Array<DesignerOperation | null>, options?: { merge?: string; label?: string }): void;
	undo(): void;
	redo(): void;
}
export declare function useEditorSession(options: { workspace: DesignerWorkspace; onChange?: () => void; afterChange?: () => void; onError?: (message: string) => void }): EditorSession;

/** Text marks for the Text panel's toggles. */
export type TextMarks = { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean };
/** In-place text editing: double-click text on a rendered artboard, type, mark words, and write back as one undo step. */
export interface InlineText {
	editing: ShallowRef<{ board: string; file: string; id: string; view: string } | null>;
	editState: Ref<{ anchor: unknown; focus: unknown; marks: TextMarks | null }>;
	editDoc: ShallowRef<{ file: string; doc: DesignerDocument } | null>;
	/** Finished edits per layer; pass to the renderer so edited elements are drawn afresh. */
	revisions: Ref<Record<string, number>>;
	/** Starts editing from a stage's `edit-text` event. */
	start(board: DesignerArtboard, event: { id: string; element: Element; x: number; y: number }): void;
	finish(): void;
	toggle(mark: keyof TextMarks): void;
}
export declare function useInlineText(options: { session: EditorSession; view?: () => string; notify?: (message: string) => void }): InlineText;

/** Two-way sync between the session's active file and its Vue source. Render it with DomCodePanel. */
export interface CodeSync {
	source: ComputedRef<string>;
	text: ComputedRef<string>;
	highlight: ComputedRef<unknown>;
	error: Ref<string>;
	warning: Ref<string>;
	marks: ComputedRef<TextMarks | null>;
	edit(value: string): void;
	apply(): void;
	applyText(value: string, options?: { merge?: string }): void;
	selectLine(line: number): void;
	selectText(range: { start: number; end: number }): void;
	enter(): void;
	leave(): void;
	reset(): void;
	forgetMarks(): void;
	mark(mark: keyof TextMarks): void;
	clearSelection(): void;
	[key: string]: unknown;
}
export declare function useCodeSync(options: { session: EditorSession; inline?: InlineText | null; isStudioComponent?: (tag: string) => boolean; element: (id: string) => Element | null; open?: Ref<boolean> }): CodeSync;
/** The code of the session's active file, in sync with the stage. */
export declare const DomCodePanel: DefineComponent<{ sync: CodeSync; editor?: object | null; editorProps?: Record<string, unknown>; label?: string }>;

/** A stretch of text, or a line break (`text: '\n'`), with the inline elements around it, outermost first. */
export interface TextPiece { text: string; run?: string | null; br?: string | null; stack: Array<{ id: string | null; tag: string }>; }
/** A text element's content as pieces; offsets count across all of it, a line break as one character. */
export declare function flattenText(doc: DesignerDocument, hostId: string): Array<TextPiece>;
/** Which marks all the text between two offsets has; at a caret, the marks typing there would get. */
export declare function marksAt(pieces: Array<TextPiece>, start: number, end?: number): Required<TextMarks>;
/** Turns a mark on or off between two offsets; by default on unless all the text has it. */
export declare function toggleMark(pieces: Array<TextPiece>, start: number, end: number, mark: keyof TextMarks, on?: boolean): Array<TextPiece>;
/** Replaces a range with text (line breaks become `<br>`), taking the marks of the text before it, changed by `marks`. */
export declare function replaceRange(pieces: Array<TextPiece>, start: number, end: number, text?: string, marks?: TextMarks | null): { pieces: Array<TextPiece>; caret: number };
/** Document operations that mark or unmark text in one text element, as the canvas does; and where the text is afterwards. */
export declare function markOperations(doc: DesignerDocument, hostId: string, start: number, end: number, mark: keyof TextMarks, options: { document: Document; on?: boolean; makeId?: () => string }): { operations: Array<DesignerOperation>; start: { id?: string; offset?: number; element?: string; at: number } | null; end: { id?: string; offset?: number; element?: string; at: number } | null };
/** The elements each mark is written as; the first is used for new marks. */
export declare const markTags: Record<keyof TextMarks, Array<string>>;
/** Elements that may sit inside edited text. */
export declare const inlineTags: Set<string>;
/** The registry of types an editor renders and inspects: HTML elements, text, and the catalog's components. */
export declare function createEditorTypes(catalog: ComponentCatalog): object;
/** Renders an editor document as real DOM, with live components; each element carries `data-designer-id`. */
export declare const DomEditorRender: DefineComponent<{ doc: DesignerDocument; types: object; data?: Record<string, unknown>; mode?: 'data' | 'variables'; revisions?: Record<string, number> }>;

export declare function createComponentCatalog(records: Array<{ component: object; exportName: string; section?: string; label?: string }>, options?: { html?: boolean }): Required<ComponentCatalog>;
/** A catalog of every `Dom*` component in a module's exports, such as `import * as studio from '@getdom/studio/vue'`. */
export declare function catalogFromExports(exports: Record<string, unknown>, options?: { html?: boolean }): Required<ComponentCatalog>;
export declare function schemaForComponent(component: object | string | null, hints?: Record<string, object>): Array<InspectorFieldSchema>;

export declare function createBrowserStorage<Value = unknown>(options?: { prefix?: string; storage?: Storage; onError?: (error: Error) => void }): StorageAdapter<Value>;
export declare function createMemoryStorage<Value = unknown>(): StorageAdapter<Value>;
/** A JSON API, such as a database or CMS: `GET`/`PUT {endpoint}/{id}` with `{ value }`, `GET {endpoint}` with `{ items }`. */
export declare function createHttpStorage<Value = unknown>(options: { endpoint: string; fetch?: typeof fetch; headers?: Record<string, string> }): StorageAdapter<Value>;
/** Source files behind `GET {endpoint}?path=` and `PUT {endpoint}` with `{ path, source }`. */
export declare function createFileStorage(options?: { endpoint?: string; fetch?: typeof fetch }): StorageAdapter<string>;
export declare function createSaver<Value = unknown>(adapter: Pick<StorageAdapter<Value>, 'save'>, options?: { delay?: number; onError?: (error: Error) => void }): { queue(id: string, value: Value, operations?: Array<DesignerOperation>): void; flush(): Promise<void> };

export declare function createWorkspace(sources: Array<{ source: string; name: string; path?: string }>, options?: { widths?: Array<number>; height?: number; makeId?: () => string }): DesignerWorkspace;
export declare function createDemoWorkspace(): DesignerWorkspace;
export declare function restoreWorkspace(saved: unknown): DesignerWorkspace | null;
export declare function importFile(source: string, name: string, options?: { makeId?: () => string }): { file: DesignerFile; unsupported: number; seeded: Array<string> };

export declare function createDocument(tree: object, options?: { data?: Record<string, unknown>; makeId?: () => string }): DesignerDocument;
export declare function toTree(doc: DesignerDocument, id?: string): object;
export declare function fromTree(tree: object, options?: { parent?: string | null; makeId?: () => string }): { rootId: string; nodes: Record<string, DesignerNode> };
export declare function validateDocument(doc: DesignerDocument): Array<string>;
export declare function applyOperation(doc: DesignerDocument, operation: DesignerOperation): DesignerOperation;
export declare function applyOperations(doc: DesignerDocument, operations: Array<DesignerOperation>): Array<DesignerOperation>;
export declare function createHistory(options: { apply: (operation: DesignerOperation) => DesignerOperation; limit?: number; mergeWindow?: number; now?: () => number; onChange?: () => void }): EditorHistory;

export declare function importVue(source: string, options?: { makeId?: () => string }): { doc: DesignerDocument; script: string; style: string; unsupported: number; seeded: Array<string>; ranges: Record<string, SourceRange> };
export declare function exportVue(file: Pick<DesignerFile, 'doc' | 'script' | 'style'>, isStudioComponent?: (tag: string) => boolean): string;
export declare function exportMappedVue(file: Pick<DesignerFile, 'doc' | 'script' | 'style'>, isStudioComponent?: (tag: string) => boolean): { source: string; ranges: Record<string, SourceRange> };
/** Parses edited source and reconciles it with a file, keeping node ids where the structure matches. */
export declare function applySource(file: Pick<DesignerFile, 'doc' | 'script' | 'style'>, source: string, options?: { isStudioComponent?: (tag: string) => boolean; exported?: DesignerDocument }): { doc: DesignerDocument; script: string; style: string; ranges: Record<string, SourceRange>; unsupported: number; changed: boolean };
export declare function nodeAtLine(ranges: Record<string, SourceRange>, line: number, accept?: (id: string) => boolean): string | null;
