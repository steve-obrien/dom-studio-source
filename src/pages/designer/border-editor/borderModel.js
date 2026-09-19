export const borderStyleOptions = [
	{ label: 'Solid', value: 'solid' },
	{ label: 'Dashed', value: 'dashed' },
	{ label: 'Dotted', value: 'dotted' },
	{ label: 'Double', value: 'double' },
	{ label: 'None', value: 'none' },
];

/** Creates a caller-owned uniform border record with a finite, nonnegative pixel width. */
export function createDesignerBorder(overrides = {}) {
	const width = Number.parseFloat(overrides.width ?? 1);
	return { enabled: true, style: 'solid', color: '#171717', ...overrides, width: Number.isFinite(width) ? Math.max(0, width) : 1 };
}

/** Serializes a uniform border without discarding values when its visibility is disabled. */
export function borderToCss(border) {
	if (!border?.enabled || border.style === 'none') return 'none';
	const value = createDesignerBorder(border);
	const style = borderStyleOptions.some((option) => option.value === value.style) ? value.style : 'solid';
	return `${value.width}px ${style} ${value.color}`;
}
