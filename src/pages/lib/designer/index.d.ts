/* eslint-disable */
// Declarations for `@getdom/studio/designer`. Keep in step with ./index.js.
import type { DefineComponent } from 'vue';

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
	onSave?: (event: { id: string; value: DesignerWorkspace }) => void;
}
/** The DOM designer: artboards, layers, a generated inspector and a two-way code view. */
export declare const DomDesigner: DefineComponent<DomDesignerProps>;
/** Editable source with line numbers and highlighted lines. */
export declare const DomCodeView: DefineComponent<{ modelValue?: string; highlight?: SourceRange | null; label?: string; readonly?: boolean }>;

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

export declare function createWorkspace(sources: Array<{ source: string; name: string; path?: string }>, options?: { widths?: Array<number>; height?: number }): DesignerWorkspace;
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
