/**
 * `@getdom/studio/designer`: the DOM designer and its editor core.
 *
 * A separate entry from `@getdom/studio/vue`, because the designer brings the
 * Vue template compiler with it. Load it where people design, ideally with
 * `defineAsyncComponent`, so other pages stay small.
 */

export { default as DomDesigner } from '../../designer/core/DesignerWorkspace.vue';
export { default as DomCodeView } from '../../designer/core/CodeView.vue';

// Components people can insert.
export { createComponentCatalog, catalogFromExports } from '../../designer/core/componentCatalog.js';
export { schemaForComponent } from '../../designer/core/componentSchema.js';

// Where work is kept.
export { createBrowserStorage, createMemoryStorage, createHttpStorage, createFileStorage, createSaver } from '../../designer/core/storage.js';

// Workspaces: files and the artboards that show them.
export { createWorkspace, createCanvasDemo as createDemoWorkspace, restoreWorkspace, importFile } from '../../designer/canvas/canvasWorkspace.js';

// Documents, operations and history.
export { createDocument, toTree, fromTree, validateDocument } from '../../designer/core/editorDocument.js';
export { applyOperation, applyOperations } from '../../designer/core/operations.js';
export { createHistory } from '../../designer/core/history.js';

// Vue source in and out, and two-way sync.
export { importVue, exportVue, exportMappedVue } from '../../designer/core/vueAdapter.js';
export { applySource, nodeAtLine } from '../../designer/core/sourceSync.js';
