import { Fragment, defineComponent, h, onErrorCaptured, ref } from 'vue';
import DomDesignerFrame from '../frame/DomDesignerFrame.vue';
import { frameNodeStyle, isFrameNode } from '../frames/frameDocument.js';
import { isExpr } from './editorDocument.js';
import { UNKNOWN, createScope, evaluate, parseFor } from './expression.js';
import { parseDirective } from './previewData.js';

/**
 * Renders an editor document as real DOM, including live DOM Studio
 * components, for the canvas and any other workspace preset.
 *
 * Two views of bindings:
 *
 * - `data` evaluates bindings against preview data: `{{ project.name }}`
 *   shows a name, `v-for` repeats, and `v-if` picks a branch.
 * - `variables` shows each interpolation as a token and renders every
 *   `v-if` branch and one item of each list, so the template's logic is visible.
 *
 * The preview is inert in both: event handlers are never attached and no
 * template code runs (see `expression.js`).
 */

const maxRepeat = 24;

/** Contains render errors from one component so one bad prop never blanks the canvas. */
const ComponentBoundary = defineComponent({
	name: 'EditorComponentBoundary',
	props: { tag: { type: String, required: true }, designerId: { type: String, required: true } },
	setup(props, { slots }) {
		const failure = ref('');
		onErrorCaptured((error) => {
			failure.value = error?.message || 'Render failed';
			return false;
		});
		return () => (failure.value
			? h('div', { 'data-designer-id': props.designerId, class: 'rounded-lg border border-dashed border-destructive/60 p-3 text-xs text-destructive' }, [
				h('p', { class: 'font-mono' }, `<${props.tag}>`),
				h('p', { class: 'mt-1' }, `Preview unavailable: ${failure.value}. Check its props; the source is kept as written.`),
			])
			: slots.default?.());
	},
});

function directiveOf(node, names) {
	for (const source of node.directives || []) {
		const directive = parseDirective(source);
		if (directive && names.includes(directive.name)) return directive;
	}
	return null;
}

function slotDirective(node) {
	return node.type === 'html:template' ? directiveOf(node, ['slot']) : null;
}

/** Binds slot props (`#row="{ row }"` or `v-slot="props"`) into a child scope. */
function slotScope(directive, slotProps, scope) {
	const value = directive.value.trim();
	if (!value || !slotProps || typeof slotProps !== 'object') return scope;
	if (/^[A-Za-z_$][\w$]*$/.test(value)) return createScope({ [value]: slotProps }, scope);
	const names = value.replace(/^\{|\}$/g, '').split(',').map((item) => item.trim()).filter(Boolean);
	return createScope(Object.fromEntries(names.map((item) => {
		const [key, alias = key] = item.split('=')[0].split(':').map((part) => part.trim());
		return [alias, slotProps[key]];
	})), scope);
}

export const EditorRender = defineComponent({
	name: 'EditorRender',
	props: {
		doc: { type: Object, required: true },
		types: { type: Object, required: true },
		data: { type: Object, default: () => ({}) },
		mode: { type: String, default: 'data' },
		detected: { type: Object, default: () => ({}) },
	},
	setup(props) {
		const showData = () => props.mode === 'data';

		/** Evaluates a prop value; literals pass through, bindings use the scope. */
		function valueOf(value, scope) {
			if (!isExpr(value)) return value;
			return evaluate(value.expr, scope);
		}

		function textVNode(node, scope) {
			const value = node.props.value;
			if (!isExpr(value)) return String(value ?? '');
			if (!showData()) return h('span', { class: 'rounded-sm bg-primary/10 px-1 font-mono text-[0.85em] text-primary', title: 'Bound to data' }, value.expr);
			const result = evaluate(value.expr, scope);
			if (result === UNKNOWN) return h('span', { class: 'rounded-sm border border-dashed border-primary/50 px-1 font-mono text-[0.85em] text-primary', title: 'No preview value. Add one in the Data panel.' }, value.expr);
			if (result === null || result === undefined) return '';
			return typeof result === 'object' ? JSON.stringify(result) : String(result);
		}

		/** Builds attributes and props for an element or component. */
		function attributesOf(node, scope) {
			const out = {};
			let boundClass;
			for (const [key, raw] of Object.entries(node.props || {})) {
				const value = valueOf(raw, scope);
				if (value === UNKNOWN || value === undefined) continue;
				if (key === ':class') { boundClass = value; continue; }
				if (/^on[A-Z]/.test(key)) continue;
				if (value === true && !node.type.startsWith('vue:')) out[key] = '';
				else if (value === false || value === null) continue;
				else out[key] = value;
			}
			if (boundClass !== undefined) out.class = [out.class, boundClass];
			return out;
		}

		/** Renders a list of sibling ids, resolving `v-if` chains in data view. */
		function renderChildren(ids, scope, parent) {
			const out = [];
			let chainOpen = false;
			let chainMatched = false;
			for (const id of ids) {
				const node = props.doc.nodes[id];
				if (!node || slotDirective(node)) continue;
				const condition = directiveOf(node, ['if', 'else-if', 'else']);
				if (showData() && condition) {
					if (condition.name === 'if') { chainOpen = true; chainMatched = false; }
					if (!chainOpen) { out.push(...renderNode(id, scope, parent)); continue; }
					if (chainMatched) continue;
					const result = condition.name === 'else' ? true : evaluate(condition.value, scope);
					// A condition that cannot be previewed shows its branch, so nothing silently disappears.
					if (result === UNKNOWN || result) { chainMatched = true; out.push(...renderNode(id, scope, parent)); }
					if (condition.name === 'else') chainOpen = false;
					continue;
				}
				chainOpen = false;
				out.push(...renderNode(id, scope, parent));
			}
			return out;
		}

		/** Renders one node, repeating it for `v-for`. Returns a list of vnodes. */
		function renderNode(id, scope, parent) {
			const node = props.doc.nodes[id];
			if (!node) return [];
			const loop = directiveOf(node, ['for']);
			if (!loop) return [renderSingle(node, scope, parent, 0)];
			const parsed = parseFor(loop.value);
			if (!parsed) return [renderSingle(node, scope, parent, 0)];
			let source = evaluate(parsed.source, scope);
			let entries;
			if (Array.isArray(source)) entries = source.map((item, index) => [item, index, index]);
			else if (typeof source === 'number' && source >= 0) entries = Array.from({ length: Math.floor(source) }, (_, index) => [index + 1, index, index]);
			else if (source && typeof source === 'object') entries = Object.entries(source).map(([key, item], index) => [item, key, index]);
			else entries = [[UNKNOWN, 0, 0]];
			if (!showData()) entries = entries.slice(0, 1);
			if (!entries.length) return [];
			return entries.slice(0, maxRepeat).map(([item, key, index]) => {
				const values = {};
				// An unknown list item stays UNKNOWN, so its bindings show as variables instead of blanks.
				if (parsed.value) values[parsed.value] = item;
				parsed.names.forEach((name, position) => { values[name] = item && typeof item === 'object' ? item[parsed.keys[position] || name] : UNKNOWN; });
				if (parsed.key) values[parsed.key] = Array.isArray(source) ? index : key;
				if (parsed.index) values[parsed.index] = index;
				return renderSingle(node, createScope(values, scope), parent, index);
			});
		}

		function renderSingle(node, scope, parent, repeat) {
			if (node.type === 'text') return textVNode(node, scope);
			const type = props.types.get(node.type) || { tag: node.type.split(':').pop(), adapter: 'html' };
			const tag = type.tag;
			const marker = { 'data-designer-id': node.id, ...(repeat ? { 'data-designer-repeat': String(repeat) } : {}) };
			const children = () => renderChildren(node.children, scope, node);

			if (node.type === 'html:template') return h(Fragment, null, children());

			const attributes = attributesOf(node, scope);
			const boundStyle = attributes.style;
			delete attributes.style;
			const frameStyle = frameNodeStyle(node, parent);
			const style = boundStyle && typeof boundStyle === 'object' ? [boundStyle, frameStyle] : frameStyle;

			if (type.adapter === 'vue') {
				if (!type.component) {
					return h('div', { ...marker, style, class: 'rounded-lg border border-dashed border-border p-3 text-xs text-muted-fg' }, [
						h('p', { class: 'mb-2 font-mono' }, `<${tag}>`),
						...children(),
					]);
				}
				const slots = {};
				const plain = node.children.filter((child) => !slotDirective(props.doc.nodes[child] || {}));
				if (plain.length) slots.default = () => renderChildren(plain, scope, node);
				for (const childId of node.children) {
					const child = props.doc.nodes[childId];
					const directive = child && slotDirective(child);
					if (!directive) continue;
					slots[directive.arg || 'default'] = (slotProps) => renderChildren(child.children, slotScope(directive, slotProps, scope), child);
				}
				const retryKey = `${node.id}:${repeat}:${JSON.stringify(node.props)}`;
				return h(ComponentBoundary, { key: retryKey, tag, designerId: node.id }, () => h(type.component, { ...attributes, ...marker, style }, slots));
			}

			const frameMode = isFrameNode({ tag }) ? (node.layout?.mode || props.detected[node.id]?.mode || 'flow') : undefined;
			const element = { ...attributes, ...marker, style, 'data-designer-frame': frameMode };
			if (node.layout) return h(DomDesignerFrame, { ...element, as: tag, layout: node.layout }, { default: children });
			return h(tag, element, type.container === false ? undefined : children());
		}

		return () => {
			const scope = createScope(props.data || {});
			return renderNode(props.doc.rootId, scope, null)[0] ?? null;
		};
	},
});
