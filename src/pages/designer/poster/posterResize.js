/**
 * Resizing a design to another format, Canva "Magic Resize" style.
 *
 * Scaling every layer by the frame's width and height ratios squashes a story
 * into a link card. Instead each layer keeps its relationship to the frame:
 * pinned to an edge, centred, stretched between both edges, or scaled with
 * the frame (the old behaviour). Content such as type size and corner radius
 * scales by one uniform factor, the smaller of the two frame ratios, so text
 * keeps its proportions and still fits.
 *
 * A layer's `pinX` and `pinY` choose the rule. `auto`, the default, reads it
 * from where the layer sits: across the whole frame is stretch, near the
 * middle is centre, otherwise the nearer edge.
 */

export const pinXOptions = [
	{ label: 'Auto', value: 'auto' },
	{ label: 'Left', value: 'start' },
	{ label: 'Centre', value: 'center' },
	{ label: 'Right', value: 'end' },
	{ label: 'Stretch', value: 'stretch' },
	{ label: 'Scale', value: 'scale' },
];
export const pinYOptions = [
	{ label: 'Auto', value: 'auto' },
	{ label: 'Top', value: 'start' },
	{ label: 'Centre', value: 'center' },
	{ label: 'Bottom', value: 'end' },
	{ label: 'Stretch', value: 'stretch' },
	{ label: 'Scale', value: 'scale' },
];

/** Social formats a design can be resized to, by platform. */
export const socialFormats = [
	{ id: 'instagram-post', label: 'Instagram post', width: 1080, height: 1350 },
	{ id: 'instagram-story', label: 'Instagram story', width: 1080, height: 1920 },
	{ id: 'square', label: 'Square post', width: 1080, height: 1080 },
	{ id: 'linkedin', label: 'LinkedIn post', width: 1200, height: 627 },
	{ id: 'x-post', label: 'X post', width: 1600, height: 900 },
	{ id: 'youtube', label: 'YouTube thumbnail', width: 1280, height: 720 },
	{ id: 'open-graph', label: 'Link preview', width: 1200, height: 630 },
];

const minSize = 16;

/**
 * Picks a pin for one axis from where the layer sits in the frame.
 *
 * @param {number} start Layer offset (x or y).
 * @param {number} size Layer size on that axis.
 * @param {number} frame Frame size on that axis.
 * @returns {'start'|'center'|'end'|'stretch'} Pin.
 */
export function guessPin(start, size, frame) {
	const end = frame - start - size;
	if (start <= frame * 0.05 && end <= frame * 0.05) return 'stretch';
	const offset = start + size / 2 - frame / 2;
	if (Math.abs(offset) <= frame * 0.05) return 'center';
	return start <= end ? 'start' : 'end';
}

/**
 * Resizes one axis of a layer.
 *
 * @param {string} pin Pin rule.
 * @param {number} start Layer offset.
 * @param {number} size Layer size.
 * @param {number} from Old frame size.
 * @param {number} to New frame size.
 * @param {number} k Uniform content scale.
 * @returns {[number, number]} New offset and size.
 */
export function resizeAxis(pin, start, size, from, to, k) {
	const rule = pin === 'auto' || !pin ? guessPin(start, size, from) : pin;
	if (rule === 'scale') return [start * (to / from), Math.max(minSize, size * (to / from))];
	if (rule === 'stretch') {
		const before = start * k;
		const after = (from - start - size) * k;
		return [before, Math.max(minSize, to - before - after)];
	}
	const next = Math.max(minSize, size * k);
	if (rule === 'end') return [to - (from - start - size) * k - next, next];
	if (rule === 'center') return [to / 2 + (start + size / 2 - from / 2) * k - next / 2, next];
	return [start * k, next];
}

/**
 * The prop changes that move one poster layer into a new frame size. Values
 * are rounded so the exported CSS stays readable.
 *
 * @param {object} layer Poster layer, or a node's props.
 * @param {{ width: number, height: number }} from Old frame size.
 * @param {{ width: number, height: number }} to New frame size.
 * @returns {object} Changed props.
 */
export function resizeLayer(layer, from, to) {
	const k = Math.min(to.width / from.width, to.height / from.height);
	const [x, width] = resizeAxis(layer.pinX, layer.x, layer.width, from.width, to.width, k);
	const [y, height] = resizeAxis(layer.pinY, layer.y, layer.height, from.height, to.height, k);
	const next = { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
	if (typeof layer.fontSize === 'number') next.fontSize = Math.max(8, Math.round(layer.fontSize * k));
	if (typeof layer.letterSpacing === 'number' && layer.letterSpacing) next.letterSpacing = Math.round(layer.letterSpacing * k * 10) / 10;
	if (layer.radius) next.radius = Math.round(layer.radius * k);
	return next;
}

/**
 * A copy of a poster at another size. Used for live previews of every format.
 *
 * @param {object} poster Poster model.
 * @param {{ width: number, height: number }} size New frame size.
 * @returns {object} Resized poster.
 */
export function resizePoster(poster, size) {
	const from = { width: poster.width, height: poster.height };
	if (from.width === size.width && from.height === size.height) return { ...poster, layers: poster.layers.map((layer) => ({ ...layer })) };
	return { ...poster, width: size.width, height: size.height, layers: poster.layers.map((layer) => ({ ...layer, ...resizeLayer(layer, from, size) })) };
}

/**
 * The design every format is derived from.
 *
 * Resizing loses detail (type shrinks by the smaller ratio, then grows by a
 * different one), so switching formats must never resize the last format.
 * The source is the design as it was last edited. While the current design
 * is still exactly the source resized to the current size, the source stays;
 * once anything was edited, the current design becomes the new source.
 *
 * @param {object|null} source Previous source poster, or null.
 * @param {object} current Current poster.
 * @returns {object} Source poster (a copy when it changes).
 */
export function formatSource(source, current) {
	const unchanged = source && JSON.stringify(resizePoster(source, { width: current.width, height: current.height })) === JSON.stringify(current);
	return unchanged ? source : JSON.parse(JSON.stringify(current));
}

const sizedKeys = ['x', 'y', 'width', 'height', 'fontSize', 'letterSpacing', 'radius'];

/**
 * Core operations that move a poster document onto a resized poster with the
 * same layers, as one undoable step.
 *
 * @param {object} doc Poster document (root is a `poster:frame`).
 * @param {object} target Poster from `resizePoster`, whose layer ids are node ids.
 * @returns {Array<object>} `setProp` operations.
 */
export function formatOperations(doc, target) {
	const root = doc.nodes[doc.rootId];
	const operations = target.layers.flatMap((layer) => {
		const node = doc.nodes[layer.id];
		if (!node) return [];
		return sizedKeys.filter((key) => layer[key] != null && node.props[key] !== layer[key]).map((key) => ({ op: 'setProp', id: layer.id, key, value: layer[key] }));
	});
	return [...operations, { op: 'setProp', id: root.id, key: 'width', value: target.width }, { op: 'setProp', id: root.id, key: 'height', value: target.height }];
}
