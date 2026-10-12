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
	assert.equal(exportFile(restored.files[0]), exportFile({ ...createCanvasDemo().files[0] }));
	assert.equal(restoreWorkspace({ files: [], artboards: [] }), null);
	assert.equal(restoreWorkspace('nonsense'), null);
});
