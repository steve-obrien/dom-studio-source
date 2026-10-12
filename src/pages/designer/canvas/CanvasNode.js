import { Fragment, defineComponent, h, onErrorCaptured, ref } from 'vue';
import DomDesignerFrame from '../frame/DomDesignerFrame.vue';
import { frameNodeStyle, isFrameNode } from '../frames/frameDocument.js';
import { literalBindingValue } from './canvasDocument.js';

/**
 * Contains render errors from a single component. Generated code often passes
 * props the preview cannot evaluate; one failing component must not take the
 * whole canvas down. The parent keys this boundary on the node's props, so an
 * edit retries the render.
 */
const ComponentBoundary = defineComponent({
	name: 'CanvasComponentBoundary',
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

/**
 * Renders a canvas node tree as real DOM, including live DOM Studio components.
 *
 * The preview is inert by design: event listeners and non-literal bindings are
 * never attached, `v-if` branches all render, and a `v-for` renders its item
 * once. Those directives are kept in the document and returned on export.
 */
export const CanvasNode = defineComponent({
	name: 'CanvasNode',
	props: {
		node: { type: Object, required: true },
		parent: { type: Object, default: null },
		detected: { type: Object, default: () => ({}) },
		resolveComponent: { type: Function, required: true },
	},
	setup(props) {
		/** Builds a vnode for one node; recursion keeps slots and fragments intact. */
		function render(node, parent) {
			if (node.tag === '#text') {
				if (!node.expression) return node.text;
				return h('span', { class: 'rounded-sm bg-primary/10 px-0.5 font-mono text-[0.9em] text-primary', title: 'Template binding' }, `{{ ${node.expression} }}`);
			}
			const designer = { 'data-designer-id': node.id };
			const bound = Object.fromEntries(Object.entries(node.bindings || {}).map(([key, expression]) => [key, literalBindingValue(expression)]).filter(([, result]) => result.matched).map(([key, result]) => [key, result.value]));
			const slotTemplate = (child) => child.tag === 'template' && child.directives.some((source) => /^(v-slot|#)/.test(source));
			if (bound.class !== undefined && node.attrs.class) bound.class = [node.attrs.class, bound.class];
			const children = () => node.children.filter((child) => !slotTemplate(child)).map((child) => render(child, node));

			if (node.tag === 'template') return h(Fragment, null, children());

			if (node.component) {
				const component = props.resolveComponent(node.tag);
				const style = frameNodeStyle(node, parent);
				if (!component) {
					return h('div', { ...designer, style, class: 'rounded-lg border border-dashed border-border p-3 text-xs text-muted-fg' }, [
						h('p', { class: 'mb-2 font-mono' }, `<${node.tag}>`),
						...children(),
					]);
				}
				const slots = {};
				if (node.children.some((child) => !slotTemplate(child))) slots.default = children;
				for (const child of node.children.filter(slotTemplate)) {
					const source = child.directives.find((item) => /^(v-slot|#)/.test(item));
					const name = /^(?:v-slot:|#)([\w-]+)/.exec(source)?.[1] || 'default';
					slots[name] = () => child.children.map((item) => render(item, child));
				}
				const retryKey = `${node.id}:${JSON.stringify(node.attrs)}:${JSON.stringify(node.bindings)}`;
				return h(ComponentBoundary, { key: retryKey, tag: node.tag, designerId: node.id }, () => h(component, { ...node.attrs, ...bound, ...designer, style }, slots));
			}

			const style = frameNodeStyle(node, parent);
			const frameMode = isFrameNode(node) ? (node.layout?.mode || props.detected[node.id]?.mode || 'flow') : undefined;
			const attributes = { ...node.attrs, ...bound, ...designer, style, 'data-designer-frame': frameMode };
			if (node.layout) return h(DomDesignerFrame, { ...attributes, as: node.tag, layout: node.layout }, { default: children });
			return h(node.tag, attributes, children());
		}
		return () => render(props.node, props.parent);
	},
});
