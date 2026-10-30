export const frameModes = ['flow', 'flex', 'grid', 'absolute'];
export const paddingSides = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];

function length(value, fallback = 0) {
	return Number.isFinite(Number(value)) && value !== '' && value !== null ? Math.max(0, Number(value)) : fallback;
}

/**
 * Creates independent layout settings; positioning in a parent is deliberately separate.
 *
 * `padding` sets every side; `paddingTop`, `paddingRight`, `paddingBottom` and
 * `paddingLeft` override one side each. `padding` stays equal to the top side so
 * older readers keep a sensible single value.
 */
export function createFrameLayout(value = {}) {
	const padding = length(value.padding);
	const sides = Object.fromEntries(paddingSides.map((side) => [side, length(value[side], padding)]));
	return {
		mode: frameModes.includes(value.mode) ? value.mode : 'flow',
		direction: ['row', 'column', 'row-reverse', 'column-reverse'].includes(value.direction) ? value.direction : 'row',
		wrap: value.wrap === 'wrap' ? 'wrap' : 'nowrap',
		gap: Number.isFinite(Number(value.gap)) ? Math.max(0, Number(value.gap)) : 0,
		padding: sides.paddingTop,
		...sides,
		justify: ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'].includes(value.justify) ? value.justify : 'start',
		align: ['start', 'center', 'end', 'stretch', 'baseline'].includes(value.align) ? value.align : 'stretch',
		justifyItems: ['start', 'center', 'end', 'stretch'].includes(value.justifyItems) ? value.justifyItems : 'stretch',
		autoFlow: ['row', 'column', 'row dense', 'column dense'].includes(value.autoFlow) ? value.autoFlow : 'row',
		columns: String(value.columns || 'repeat(3, minmax(0, 1fr))'),
		rows: String(value.rows || 'auto'),
	};
}

/** Projects child layout into CSS without choosing the frame's placement in its parent. */
export function frameLayoutStyle(value = {}) {
	const layout = createFrameLayout(value);
	return {
		position: 'relative',
		boxSizing: 'border-box',
		display: layout.mode === 'flex' || layout.mode === 'grid' ? layout.mode : 'block',
		padding: paddingSides.map((side) => `${layout[side]}px`).join(' '),
		gap: `${layout.gap}px`,
		flexDirection: layout.direction,
		flexWrap: layout.wrap,
		justifyContent: layout.justify,
		alignItems: layout.align,
		justifyItems: layout.justifyItems,
		gridAutoFlow: layout.autoFlow,
		gridTemplateColumns: layout.mode === 'grid' ? layout.columns : 'none',
		gridTemplateRows: layout.mode === 'grid' ? layout.rows : 'none',
	};
}

/** Reads the browser's resolved layout, including responsive Tailwind and inline styles. */
export function readFrameLayout(element) {
	const css = element.ownerDocument.defaultView.getComputedStyle(element);
	const children = [...element.children].filter((child) => child.hasAttribute('data-designer-id'));
	const absolute = children.length && children.every((child) => element.ownerDocument.defaultView.getComputedStyle(child).position === 'absolute');
	return createFrameLayout({
		mode: css.display.includes('flex') ? 'flex' : css.display.includes('grid') ? 'grid' : absolute ? 'absolute' : 'flow',
		direction: css.flexDirection, wrap: css.flexWrap,
		gap: parseFloat(css.gap),
		paddingTop: parseFloat(css.paddingTop), paddingRight: parseFloat(css.paddingRight), paddingBottom: parseFloat(css.paddingBottom), paddingLeft: parseFloat(css.paddingLeft),
		justify: css.justifyContent.replace('flex-', ''), align: css.alignItems.replace('flex-', ''),
		justifyItems: css.justifyItems, autoFlow: css.gridAutoFlow,
		columns: css.gridTemplateColumns === 'none' ? undefined : css.gridTemplateColumns,
		rows: css.gridTemplateRows === 'none' ? undefined : css.gridTemplateRows,
	});
}
