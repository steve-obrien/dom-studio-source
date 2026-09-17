import { cssColorWithAlpha } from '../../lib/css/color.js';

export const shadowKindOptions = [
	{ label: 'Drop shadow', value: 'drop' },
	{ label: 'Inner shadow', value: 'inset' },
	{ label: 'Ring', value: 'ring' },
];

/** Creates a fresh editable shadow layer. Supply deterministic IDs after construction during SSR. */
export function createShadow(overrides = {}) {
	return {
		enabled: true,
		open: true,
		kind: 'drop',
		color: '#000000',
		alpha: 20,
		x: 0,
		y: 8,
		blur: 18,
		spread: -6,
		...overrides,
		id: createId(),
	};
}

/** Returns enabled layers in CSS stacking order. */
export function enabledShadows(shadowList) {
	return shadowList.filter((shadow) => shadow.enabled);
}

/** Serializes a drop shadow, inner shadow or ring to CSS. */
export function shadowToCss(shadow) {
	const color = cssColorWithAlpha(shadow.color, shadow.alpha);
	if (shadow.kind === 'ring') return `0 0 0 ${shadow.spread}px ${color}`;
	return `${shadow.kind === 'inset' ? 'inset ' : ''}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${color}`;
}

/** Serializes visible layers as a CSS box-shadow value. */
export function shadowListToCss(shadowList) {
	const visibleShadows = enabledShadows(shadowList);
	if (!visibleShadows.length) return 'none';
	return visibleShadows.map((shadow) => shadowToCss(shadow)).join(', ');
}

/** Appends a new shadow and closes existing layer disclosures. */
export function addShadowLayer(shadowList) {
	shadowList.forEach((shadow) => {
		shadow.open = false;
	});
	shadowList.push(createShadow());
}

/** Inserts an independent duplicate with a fresh identity. */
export function duplicateShadowLayer(shadowList, index) {
	shadowList.splice(index + 1, 0, createShadow({ ...shadowList[index], open: true }));
}

/** Removes a layer at the specified index. */
export function removeShadowLayer(shadowList, index) {
	shadowList.splice(index, 1);
}

/** Returns the human-readable shadow kind. */
export function shadowTitle(shadow) {
	if (shadow.kind === 'ring') return 'Ring';
	if (shadow.kind === 'inset') return 'Inner shadow';
	return 'Drop shadow';
}

/** Creates an opaque identity for a newly inserted editor layer. */
function createId() {
	return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}
