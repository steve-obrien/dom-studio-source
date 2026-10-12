import { buildVueFile, canvasTailwindContent, createCanvasNode, createTextNode, isComponentTag, parseTemplate, splitVueSource, toTemplateLiteral } from '../canvas/canvasDocument.js';
import { createDocument, isExpr, nodeId, toTree } from './editorDocument.js';
import { scriptData } from './previewData.js';

/**
 * Vue adapter: Vue SFC and HTML in, editor documents out, and back.
 *
 * Parsing reuses the canvas's `@vue/compiler-dom` importer, so nothing in the
 * template executes. Each element becomes `html:<tag>` or `vue:<Component>`;
 * static attributes become literal props, `:prop` bindings become `{ expr }`
 * props, `{{ interpolations }}` become bound text nodes, and every other
 * directive is kept verbatim on the node so export returns it unchanged.
 *
 * A static `class` together with `:class` is the one case where both forms of
 * a prop coexist; the binding is kept under `:class`.
 */

/**
 * Converts a canvas node tree into an editor tree description.
 *
 * @param {object} canvasNode Node from `parseTemplate`.
 * @returns {object} Tree description for `createDocument`.
 */
export function fromCanvasNode(canvasNode) {
	if (canvasNode.tag === '#text') return { type: 'text', props: { value: canvasNode.expression ? { expr: canvasNode.expression } : canvasNode.text }, children: [] };
	const props = { ...canvasNode.attrs };
	for (const [key, value] of Object.entries(canvasNode.bindings || {})) props[key in props ? `:${key}` : key] = { expr: value };
	const tree = {
		type: `${canvasNode.component ? 'vue' : 'html'}:${canvasNode.tag}`,
		props,
		children: (canvasNode.children || []).map(fromCanvasNode),
	};
	if (canvasNode.label) tree.label = canvasNode.label;
	if (canvasNode.directives?.length) tree.directives = [...canvasNode.directives];
	if (Object.keys(canvasNode.style || {}).length) tree.style = { ...canvasNode.style };
	if (canvasNode.layout) tree.layout = { ...canvasNode.layout };
	if (Object.keys(canvasNode.placements || {}).length) tree.placements = JSON.parse(JSON.stringify(canvasNode.placements));
	if (canvasNode.absoluteHeight) tree.absoluteHeight = canvasNode.absoluteHeight;
	return tree;
}

/**
 * Converts an editor subtree back into the canvas node shape that the
 * template serialiser understands.
 *
 * @param {object} doc Editor document.
 * @param {string} [id] Subtree root.
 * @returns {object} Canvas node tree.
 */
export function toCanvasNode(doc, id = doc.rootId) {
	return canvasNodeFromTree(toTree(doc, id));
}

function canvasNodeFromTree(tree) {
	if (tree.type === 'text') {
		const value = tree.props.value;
		return isExpr(value) ? { ...createTextNode(`{{ ${value.expr} }}`, value.expr), id: tree.id } : { ...createTextNode(String(value ?? '')), id: tree.id };
	}
	const [adapter, tag] = splitType(tree.type);
	const attrs = {};
	const bindings = {};
	for (const [key, value] of Object.entries(tree.props || {})) {
		if (isExpr(value)) bindings[key.replace(/^:/, '')] = value.expr;
		else if (value === true) attrs[key] = '';
		else if (value === false || value === null || value === undefined) continue;
		else if (typeof value === 'string') attrs[key] = value;
		else bindings[key] = toTemplateLiteral(value);
	}
	return createCanvasNode({
		id: tree.id,
		tag,
		component: adapter === 'vue' || isComponentTag(tag),
		label: tree.label,
		attrs,
		bindings,
		directives: tree.directives || [],
		style: tree.style || {},
		layout: tree.layout || null,
		placements: tree.placements || {},
		absoluteHeight: tree.absoluteHeight,
		children: tree.children.map(canvasNodeFromTree),
	});
}

/**
 * Splits a node type into adapter and tag.
 *
 * @param {string} type Such as `vue:DomButton`.
 * @returns {[string, string]} Adapter and tag.
 */
export function splitType(type) {
	const index = type.indexOf(':');
	return index < 0 ? ['html', type] : [type.slice(0, index), type.slice(index + 1)];
}

/**
 * Imports a Vue SFC or HTML fragment.
 *
 * @param {string} source File source.
 * @param {{ makeId?: () => string }} [options] Id factory.
 * @returns {{ doc: object, script: string, style: string, unsupported: number, seeded: Array<string> }} Document, kept blocks, dropped node count and data keys read from the script.
 */
export function importVue(source, { makeId = nodeId } = {}) {
	const parts = splitVueSource(source);
	const { root, unsupported } = parseTemplate(parts.template);
	const doc = createDocument(fromCanvasNode(root), { makeId });
	const seeded = Object.keys(scriptData(parts.script));
	return { doc, script: parts.script, style: parts.style, unsupported, seeded };
}

/**
 * Exports a file as a Vue SFC: the template is rebuilt from the document and
 * the original script and style blocks are returned as they were.
 *
 * @param {{ doc: object, script?: string, style?: string }} file Editor file.
 * @param {(tag: string) => boolean} [isStudioComponent] Whether a tag comes from `@getdom/studio/vue`.
 * @returns {string} Vue SFC source.
 */
export function exportVue(file, isStudioComponent) {
	return buildVueFile({ root: toCanvasNode(file.doc), script: file.script || '', style: file.style || '' }, isStudioComponent);
}

/**
 * Collects literal class tokens for the on-demand Tailwind compiler.
 *
 * @param {Array<{ doc: object }>} files Editor files.
 * @returns {string} Compiler content.
 */
export function tailwindContent(files) {
	return canvasTailwindContent(files.map((file) => ({ root: toCanvasNode(file.doc) })));
}
