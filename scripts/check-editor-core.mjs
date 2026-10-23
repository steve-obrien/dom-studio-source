import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copySubtree, createDocument, expr, nodeId, text, toTree, validateDocument } from '../src/pages/designer/core/editorDocument.js';
import { applyOperation, applyOperations } from '../src/pages/designer/core/operations.js';
import { createHistory } from '../src/pages/designer/core/history.js';
import { UNKNOWN, createScope, evaluate, expressionReferences, parseFor } from '../src/pages/designer/core/expression.js';
import { collectReferences, generateSampleData, mergeData, parseDirective, previewData, scriptData } from '../src/pages/designer/core/previewData.js';
import { createHtmlTypeRegistry, treeFromType } from '../src/pages/designer/core/typeRegistry.js';
import { exportVue, importVue } from '../src/pages/designer/core/vueAdapter.js';
import { applyWorkspaceOperation, createCanvasDemo, exportFile, restoreWorkspace } from '../src/pages/designer/canvas/canvasWorkspace.js';
import { importVueFile, sampleVueFile } from '../src/pages/designer/canvas/canvasDocument.js';
import { alignRects, boundsOf, distributeRects } from '../src/pages/designer/stage/alignGeometry.js';
import { applySource, matchNodes, nodeAtLine } from '../src/pages/designer/core/sourceSync.js';
import { catalogFromExports, createComponentCatalog } from '../src/pages/designer/core/componentCatalog.js';
import { schemaForComponent } from '../src/pages/designer/core/componentSchema.js';
import { createEditorTypes } from '../src/pages/designer/core/componentTypes.js';
import { createWorkspace } from '../src/pages/designer/canvas/canvasWorkspace.js';
import { exportMappedVue } from '../src/pages/designer/core/vueAdapter.js';
import { createBrowserStorage, createHttpStorage, createMemoryStorage, createSaver } from '../src/pages/designer/core/storage.js';
import { handleFileRequest, safeFilePath } from '../src/pages/designer/core/fileStorageServer.js';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { createPoster, createSocialCard, exportPosterHtml } from '../src/pages/designer/poster/posterModel.js';
import { createPosterTypes, documentToPoster, posterToDocument } from '../src/pages/designer/poster/posterTypes.js';
import { backgroundFromCss, backgroundToCssProperties, createBackgroundState, createFill } from '../src/pages/designer/background-editor/backgroundModel.js';
import { createShadow, shadowListToCss, shadowsFromCss } from '../src/pages/designer/shadow-editor/shadowModel.js';
import { borderFromCss, borderToCss } from '../src/pages/designer/border-editor/borderModel.js';
import { backdropFromCss } from '../src/pages/designer/backdrop-editor/backdropModel.js';
import { toggleDecoration, typographyFromCss, typographyToCssProperties, typographyToStyle } from '../src/pages/designer/typography-editor/typographyModel.js';
import { splitColorAlpha, splitCssList } from '../src/pages/designer/_shared/cssValue.js';
import { artboardViewportCss } from '../src/pages/designer/canvas/artboardCss.js';

function counter() {
	let index = 0;
	return () => `n_${String(++index).padStart(3, '0')}`;
}

function sampleDoc() {
	return createDocument({
		type: 'html:section',
		props: { class: 'p-6' },
		children: [
			{ type: 'html:h1', props: {}, children: [text(expr('project.name'))] },
			{ type: 'html:p', props: { class: 'text-sm' }, children: [text('Hello')] },
			{ type: 'html:ul', props: {}, children: [{ type: 'html:li', props: {}, directives: ['v-for="item in items"'], children: [text(expr('item.label'))] }] },
		],
	}, { makeId: counter() });
}

test('ids are short, prefixed and unique', () => {
	const ids = new Set(Array.from({ length: 2000 }, nodeId));
	assert.equal(ids.size, 2000);
	for (const id of ids) assert.match(id, /^n_[a-z2-9]{10}$/);
});

test('documents are flat maps with parent pointers', () => {
	const doc = sampleDoc();
	assert.deepEqual(validateDocument(doc), []);
	assert.equal(doc.rootId, 'n_001');
	assert.deepEqual(doc.nodes.n_001.children, ['n_002', 'n_004', 'n_006']);
	assert.equal(doc.nodes.n_003.parent, 'n_002');
	assert.deepEqual(doc.nodes.n_003.props.value, { expr: 'project.name' });
	assert.equal(toTree(doc).children[2].children[0].directives[0], 'v-for="item in items"');
});

test('every operation returns an inverse that restores the document', () => {
	const doc = sampleDoc();
	const before = JSON.stringify(doc);
	const fragment = copySubtree(doc, 'n_004', { freshIds: true, makeId: counter() });
	const operations = [
		{ op: 'setProp', id: 'n_001', key: 'class', value: 'p-10' },
		{ op: 'setProp', id: 'n_004', key: 'class', value: undefined },
		{ op: 'setText', id: 'n_005', value: 'Changed' },
		{ op: 'setField', id: 'n_001', key: 'layout', value: { mode: 'flex', gap: 12 } },
		{ op: 'setData', path: ['project', 'name'], value: 'Atlas' },
		{ op: 'move', id: 'n_004', parent: 'n_006', index: 0 },
		{ op: 'move', id: 'n_004', parent: 'n_001', index: 0 },
		{ op: 'remove', id: 'n_006' },
		{ op: 'insert', parent: 'n_001', index: 1, fragment: { rootId: 'x_root', nodes: Object.fromEntries(Object.entries(fragment.nodes).map(([id, node]) => [id === fragment.rootId ? 'x_root' : `x_${id}`, { ...node, id: id === fragment.rootId ? 'x_root' : `x_${id}`, parent: node.parent ? (node.parent === fragment.rootId ? 'x_root' : `x_${node.parent}`) : null, children: node.children.map((child) => `x_${child}`) }])) } },
	];
	const inverses = applyOperations(doc, operations);
	assert.deepEqual(validateDocument(doc), []);
	assert.equal(doc.nodes.n_001.props.class, 'p-10');
	assert.equal('class' in doc.nodes.n_004.props, false);
	assert.equal(doc.nodes.n_005.props.value, 'Changed');
	assert.equal(doc.data.project.name, 'Atlas');
	assert.equal(doc.nodes.n_006, undefined);
	assert.equal(doc.nodes.n_007, undefined, 'removing a node removes its subtree');
	assert.deepEqual(doc.nodes.n_001.children, ['n_004', 'x_root', 'n_002']);
	applyOperations(doc, inverses);
	assert.deepEqual(JSON.parse(JSON.stringify(doc)), JSON.parse(before));
});

test('invalid operations are refused without changing the document', () => {
	const doc = sampleDoc();
	const before = JSON.stringify(doc);
	assert.throws(() => applyOperation(doc, { op: 'remove', id: doc.rootId }), /root/);
	assert.throws(() => applyOperation(doc, { op: 'move', id: 'n_006', parent: 'n_007', index: 0 }), /inside itself/);
	assert.throws(() => applyOperation(doc, { op: 'setField', id: 'n_001', key: 'parent', value: 'n_002' }), /not editable/);
	assert.throws(() => applyOperation(doc, { op: 'setProp', id: 'missing', key: 'a', value: 1 }), /Unknown node/);
	assert.throws(() => applyOperation(doc, { op: 'explode' }), /Unknown operation/);
	assert.equal(JSON.stringify(doc), before);
});

test('history undoes and redoes batches, and merges continuous edits', () => {
	const doc = sampleDoc();
	let time = 0;
	const history = createHistory({ apply: (operation) => applyOperation(doc, operation), now: () => time });
	const original = JSON.stringify(doc);
	history.run([{ op: 'setProp', id: 'n_001', key: 'class', value: 'p-1' }], { merge: 'class' });
	time += 100;
	history.run({ op: 'setProp', id: 'n_001', key: 'class', value: 'p-12' }, { merge: 'class' });
	assert.equal(history.size().undo, 1, 'typing merges into one entry');
	history.run([{ op: 'remove', id: 'n_004' }, { op: 'setText', id: 'n_003', value: 'Plain' }]);
	assert.equal(history.size().undo, 2);
	const edited = JSON.stringify(doc);
	assert.ok(history.undo());
	assert.ok(doc.nodes.n_004);
	assert.deepEqual(doc.nodes.n_003.props.value, { expr: 'project.name' });
	assert.ok(history.undo());
	assert.deepEqual(JSON.parse(JSON.stringify(doc)), JSON.parse(original));
	assert.equal(history.undo(), false);
	assert.ok(history.redo());
	assert.ok(history.redo());
	assert.deepEqual(JSON.parse(JSON.stringify(doc)), JSON.parse(edited));
	time += 5000;
	history.run({ op: 'setProp', id: 'n_001', key: 'class', value: 'p-2' }, { merge: 'class' });
	assert.equal(history.size().redo, 0, 'a new change clears redo');
	assert.equal(history.size().undo, 3, 'merging stops after the window');
});

test('expressions evaluate safely against preview data', () => {
	const scope = createScope({ project: { name: 'Atlas', tasks: [{ done: true }, { done: false }], price: 12.5 }, count: 3, slug: 'atlas' });
	assert.equal(evaluate('project.name', scope), 'Atlas');
	assert.equal(evaluate("project?.owner?.name ?? 'Nobody'", scope), 'Nobody');
	assert.equal(evaluate('project.tasks.length', scope), 2);
	assert.equal(evaluate('project.tasks[1].done ? "yes" : "no"', scope), 'no');
	assert.equal(evaluate('project.price.toFixed(2)', scope), '12.50');
	assert.equal(evaluate('`/projects/${slug}?n=${count + 1}`', scope), '/projects/atlas?n=4');
	assert.equal(evaluate('count > 2 && project.name.toUpperCase()', scope), 'ATLAS');
	assert.deepEqual(evaluate("{ active: count > 1, 'is-big': false }", scope), { active: true, 'is-big': false });
	assert.equal(evaluate('missing.value', scope), UNKNOWN);
	assert.equal(evaluate('formatDate(project.date)', scope), UNKNOWN, 'functions from the script are not called');
	assert.equal(evaluate('project.constructor', scope), UNKNOWN);
	assert.equal(evaluate('project["__proto__"]', scope), UNKNOWN);
	assert.equal(evaluate('slug.constructor.constructor("return 1")()', scope), UNKNOWN);
	assert.equal(evaluate('project.tasks.map(t => t.done)', scope), UNKNOWN);
	assert.equal(evaluate('alert(1', scope), UNKNOWN, 'syntax errors are not thrown');
});

test('references and v-for aliases resolve to data paths', () => {
	assert.deepEqual(expressionReferences('metric.value.toFixed(1)'), [{ path: ['metric', 'value'], hint: 'number' }]);
	assert.deepEqual(expressionReferences('items[0].name'), [{ path: ['items', '[]', 'name'] }]);
	assert.deepEqual(expressionReferences('tasks.length'), [{ path: ['tasks'], hint: 'array' }]);
	assert.deepEqual(parseFor('(row, index) in rows'), { value: 'row', names: [], keys: [], key: 'index', index: null, source: 'rows' });
	assert.deepEqual(parseFor('{ id, title: heading } of posts').names, ['id', 'heading']);
	assert.deepEqual(parseDirective('v-for="item in items"'), { name: 'for', arg: '', modifiers: [], value: 'item in items' });
	assert.deepEqual(parseDirective('@click.prevent="save"'), { name: 'on', arg: 'click', modifiers: ['prevent'], value: 'save' });
	assert.equal(parseDirective('#header').name, 'slot');
	const references = collectReferences(sampleDoc()).map(({ path }) => path.join('.'));
	assert.deepEqual(references.sort(), ['items', 'items.[].label', 'project.name']);
});

test('sample data follows the template, and script and typed values win', () => {
	const doc = sampleDoc();
	const sample = generateSampleData(doc);
	assert.equal(typeof sample.project.name, 'string');
	assert.equal(sample.items.length, 3);
	assert.equal(typeof sample.items[0].label, 'string');
	assert.notEqual(sample.items[0].label, sample.items[1].label, 'rows differ');
	const script = `<script setup>\nimport { ref } from 'vue';\nconst project = ref({ name: 'Launch OS', owner: 'Product team' });\nconst items = [\n\t{ label: 'One' },\n\t{ label: 'Two' },\n]\nconst total = computed(() => items.length);\n</script>`;
	assert.deepEqual(scriptData(script), { project: { name: 'Launch OS', owner: 'Product team' }, items: [{ label: 'One' }, { label: 'Two' }] });
	doc.data = { project: { name: 'Typed' } };
	const data = previewData(doc, { script });
	assert.equal(data.project.name, 'Typed');
	assert.equal(data.project.owner, 'Product team');
	assert.deepEqual(data.items.map((item) => item.label), ['One', 'Two']);
	assert.deepEqual(mergeData({ list: [{ a: 1, b: 2 }] }, { list: [{ a: 5 }, { a: 6 }] }), { list: [{ a: 5, b: 2 }, { a: 6, b: 2 }] });
});

test('HTML types describe their inspector fields and starter content', () => {
	const registry = createHtmlTypeRegistry();
	const link = registry.get('html:a');
	assert.equal(link.label, 'Link');
	assert.equal(link.container, true);
	assert.deepEqual(link.schema.map((field) => field.key).slice(0, 2), ['class', 'href']);
	assert.equal(registry.get('html:img').container, false);
	assert.equal(registry.get('vue:ProjectCard').placeholder, true, 'unknown components still render as placeholders');
	const tree = treeFromType(registry.get('html:ul'));
	const doc = createDocument(tree, { makeId: counter() });
	assert.equal(Object.keys(doc.nodes).length, 5);
	assert.deepEqual(validateDocument(doc), []);
});

test('Vue files round-trip through the document', () => {
	const source = `<script setup>\nimport { DomButton } from '@getdom/studio/vue';\nconst project = ref({ name: 'Atlas' });\n</script>\n\n<template>\n\t<section class="p-6" :class="{ 'opacity-50': busy }">\n\t\t<h1>{{ project.name }}</h1>\n\t\t<p v-if="project.owner">Owned by {{ project.owner }}</p>\n\t\t<DomButton variant="secondary" :disabled="busy" @click="save">Save</DomButton>\n\t</section>\n</template>\n\n<style scoped>\nsection { color: red; }\n</style>\n`;
	const { doc, script, style, seeded } = importVue(source, { makeId: counter() });
	assert.deepEqual(validateDocument(doc), []);
	const root = doc.nodes[doc.rootId];
	assert.equal(root.type, 'html:section');
	assert.equal(root.props.class, 'p-6');
	assert.deepEqual(root.props[':class'], { expr: "{ 'opacity-50': busy }" });
	const button = Object.values(doc.nodes).find((node) => node.type === 'vue:DomButton');
	assert.deepEqual(button.props.disabled, { expr: 'busy' });
	assert.deepEqual(button.directives, ['@click="save"']);
	assert.deepEqual(seeded, ['project']);
	const exported = exportVue({ doc, script, style });
	assert.match(exported, /<section class="p-6" :class="\{ 'opacity-50': busy \}">/);
	assert.match(exported, /<h1>\{\{ project\.name \}\}<\/h1>/);
	assert.match(exported, /<p v-if="project\.owner">Owned by \{\{ project\.owner \}\}<\/p>/);
	assert.match(exported, /<DomButton variant="secondary" :disabled="busy" @click="save">Save<\/DomButton>/);
	assert.ok(exported.startsWith(script));
	assert.ok(exported.trimEnd().endsWith(style.trimEnd()));
	const again = importVue(exported, { makeId: counter() });
	assert.equal(exportVue({ doc: again.doc, script: again.script, style: again.style }), exported, 'export is stable');
});

test('the canvas workspace runs file, artboard and node operations through one history', () => {
	const workspace = createCanvasDemo();
	assert.deepEqual(createCanvasDemo(), workspace, 'the starter is deterministic, so server render and hydration agree');
	const original = JSON.parse(JSON.stringify(workspace));
	const history = createHistory({ apply: (operation) => applyWorkspaceOperation(workspace, operation) });
	const [file] = workspace.files;
	const title = Object.values(file.doc.nodes).find((node) => node.type === 'html:h1');
	history.run([
		{ file: file.id, op: 'setProp', id: title.id, key: 'class', value: 'text-5xl' },
		{ op: 'setArtboard', id: 'board_mobile', key: 'width', value: 430 },
		{ op: 'addFile', value: { id: 'file_2', name: 'Two.vue', script: '', style: '', doc: createDocument(text('Hi')) } },
		{ op: 'addArtboard', board: { id: 'board_2', fileId: 'file_2', name: 'Two', x: 0, y: 900, width: 800, height: 600 } },
	]);
	history.run([{ op: 'removeArtboard', id: 'board_desktop' }, { op: 'setFile', id: file.id, key: 'name', value: 'Renamed.vue' }]);
	assert.equal(workspace.files.length, 2);
	assert.equal(workspace.artboards.map((board) => board.id).join(), 'board_mobile,board_2');
	assert.match(exportFile(workspace.files[0]), /<h1 class="text-5xl">\{\{ project\.name \}\}<\/h1>/);
	history.undo();
	history.undo();
	assert.deepEqual(JSON.parse(JSON.stringify(workspace)), original);
	assert.throws(() => history.run([{ op: 'setArtboard', id: 'board_mobile', key: 'x', value: 5 }, { op: 'setArtboard', id: 'missing', key: 'x', value: 1 }]), /Unknown artboard/);
	assert.equal(workspace.artboards[1].x, 1280, 'a failed batch rolls back');
});

test('canvases saved in the first format are upgraded', () => {
	const { file } = importVueFile(sampleVueFile, 'Old.vue');
	const restored = restoreWorkspace({ files: [file], artboards: [{ id: 'b', fileId: file.id, name: 'Desktop', x: 0, y: 0, width: 1200, height: 760 }] });
	assert.equal(restored.version, 2);
	assert.deepEqual(validateDocument(restored.files[0].doc), []);
	// The demo keeps its source text; compare against its full print, which an upgraded old canvas gets.
	assert.equal(exportFile(restored.files[0]), exportFile({ ...createCanvasDemo().files[0], source: undefined }));
	assert.equal(restoreWorkspace({ files: [], artboards: [] }), null);
	assert.equal(restoreWorkspace('nonsense'), null);
});

test('align and distribute rectangles', () => {
	const rects = [{ id: 'a', left: 10, top: 0, width: 20, height: 10 }, { id: 'b', left: 50, top: 30, width: 40, height: 10 }, { id: 'c', left: 200, top: 60, width: 10, height: 10 }];
	assert.deepEqual(boundsOf(rects), { left: 10, top: 0, width: 200, height: 70 });
	assert.deepEqual(alignRects(rects, 'left').map((rect) => rect.left), [10, 10, 10]);
	assert.deepEqual(alignRects(rects, 'right').map((rect) => rect.left), [190, 170, 200]);
	assert.deepEqual(alignRects(rects, 'middle').map((rect) => rect.top), [30, 30, 30]);
	assert.deepEqual(alignRects([rects[0]], 'center', { left: 0, top: 0, width: 100, height: 100 })[0].left, 40);
	// Gaps become equal: occupied 70 of the 200 span leaves two gaps of 65.
	const spaced = distributeRects(rects, 'horizontal');
	assert.deepEqual(spaced.map((rect) => rect.left), [10, 95, 200]);
	assert.deepEqual(distributeRects(rects.slice(0, 2), 'horizontal'), rects.slice(0, 2));
});

test('poster documents round-trip and export the same HTML', () => {
	for (const create of [createPoster, createSocialCard]) {
		const poster = create();
		const doc = posterToDocument(poster);
		assert.deepEqual(validateDocument(doc), []);
		assert.equal(doc.rootId, 'frame');
		assert.deepEqual(documentToPoster(doc), poster);
		assert.equal(exportPosterHtml(documentToPoster(doc)), exportPosterHtml(poster));
	}
	const doc = posterToDocument(createPoster());
	assert.equal(doc.nodes.photo.locked, true);
	assert.equal(doc.nodes.photo.label, 'Glencoe, Scottish Highlands');
	const types = createPosterTypes();
	const fieldKeys = (type) => types.get(type).schema.flatMap((field) => field.keys || [field.key]);
	assert.ok(fieldKeys('poster:text').includes('fontSize'));
	assert.ok(!fieldKeys('poster:image').includes('fontSize'));
	assert.equal(types.get('vue:DomButton'), null);
});

test('poster edits are operations with undo', () => {
	const doc = posterToDocument(createPoster());
	const history = createHistory({ apply: (operation) => applyOperation(doc, operation) });
	history.run([{ op: 'setProp', id: 'headline', key: 'x', value: 120 }, { op: 'setField', id: 'headline', key: 'hidden', value: true }]);
	assert.equal(documentToPoster(doc).layers[1].x, 120);
	assert.equal(documentToPoster(doc).layers[1].hidden, true);
	assert.ok(!exportPosterHtml(documentToPoster(doc)).includes('THE HIGHLANDS'));
	history.run({ op: 'move', id: 'headline', parent: 'frame', index: 0 });
	assert.deepEqual(doc.nodes.frame.children, ['headline', 'photo']);
	history.undo();
	history.undo();
	assert.deepEqual(documentToPoster(doc), createPoster());
});

test('export maps every node to its source lines', () => {
	const file = createCanvasDemo().files[0];
	const { source, ranges } = exportMappedVue(file);
	const lines = source.split('\n');
	const h1 = Object.values(file.doc.nodes).find((node) => node.type === 'html:h1');
	assert.match(lines[ranges[h1.id].start - 1], /<h1 /);
	const root = ranges[file.doc.rootId];
	assert.match(lines[root.start - 1], /^\t<section/);
	assert.match(lines[root.end - 1], /^\t<\/section>/);
	assert.equal(nodeAtLine(ranges, ranges[h1.id].start, (id) => file.doc.nodes[id].type !== 'text'), h1.id);
});

test('code edits reconcile with the document and keep ids', () => {
	const file = createCanvasDemo().files[0];
	const { source } = exportMappedVue(file);
	assert.equal(applySource(file, source).changed, false);
	const h1 = Object.values(file.doc.nodes).find((node) => node.type === 'html:h1');
	const grid = Object.values(file.doc.nodes).find((node) => String(node.props.class).includes('grid-cols-1'));
	applyOperation(file.doc, { op: 'setField', id: grid.id, key: 'layout', value: { mode: 'flex', gap: 12, padding: 16 } });
	applyOperation(file.doc, { op: 'setField', id: h1.id, key: 'label', value: 'Title' });
	const edited = exportMappedVue(file).source.replace('Next milestone', 'Next big milestone').replace('text-3xl font-semibold tracking-tight', 'text-4xl font-semibold tracking-tight');
	const result = applySource(file, edited);
	assert.equal(result.changed, true);
	assert.equal(result.doc.rootId, file.doc.rootId);
	assert.equal(result.doc.nodes[h1.id].props.class, 'text-4xl font-semibold tracking-tight');
	// A changed node keeps its layer name; an untouched frame keeps its explicit layout.
	assert.equal(result.doc.nodes[h1.id].label, 'Title');
	assert.equal(result.doc.nodes[grid.id].layout.mode, 'flex');
	const line = edited.split('\n').findIndex((text) => text.includes('Next big')) + 1;
	assert.equal(result.doc.nodes[nodeAtLine(result.ranges, line, (id) => result.doc.nodes[id].type !== 'text')].type, 'html:h2');
	assert.throws(() => applySource(file, edited.replace('</section>', '</section')));
});

test('matching pairs children in order by type', () => {
	const previous = createDocument({ type: 'html:div', children: [{ type: 'html:p' }, { type: 'html:h2' }, { type: 'html:p' }] }, { makeId: counter() });
	const next = createDocument({ type: 'html:div', children: [{ type: 'html:h2' }, { type: 'html:p' }] }, { makeId: () => nodeId() });
	const pairs = matchNodes(previous, next);
	const [h2, p] = next.nodes[next.rootId].children;
	assert.equal(pairs.get(h2), 'n_003');
	assert.equal(pairs.get(p), 'n_004');
});

test('storage adapters load, save, list and batch', async () => {
	const backing = new Map();
	const fake = { getItem: (key) => backing.get(key) ?? null, setItem: (key, value) => backing.set(key, value), key: (index) => [...backing.keys()][index], get length() { return backing.size; } };
	const browser = createBrowserStorage({ prefix: 'test:', storage: fake });
	assert.equal(await browser.load('a'), null);
	await browser.save('a', { value: 1 });
	assert.deepEqual(await browser.load('a'), { value: 1 });
	assert.deepEqual(await browser.list(), [{ id: 'a' }]);
	const failing = createBrowserStorage({ storage: { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('full'); } }, onError: () => {} });
	assert.equal(await failing.load('a'), null);
	await failing.save('a', 1);

	const memory = createMemoryStorage();
	const seen = [];
	memory.subscribe('doc', (change) => seen.push(change.value.n));
	await memory.save('doc', { n: 1 }, { operations: [{ op: 'setProp' }] });
	assert.deepEqual(seen, [1]);

	const requests = [];
	const http = createHttpStorage({ endpoint: '/api/documents/', fetch: async (url, init = {}) => {
		requests.push([init.method || 'GET', url, init.body]);
		if (url.endsWith('/missing')) return new Response('', { status: 404 });
		return new Response(JSON.stringify({ value: { ok: true }, items: [{ id: 'home' }] }), { status: 200 });
	} });
	assert.equal(await http.load('missing'), null);
	assert.deepEqual(await http.load('home page'), { ok: true });
	await http.save('home', { title: 'Home' }, { operations: [{ op: 'setProp' }] });
	assert.deepEqual(requests[1].slice(0, 2), ['GET', '/api/documents/home%20page']);
	assert.deepEqual(JSON.parse(requests[2][2]), { value: { title: 'Home' }, operations: [{ op: 'setProp' }] });

	const saved = [];
	const saver = createSaver({ save: async (id, value, { operations }) => saved.push([id, value, operations.length]) }, { delay: 5 });
	saver.queue('x', 1, [{}]);
	saver.queue('x', 2, [{}]);
	await saver.flush();
	assert.deepEqual(saved, [['x', 2, 2]]);
});

test('file storage endpoint stays inside its folder', async () => {
	const root = await mkdtemp(path.join(tmpdir(), 'designer-files-'));
	assert.throws(() => safeFilePath(root, '../secrets.vue'));
	assert.throws(() => safeFilePath(root, '.hidden/a.vue'));
	assert.throws(() => safeFilePath(root, 'notes.txt'));
	assert.equal(safeFilePath(root, 'pages/Home.vue').relative, 'pages/Home.vue');
	async function call(method, url, body) {
		const request = new PassThrough();
		Object.assign(request, { method, url });
		const response = { headers: {}, statusCode: 200, setHeader(key, value) { this.headers[key] = value; }, end(value) { this.body = value; } };
		const done = handleFileRequest(root, request, response);
		request.end(body ? JSON.stringify(body) : undefined);
		await done;
		return response;
	}
	assert.equal((await call('PUT', '/', { path: 'pages/Home.vue', source: '<template><p>Hi</p></template>' })).statusCode, 200);
	assert.equal(await readFile(path.join(root, 'pages/Home.vue'), 'utf8'), '<template><p>Hi</p></template>\n');
	assert.deepEqual(JSON.parse((await call('GET', '/')).body), { files: [{ path: 'pages/Home.vue' }] });
	assert.equal(JSON.parse((await call('GET', '/?path=pages%2FHome.vue')).body).source, '<template><p>Hi</p></template>\n');
	assert.equal((await call('GET', '/?path=missing.vue')).statusCode, 404);
	assert.equal((await call('PUT', '/', { path: '../x.vue', source: '' })).statusCode, 400);
});

test('component catalogs come from exports, not the docs site', () => {
	const DomBadge = { name: 'DomBadge', render() {}, props: { tone: { type: String, default: 'neutral', _edit: { component: 'DomSelectInput', options: ['neutral', 'success'] } }, count: Number, items: Array }, __doc: { slots: [{ name: 'default' }] } };
	const DomSecret = { render() {}, __doc: { hidden: true } };
	const catalog = catalogFromExports({ DomBadge, DomSecret, helper: () => {}, version: '1' });
	const badge = catalog.lookupByName('DomBadge');
	assert.equal(badge.label, 'Badge');
	assert.equal(badge.accepts, 'children');
	assert.equal(badge.defaults.props.tone, 'neutral');
	assert.equal(catalog.lookupByName('DomSecret'), null);
	assert.ok(catalog.lookupById('html-img'));
	assert.equal(createComponentCatalog([], { html: false }).entries.length, 0);
	assert.deepEqual(schemaForComponent(DomBadge).map((field) => [field.key, field.component]), [['tone', 'DomSelectInput'], ['count', 'DomNumberInput']]);
	assert.deepEqual(schemaForComponent(DomBadge).find((field) => field.key === 'tone').props, { options: ['neutral', 'success'] });
	const types = createEditorTypes(catalog);
	assert.equal(types.get('vue:DomBadge').schema.some((field) => field.key === 'tone'), true);
	assert.equal(types.get('vue:LocalWidget').placeholder, true);
});

test('workspaces open from source files', () => {
	const workspace = createWorkspace([
		{ name: 'Home.vue', path: 'pages/Home.vue', source: '<template><main><h1>Home</h1></main></template>' },
		{ name: 'About.vue', source: '<template><main><h1>About</h1></main></template>' },
	], { widths: [1200, 390], height: 600 });
	assert.equal(workspace.files.length, 2);
	assert.equal(workspace.files[0].path, 'pages/Home.vue');
	assert.deepEqual(workspace.artboards.map((board) => [board.name, board.x, board.y]), [['Home 1200', 0, 0], ['Home 390', 1280, 0], ['About 1200', 0, 680], ['About 390', 1280, 680]]);
	assert.ok(workspace.artboards.every((board) => workspace.files.some((file) => file.id === board.fileId)));
});

test('memory storage copies reactive-style values', async () => {
	const memory = createMemoryStorage();
	const proxy = new Proxy({ files: [{ name: 'A.vue' }] }, {});
	await memory.save('w', proxy);
	assert.deepEqual(await memory.load('w'), { files: [{ name: 'A.vue' }] });
});

test('material editors read back the CSS they write', () => {
	assert.deepEqual(splitCssList('0 1px rgb(0 0 0 / 5%), inset 0 0 0 1px red'), ['0 1px rgb(0 0 0 / 5%)', 'inset 0 0 0 1px red']);
	assert.deepEqual(splitColorAlpha('rgba(255, 0, 0, 0.40)'), { color: '#ff0000', alpha: 40 });
	assert.deepEqual(splitColorAlpha('color-mix(in oklch, var(--primary) 20%, transparent)'), { color: 'var(--primary)', alpha: 20 });

	const background = createBackgroundState({ fills: [createFill({ kind: 'linear', gradientFromAlpha: 50 }), createFill({ kind: 'radial' }), createFill({ color: '#ff0000', alpha: 40 })] });
	const css = backgroundToCssProperties(background);
	assert.equal(css['background-color'], 'rgba(255, 0, 0, 0.40)');
	const read = backgroundFromCss({ color: css['background-color'], image: css['background-image'] });
	assert.deepEqual(read.fills.map((fill) => fill.kind), ['linear', 'radial', 'solid']);
	assert.deepEqual(backgroundToCssProperties(read), css);
	assert.equal(backgroundFromCss({ image: 'url(a.png)' }), null);
	assert.equal(backgroundToCssProperties(createBackgroundState({ fills: [createFill({ color: '#171717' })] }))['background-color'], '#171717');

	const shadows = [createShadow(), createShadow({ kind: 'inset', alpha: 30 }), createShadow({ kind: 'ring', spread: 2, color: 'var(--primary)' })];
	const shadowCss = shadowListToCss(shadows);
	assert.equal(shadowListToCss(shadowsFromCss(shadowCss)), shadowCss);
	assert.deepEqual(shadowsFromCss(shadowCss).map((shadow) => shadow.kind), ['drop', 'inset', 'ring']);
	assert.equal(shadowsFromCss('0 1rem 2px red'), null);
	assert.deepEqual(shadowsFromCss('none'), []);

	assert.equal(borderToCss(borderFromCss('2px dashed var(--border)')), '2px dashed var(--border)');
	assert.equal(borderFromCss('').enabled, false);
	assert.equal(borderFromCss('1em solid red'), null);

	assert.deepEqual({ ...backdropFromCss('blur(8px) saturate(1.2)') }, { enabled: true, open: true, blur: 8, saturate: 1.2 });
	assert.equal(backdropFromCss('blur(8px) grayscale(1)'), null);
});

test('typography records map to inline CSS and back', () => {
	const css = typographyToCssProperties({ fontFamily: 'Georgia, serif', fontSize: 24, lineHeight: 1.4, letterSpacing: '0.02em', fontWeight: '700', textDecoration: 'underline', color: '' });
	assert.equal(css['font-size'], '24px');
	assert.equal(css['line-height'], '1.4');
	assert.equal(css['letter-spacing'], '0.02em');
	assert.equal(css['text-decoration-line'], 'underline');
	assert.equal(css.color, '');
	const read = typographyFromCss(css);
	assert.equal(read.fontSize, 24);
	assert.equal(read.lineHeight, 1.4);
	assert.equal(read.letterSpacing, '0.02em');
	assert.deepEqual(typographyToStyle({ fontSize: 12, color: '' }), { fontSize: '12px' });
	assert.equal(typographyToCssProperties({ fontFamily: 'x; color: red' })['font-family'], '');
	assert.equal(toggleDecoration('underline', 'line-through'), 'underline line-through');
	assert.equal(toggleDecoration('underline', 'underline'), 'none');
});

test('Google fonts are recognised from CSS stacks and linked once per weight', async () => {
	const { fontPickerRecords, googleFontFamily, googleFontLinks } = await import('../src/pages/designer/typography-editor/googleFonts.js');
	assert.equal(googleFontFamily("'Lato', sans-serif"), 'Lato');
	assert.equal(googleFontFamily('"open sans", sans-serif'), 'Open Sans');
	assert.equal(googleFontFamily('Georgia, serif'), '');
	assert.deepEqual(googleFontLinks([{ fontFamily: "'Open Sans', sans-serif", fontWeight: '700' }, { fontFamily: "'Open Sans', sans-serif" }, { fontFamily: 'Arial' }]), [
		'https://fonts.googleapis.com/css2?family=Open+Sans&display=swap',
		'https://fonts.googleapis.com/css2?family=Open+Sans:wght@700&display=swap',
	]);
	assert.ok(fontPickerRecords(undefined, false).every((font) => font.source === 'system'));
	assert.ok(fontPickerRecords().some((font) => font.value === "'Lato', sans-serif"));
	const poster = createSocialCard();
	poster.layers.find((layer) => layer.type === 'text').fontFamily = "'Lato', sans-serif";
	assert.match(exportPosterHtml(poster), /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Lato/);
});

test('artboards resolve viewport-height units against the device height, not the grown frame', () => {
	const css = '.min-h-\\[78svh\\]{min-height:78svh}@media (min-height:50vh){.a{height:calc(100dvh - 2rem);margin:-2vh;width:10vw}}';
	const out = artboardViewportCss(css);
	assert.match(out, /^\.min-h-\\\[78svh\\\]\{min-height:calc\(78 \* var\(--artboard-vh, 1vh\)\)\}/);
	assert.match(out, /@media \(min-height:50vh\)/);
	assert.match(out, /height:calc\(calc\(100 \* var\(--artboard-vh, 1vh\)\) - 2rem\)/);
	assert.match(out, /margin:calc\(-2 \* var\(--artboard-vh, 1vh\)\)/);
	assert.match(out, /width:10vw/);
	assert.equal(artboardViewportCss('.a{color:red}'), '.a{color:red}');
});

test('a file imported from source exports as that source, with only changed nodes rewritten', async () => {
	const { fromTree } = await import('../src/pages/designer/core/editorDocument.js');
	const { applySource } = await import('../src/pages/designer/core/sourceSync.js');
	const source = `<template>
	<div data-page class="p-4">
		<!-- hero -->
		<Reveal v-bind="opts" :appear="true" class="mx-auto">
			<h1 id="title" class="text-5xl">
				Grow <span class="text-primary">traffic</span> today
			</h1>
			<img :src="logo" alt="">
			<MyCard v-for="item in items" :key="item.id" @click="open(item)" />
		</Reveal>
		<p class="mt-2">Fine print</p>
	</div>
</template>

<script setup lang="ts">
const opts = { appear: false };
</script>
`;
	const parsed = importVue(source);
	const file = { doc: parsed.doc, script: parsed.script, style: parsed.style, source: parsed.sourceMap };
	assert.equal(exportVue(file), source);
	const nodes = Object.values(file.doc.nodes);
	const reveal = nodes.find((node) => node.type === 'vue:Reveal');
	const heading = nodes.find((node) => node.props.id === 'title');
	const paragraph = nodes.find((node) => node.type === 'html:p');
	const undo = [];
	const apply = (operation) => undo.unshift(applyOperation(file.doc, operation));
	apply({ op: 'setProp', id: reveal.id, key: 'class', value: 'mx-auto max-w-4xl' });
	apply({ op: 'setProp', id: heading.children[0] && file.doc.nodes[heading.children[0]].id, key: 'value', value: ' Grow your ' });
	apply({ op: 'setProp', id: paragraph.id, key: 'title', value: 'Note' });
	let out = exportVue(file);
	assert.match(out, /<Reveal v-bind="opts" :appear="true" class="mx-auto max-w-4xl">/);
	assert.match(out, /\n\t\t\t\tGrow your <span class="text-primary">traffic<\/span> today\n/);
	assert.match(out, /<p class="mt-2" title="Note">Fine print<\/p>/);
	assert.match(out, /<!-- hero -->/);
	assert.match(out, /<MyCard v-for="item in items" :key="item\.id" @click="open\(item\)" \/>/);
	// Structure: remove the image, add a paragraph after the heading, move the card first.
	const image = nodes.find((node) => node.type === 'html:img');
	const card = nodes.find((node) => node.type === 'vue:MyCard');
	apply({ op: 'remove', id: image.id });
	apply({ op: 'insert', parent: reveal.id, index: 1, fragment: fromTree({ type: 'html:p', props: { class: 'lead' }, children: [{ type: 'text', props: { value: 'New' } }] }) });
	apply({ op: 'move', id: card.id, parent: reveal.id, index: 0 });
	out = exportVue(file);
	assert.doesNotMatch(out, /<img/);
	assert.match(out, /\n\t\t\t<MyCard [^\n]*\/>\n\t\t\t<h1 id="title"/);
	assert.match(out, /<\/h1>\n\t\t\t<p class="lead">New<\/p>\n\t\t<\/Reveal>/);
	assert.ok(out.endsWith(source.slice(source.indexOf('\n\t\t<p class="mt-2"') + 1).replace('<p class="mt-2">', '<p class="mt-2" title="Note">')));
	for (const operation of undo) applyOperation(file.doc, operation);
	assert.equal(exportVue(file), source);
	// Typed code becomes the new source; unchanged formatting survives a later visual edit.
	const typed = source.replace('class="p-4"', 'class="p-6"').replace('\t\t<p class="mt-2">', '\t\t<p   class="mt-2" >');
	const result = applySource(file, typed);
	const edited = { ...file, doc: result.doc, source: result.source };
	assert.equal(exportVue(edited), typed);
	applyOperation(edited.doc, { op: 'setProp', id: heading.id, key: 'class', value: 'text-6xl' });
	assert.equal(exportVue(edited), typed.replace('class="text-5xl"', 'class="text-6xl"'));
});

test('text run offsets map between a run and its source, through entities and folded whitespace', async () => {
	const { runOffset, sourceOffset } = await import('../src/pages/designer/core/inlineText.js');
	const file = importVue('<template>\n\t<p>\n\t\tTom &amp; Jerry   run</p>\n</template>\n');
	const runId = Object.values(file.doc.nodes).find((node) => node.type === 'text').id;
	const { source, offsets } = exportMappedVue({ doc: file.doc, script: '', style: '', source: file.sourceMap });
	const value = file.doc.nodes[runId].props.value;
	const shown = value.trim();
	const at = (offset) => sourceOffset(source, offsets[runId], value, value.indexOf(shown) + offset);
	assert.equal(source.slice(at(0), at(3)), 'Tom');
	assert.equal(source.slice(at(4), at(5)), '&amp;');
	assert.equal(source.slice(at(6), at(shown.length)), 'Jerry   run');
	for (let offset = 0; offset <= value.length; offset += 1) assert.equal(runOffset(source, offsets[runId], value, sourceOffset(source, offsets[runId], value, offset)), offset);
});

test('rich text: marks and edits on the flat model', async () => {
	const { flatten, marksAt, replaceRange, toggleMark } = await import('../src/pages/designer/core/richText.js');
	const { doc } = importVue('<template><p>Some text <strong>bold one</strong> more text <strong>bold two</strong> final.</p></template>');
	const host = Object.values(doc.nodes).find((node) => node.type === 'html:p').id;
	const pieces = flatten(doc, host);
	const text = pieces.map((piece) => piece.text).join('');
	const show = (list) => list.map((piece) => `${piece.stack.map((entry) => `${entry.tag}>`).join('')}${piece.text}`).join('|');
	const two = text.indexOf('bold two');
	assert.equal(marksAt(pieces, two, two + 8).bold, true);
	// Taking bold off one bold run leaves the other alone.
	assert.equal(show(toggleMark(pieces, two, two + 8, 'bold')), 'Some text |strong>bold one| more text |bold two| final.');
	// Taking it off the middle of a run splits the run's element around it.
	const middle = text.indexOf('ld t');
	assert.equal(show(toggleMark(pieces, middle, middle + 4, 'bold')), 'Some text |strong>bold one| more text |strong>bo|ld t|strong>wo| final.');
	// Bold across plain and bold text adds bold only where it is missing.
	const across = text.indexOf('text bold');
	assert.equal(show(toggleMark(pieces, across, across + 9, 'bold')), 'Some |strong>text |strong>bold|strong> one| more text |strong>bold two| final.');
	// Italic inside bold nests inside it.
	assert.equal(show(toggleMark(pieces, two + 5, two + 8, 'italic')), 'Some text |strong>bold one| more text |strong>bold |strong>em>two| final.');
	// Typing over a selection across elements takes the marks of the text before it; a line break is a piece of its own.
	const replaced = replaceRange(pieces, text.indexOf('one'), two + 4, 'X\nY');
	assert.equal(show(replaced.pieces), 'Some text |strong>bold |strong>X|strong>\n|strong>Y|strong> two| final.');
	assert.equal(replaced.caret, text.indexOf('one') + 3);
	// Marks toggled at a caret apply to the text typed there.
	assert.equal(show(replaceRange(pieces, 4, 4, 'Z', { bold: true }).pieces), 'Some|strong>Z| text |strong>bold one| more text |strong>bold two| final.');
});
