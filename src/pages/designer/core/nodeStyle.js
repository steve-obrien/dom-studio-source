import { computed, ref, watch } from 'vue';
import { backgroundFromCss, backgroundToCssProperties } from '../background-editor/backgroundModel.js';
import { backdropFromCss, backdropToCss } from '../backdrop-editor/backdropModel.js';
import { borderFromCss, borderToCss } from '../border-editor/borderModel.js';
import { shadowListToCss, shadowsFromCss } from '../shadow-editor/shadowModel.js';
import { typographyFromCss, typographyToCssProperties } from '../typography-editor/typographyModel.js';

/**
 * The material editors over a node's inline style.
 *
 * Each editor edits a record (fills, a border, shadow layers, a backdrop, a
 * text style) while the document stores plain CSS in `node.style`, which is
 * what the code view and export show. Records are read from the CSS and
 * written back as CSS. A record is kept while its CSS is unchanged, so layer
 * ids, and open popovers, survive edits; CSS changed elsewhere (undo, the
 * code view) is read again. CSS an editor cannot represent, such as an
 * image background, is reported as `custom` and left alone.
 */

const materials = {
	fill: {
		properties: ['background', 'background-color', 'background-image'],
		read(style) {
			const shorthand = style.background || '';
			const gradient = /gradient\(/i.test(shorthand);
			return { color: style['background-color'] || (gradient ? '' : shorthand), image: style['background-image'] || (gradient ? shorthand : '') };
		},
		parse: backgroundFromCss,
		write: (record) => ({ background: '', ...backgroundToCssProperties(record) }),
	},
	stroke: {
		properties: ['border'],
		read: (style) => style.border || '',
		parse: borderFromCss,
		write: (record) => ({ border: record.enabled && record.style !== 'none' ? borderToCss(record) : '' }),
	},
	shadow: {
		properties: ['box-shadow'],
		read: (style) => style['box-shadow'] || '',
		parse: shadowsFromCss,
		write: (record) => ({ 'box-shadow': record.length ? shadowListToCss(record).replace(/^none$/, '') : '' }),
	},
	blur: {
		properties: ['backdrop-filter'],
		read: (style) => style['backdrop-filter'] || '',
		parse: backdropFromCss,
		write: (record) => ({ 'backdrop-filter': backdropToCss(record).replace(/^none$/, '') }),
	},
	text: {
		properties: ['font-family', 'font-weight', 'font-size', 'line-height', 'letter-spacing', 'color', 'text-align', 'font-style', 'text-decoration', 'text-decoration-line', 'text-transform'],
		read: (style) => typographyFromCss(style),
		parse: (record) => record,
		write: (record) => ({ 'text-decoration': '', ...typographyToCssProperties(record) }),
	},
};

/** Whether a value is valid for a property and safe to write inline. */
function safe(property, value) {
	if (/url\s*\(|expression|[;{}<>]/i.test(value)) return false;
	return typeof CSS === 'undefined' || !CSS.supports || CSS.supports(property, value);
}

/**
 * Editor records for the selected node's inline style.
 *
 * @param {import('vue').Ref<object|null>} node The selected node.
 * @param {(style: object, merge: string) => void} writeStyle Replaces the node's style as one undoable edit.
 * @returns {object} A computed record per kind, `custom` raw CSS, `set(kind, record)` and `setRaw(kind, css)`.
 */
export function useNodeStyle(node, writeStyle) {
	const records = ref({});
	const custom = ref({});

	for (const [kind, material] of Object.entries(materials)) {
		watch(() => [node.value?.id, material.read(node.value?.style || {})], ([id, css]) => {
			const current = records.value[kind];
			const record = id ? material.parse(css) : null;
			if (record && current?.id === id && JSON.stringify(material.write(current.record)) === JSON.stringify(material.write(record))) return;
			records.value = { ...records.value, [kind]: record === null ? null : { id, record } };
			custom.value = { ...custom.value, [kind]: id && record === null ? (typeof css === 'string' ? css : `${css.image || ''} ${css.color || ''}`.trim()) : '' };
		}, { immediate: true, deep: true });
	}

	/** Writes CSS properties, removing empty ones; values that are not valid CSS are skipped. */
	function writeProperties(kind, properties) {
		if (!node.value) return;
		const style = { ...(node.value.style || {}) };
		for (const [property, value] of Object.entries(properties)) {
			if (value === '' || value === null || value === undefined) delete style[property];
			else if (safe(property, String(value))) style[property] = String(value);
		}
		writeStyle(style, `style:${node.value.id}:${kind}`);
	}

	/** Applies an edited record. */
	function set(kind, record) {
		records.value = { ...records.value, [kind]: { id: node.value?.id, record } };
		writeProperties(kind, materials[kind].write(record));
	}

	/** Replaces CSS the editors cannot represent, or clears it with ''. */
	function setRaw(kind, css) {
		const [property] = kind === 'fill' ? ['background'] : materials[kind].properties;
		const cleared = Object.fromEntries(materials[kind].properties.map((name) => [name, '']));
		writeProperties(kind, { ...cleared, [property]: String(css).trim() });
	}

	const record = (kind) => computed(() => records.value[kind]?.record ?? null);
	return { fill: record('fill'), stroke: record('stroke'), shadow: record('shadow'), blur: record('blur'), text: record('text'), custom, set, setRaw };
}
