/**
 * `@getdom/studio/designer`: the DOM designer and its editor core.
 *
 * A separate entry from `@getdom/studio/vue`, because the designer brings the
 * Vue template compiler with it. Load it where people design, ideally with
 * `defineAsyncComponent`, so other pages stay small.
 */

export { default as DomDesigner } from '../../designer/core/DesignerWorkspace.vue';
export { default as DomCodeView } from '../../designer/core/CodeView.vue';
// Optional Monaco code view; pass `load` to import Monaco from your own install.
export { default as DomMonacoCodeView } from '../../designer/core/MonacoCodeView.vue';

// Building blocks: one editor session (documents, operations, history,
// selection), two-way code sync and its panel, and in-place text editing.
// DomDesigner is built from these; build your own editors from them too.
export { useEditorSession } from '../../designer/core/useEditorSession.js';
export { useCodeSync } from '../../designer/core/useCodeSync.js';
export { default as DomCodePanel } from '../../designer/core/CodePanel.vue';
export { useInlineText } from '../../designer/core/useInlineText.js';
// Placement: measuring, dragging, X/Y/W/H, align and distribute.
export { useLayoutGeometry } from '../../designer/core/useLayoutGeometry.js';
export { boundsOf, alignRects, distributeRects, measureFrameChild } from '../../designer/stage/layoutGeometry.js';
// Rich text as a model: what the canvas and the code panel both edit text with.
export { flatten as flattenText, marksAt, toggleMark, replaceRange, markOperations, markTags, inlineTags } from '../../designer/core/richText.js';
// Renders an editor document as real DOM, with the types the inspector and renderer use.
export { EditorRender as DomEditorRender } from '../../designer/core/EditorRender.js';
export { createEditorTypes } from '../../designer/core/componentTypes.js';

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
