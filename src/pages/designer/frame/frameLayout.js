export const frameModes = ['flow', 'flex', 'grid', 'absolute'];

/** Creates independent layout settings; positioning in a parent is deliberately separate. */
export function createFrameLayout(value = {}) {
	return {
		mode: frameModes.includes(value.mode) ? value.mode : 'flow',
		direction: ['row', 'column', 'row-reverse', 'column-reverse'].includes(value.direction) ? value.direction : 'row',
		wrap: value.wrap === 'wrap' ? 'wrap' : 'nowrap',
		gap: Number.isFinite(Number(value.gap)) ? Math.max(0, Number(value.gap)) : 0,
		padding: Number.isFinite(Number(value.padding)) ? Math.max(0, Number(value.padding)) : 0,
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
		padding: `${layout.padding}px`,
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
		gap: parseFloat(css.gap), padding: parseFloat(css.paddingTop),
		justify: css.justifyContent.replace('flex-', ''), align: css.alignItems.replace('flex-', ''),
		justifyItems: css.justifyItems, autoFlow: css.gridAutoFlow,
		columns: css.gridTemplateColumns === 'none' ? undefined : css.gridTemplateColumns,
		rows: css.gridTemplateRows === 'none' ? undefined : css.gridTemplateRows,
	});
}

/** Measures a child in its containing frame's CSS pixels, accounting for borders and scrolling. */
export function measureFrameChild(element, frame) {
	const rect = element.getBoundingClientRect();
	const parent = frame.getBoundingClientRect();
	const scale = parent.width / frame.offsetWidth || 1;
	return {
		left: (rect.left - parent.left) / scale - frame.clientLeft + frame.scrollLeft,
		top: (rect.top - parent.top) / scale - frame.clientTop + frame.scrollTop,
		width: rect.width / scale,
		height: rect.height / scale,
	};
}

/** Aligns a child against its frame's padded inner bounds. */
export function alignFrameChild(rect, bounds, alignment, padding = 0) {
	const next = { ...rect };
	if (alignment === 'left') next.left = padding;
	if (alignment === 'center') next.left = (bounds.width - rect.width) / 2;
	if (alignment === 'right') next.left = bounds.width - padding - rect.width;
	if (alignment === 'top') next.top = padding;
	if (alignment === 'middle') next.top = (bounds.height - rect.height) / 2;
	if (alignment === 'bottom') next.top = bounds.height - padding - rect.height;
	return next;
}

/** Places children in their existing visual order with an explicit horizontal or vertical gap. */
export function spaceFrameChildren(rects, axis, gap) {
	const key = axis === 'x' ? 'left' : 'top';
	const size = axis === 'x' ? 'width' : 'height';
	const ordered = rects.map((rect, index) => ({ ...rect, index })).sort((a, b) => a[key] - b[key]);
	let cursor = ordered[0]?.[key] || 0;
	const result = rects.map((rect) => ({ ...rect }));
	for (const rect of ordered) {
		result[rect.index][key] = cursor;
		cursor += rect[size] + Math.max(0, Number(gap) || 0);
	}
	return result;
}
