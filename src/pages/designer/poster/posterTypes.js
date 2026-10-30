import { createDocument } from '../core/editorDocument.js';
import { createTypeRegistry } from '../core/typeRegistry.js';
import { createPosterLayer, fontOptions } from './posterModel.js';
import { fontFamilyOptions, typographyKeys } from '../typography-editor/typographyModel.js';
import { pinXOptions, pinYOptions } from './posterResize.js';

/**
 * The poster on the editor core.
 *
 * A poster is a document whose root is a `poster:frame` and whose children are
 * `poster:text`, `poster:image` and `poster:shape` layers, back to front. Layer
 * fields are props; the layer name is the node label; `locked` and `hidden`
 * are node fields. Every edit is a core operation, so the poster shares
 * history, ids and (later) collaboration with the canvas.
 *
 * The poster model in posterModel.js stays the render and export format:
 * `documentToPoster` projects the document onto it, so the CSS and HTML export
 * are unchanged.
 */

const scrub = (key, label, props, extra = {}) => ({ key, label, component: 'ScrubField', half: true, props, ...extra });
const select = (key, label, options, extra = {}) => ({ key, label, component: 'DomNativeSelect', props: { options }, ...extra });
const range = (key, label, max, suffix) => ({ key, label, component: 'DomRangeInput', group: 'Image', props: { min: 0, max, suffix } });

const positionFields = [
	scrub('x', 'X position', { prefix: 'X', min: -10000, max: 10000 }, { group: 'Position' }),
	scrub('y', 'Y position', { prefix: 'Y', min: -10000, max: 10000 }, { group: 'Position' }),
	scrub('width', 'Width', { prefix: 'W', min: 16, max: 20000 }, { group: 'Position' }),
	scrub('height', 'Height', { prefix: 'H', min: 16, max: 20000 }, { group: 'Position' }),
	{ key: 'pinX', label: 'Pin across: how the layer follows a format change', component: 'InspectorSelect', half: true, group: 'Position', props: { options: pinXOptions, icon: 'dir-row' } },
	{ key: 'pinY', label: 'Pin down: how the layer follows a format change', component: 'InspectorSelect', half: true, group: 'Position', props: { options: pinYOptions, icon: 'dir-column' } },
];
const posterFonts = [...fontOptions, ...fontFamilyOptions.filter((font) => !fontOptions.some((option) => option.value === font.value))];
const textFields = [
	{ key: 'value', label: 'Text', component: 'DomTextareaInput', group: 'Typography', props: { rows: 3 } },
	{ key: 'typography', keys: typographyKeys, label: 'Text style', component: 'DomTypographyEditor', group: 'Typography', props: { title: 'Text style', fonts: posterFonts } },
];
const imageFields = [
	select('objectFit', 'Image fit', ['cover', 'contain', 'fill'], { group: 'Image' }),
	range('objectY', 'Vertical crop', 100, '%'),
	range('brightness', 'Brightness', 200, '%'),
	range('saturation', 'Saturation', 200, '%'),
	range('blur', 'Blur', 40, 'px'),
	range('sepia', 'Sepia', 100, '%'),
];
const fill = { key: 'fill', label: 'Fill', component: 'DomColorSwatch', group: 'Appearance' };
const common = [
	scrub('opacity', 'Opacity', { icon: 'opacity', suffix: '%', min: 0, max: 100 }, { group: 'Appearance' }),
	scrub('radius', 'Corner radius', { icon: 'radius', min: 0, max: 1000 }, { group: 'Appearance' }),
];
const surface = [
	{ key: 'background', label: 'Background', component: 'DomBackgroundEditor', group: 'Appearance' },
	{ key: 'backdrop', label: 'Backdrop', component: 'DomBackdropEditor', group: 'Appearance' },
];
const outline = [
	{ key: 'border', label: 'Border', component: 'DomBorderEditor', group: 'Appearance' },
	{ key: 'shadows', label: 'Shadows', component: 'DomShadowEditor', group: 'Appearance' },
];
const layerGroups = ['Position', 'Typography', 'Image', 'Appearance'];

/** Layer props are every poster layer field except identity and editor state. */
function layerProps(type) {
	// eslint-disable-next-line no-unused-vars
	const { id, type: ignored, name, locked, hidden, ...props } = createPosterLayer(type, 'layer');
	return props;
}

/** The poster type entries: the frame and its three layer kinds. */
export function posterTypes() {
	return [
		{
			type: 'poster:frame', label: 'Poster', adapter: 'poster', tag: 'article', container: true, groups: ['Document'],
			schema: [
				{ key: 'title', label: 'Title', component: 'DomTextInput', group: 'Document' },
				{ key: 'background', label: 'Background colour', component: 'DomColorSwatch', group: 'Document' },
			],
		},
		{ type: 'poster:text', label: 'Text', adapter: 'poster', tag: 'p', groups: layerGroups, schema: [...positionFields, ...textFields, fill, ...common, ...surface, ...outline], defaults: { props: layerProps('text'), children: [] } },
		{ type: 'poster:image', label: 'Image', adapter: 'poster', tag: 'img', groups: layerGroups, schema: [...positionFields, ...imageFields, ...common, ...outline], defaults: { props: layerProps('image'), children: [] } },
		{ type: 'poster:shape', label: 'Shape', adapter: 'poster', tag: 'div', groups: layerGroups, schema: [...positionFields, fill, ...common, ...surface, ...outline], defaults: { props: layerProps('shape'), children: [] } },
	];
}

/** A registry holding the poster types. */
export function createPosterTypes() {
	const registry = createTypeRegistry({ fallback: () => null });
	posterTypes().forEach((entry) => registry.define(entry));
	return registry;
}

/** The layer kind (`text`, `image`, `shape`) of a poster node. */
export function layerKind(node) {
	return node.type.replace(/^poster:/, '');
}

/**
 * Converts one poster layer to a tree description.
 *
 * @param {object} layer Poster layer.
 * @returns {object} Tree description for `fromTree`.
 */
export function layerToTree(layer) {
	// eslint-disable-next-line no-unused-vars
	const { id, type, name, locked, hidden, ...props } = layer;
	return { id, type: `poster:${type}`, label: name, ...(locked ? { locked: true } : {}), ...(hidden ? { hidden: true } : {}), props, children: [] };
}

/**
 * Converts a poster to an editor document. Layer ids become node ids; the
 * frame's id is `frame`, which the HTML export also uses.
 *
 * @param {object} poster Poster from `createPoster` or a saved file.
 * @returns {object} Document.
 */
export function posterToDocument(poster) {
	const { title, width, height, background, layers = [] } = poster;
	return createDocument({ id: 'frame', type: 'poster:frame', props: { title, width, height, background }, children: layers.map(layerToTree) });
}

/**
 * Projects a document back onto the poster model used for rendering and
 * export. Missing props fall back to the layer defaults.
 *
 * @param {object} doc Poster document.
 * @returns {object} Poster.
 */
export function documentToPoster(doc) {
	const root = doc.nodes[doc.rootId];
	return {
		version: 1,
		title: root.props.title ?? '',
		width: root.props.width,
		height: root.props.height,
		background: root.props.background ?? '#ffffff',
		layers: root.children.map((id) => documentLayer(doc, id)),
	};
}

/**
 * One layer of the poster projection.
 *
 * @param {object} doc Poster document.
 * @param {string} id Layer node id.
 * @returns {object} Poster layer.
 */
export function documentLayer(doc, id) {
	const node = doc.nodes[id];
	const type = layerKind(node);
	const layer = createPosterLayer(type, id, node.props);
	return { ...layer, id, type, name: node.label || layer.name, locked: Boolean(node.locked), hidden: Boolean(node.hidden) };
}
