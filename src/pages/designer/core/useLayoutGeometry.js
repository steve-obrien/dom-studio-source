import { computed, nextTick, ref } from 'vue';
import { createFrameLayout, readFrameLayout } from '../frame/frameLayout.js';
import { isFrameNode } from '../frames/frameDocument.js';
import { alignFrameChild, alignRects, boundsOf, distributeRects, measureFrameChild } from '../stage/layoutGeometry.js';

/** An HTML container: a div, section, article and so on. */
function htmlFrame(node) {
	return Boolean(node?.type?.startsWith('html:') && isFrameNode({ tag: node.type.slice(5) }));
}

/**
 * Where layers sit and how they move: the layout each frame resolves to in the
 * browser, the selection's box in its frame, stage drags and resizes, numeric
 * X/Y/W/H edits, and align and distribute for one or several layers.
 *
 * Positions are written as `placements.absolute` on each node, through the
 * session, so they undo and reach the code like any other edit. A frame whose
 * absolute layout comes from its classes is adopted first: its children's
 * current boxes are recorded so nothing jumps when one of them moves.
 *
 * @param {object} options
 * @param {ReturnType<import('./useEditorSession.js').useEditorSession>} options.session The editor session.
 * @param {(id: string) => HTMLElement | null} options.element The rendered element for a node id in the active artboard.
 * @param {(node: object) => boolean} [options.isFrame] Whether a node lays out children. By default, HTML containers such as div and section.
 */
export function useLayoutGeometry({ session, element, isFrame = htmlFrame }) {
	const { doc, selected, selectedIds, active, parent, onFile, run } = session;
	/** Each frame's layout as the browser resolves it, by node id. */
	const detected = ref({});

	/** The layout a frame uses: the one set in the designer, or the one its classes give it. */
	function layoutOf(id) {
		return doc.value?.nodes[id]?.layout || detected.value[id] || null;
	}
	function modeOf(id) { return layoutOf(id)?.mode || 'flow'; }

	const parentMode = computed(() => (parent.value ? modeOf(parent.value.id) : 'flow'));
	const parentLayout = computed(() => (parent.value ? layoutOf(parent.value.id) || createFrameLayout() : null));

	/** The selected layers, primary last, without any that sit inside another selected layer. */
	const selectedNodes = computed(() => {
		const nodes = selectedIds.value.map((id) => doc.value?.nodes[id]).filter(Boolean);
		const inside = (node) => {
			for (let id = node.parent; id; id = doc.value.nodes[id]?.parent) if (selectedIds.value.includes(id)) return true;
			return false;
		};
		return nodes.filter((node) => !inside(node));
	});
	/** The frame every selected layer shares, when they share one. */
	const sharedParent = computed(() => {
		const parents = new Set(selectedNodes.value.map((node) => node.parent));
		return parents.size === 1 && !parents.has(null) && !parents.has(undefined) ? doc.value.nodes[[...parents][0]] : null;
	});
	/** Whether align and distribute can move the selection: elements that share an absolute frame. */
	const canArrange = computed(() => Boolean(sharedParent.value && modeOf(sharedParent.value.id) === 'absolute' && selectedNodes.value.every((node) => node.type !== 'text')));

	/** Reads each frame's resolved layout after the DOM settles. */
	async function refresh() {
		await nextTick();
		if (!doc.value) return;
		const next = {};
		for (const node of Object.values(doc.value.nodes)) {
			const target = isFrame(node) ? element(node.id) : null;
			if (target) next[node.id] = readFrameLayout(target);
		}
		detected.value = next;
	}

	/** A layer's box in its parent frame's coordinates, as rendered. */
	function measure(id) {
		const node = doc.value?.nodes[id];
		const target = element(id);
		const host = node?.parent ? element(node.parent) : null;
		return target && host ? measureFrameChild(target, host) : null;
	}

	/** The primary layer's box: its placement when it has one, or else as rendered. */
	const geometry = computed(() => {
		if (active.value?.placements?.absolute) return active.value.placements.absolute;
		// Detection reruns after every render, so measured sizes follow edits.
		detected.value;
		return measure(selected.value) || {};
	});

	/** Operations that record each child's box, so switching a frame to absolute keeps things where they are. `extra` is merged into each box. */
	function captureOperations(hostId, extra = {}) {
		const host = element(hostId);
		if (!host) return [];
		return doc.value.nodes[hostId].children.flatMap((childId) => {
			const child = doc.value.nodes[childId];
			// A hidden layer has no box on the canvas; its own style still places it.
			const target = child.type === 'text' || child.hidden ? null : element(childId);
			return target ? [onFile({ op: 'setField', id: childId, key: 'placements', value: { ...(child.placements || {}), absolute: { ...measureFrameChild(target, host), ...extra } } })] : [];
		});
	}

	/** Operations that make a frame's detected absolute layout explicit before its children move. The source already lays it out, so the export leaves its style alone (`fromSource`). */
	function adoptOperations(hostId) {
		const host = doc.value.nodes[hostId];
		if (!host || host.layout) return [];
		return [...captureOperations(hostId, { sized: false }), onFile({ op: 'setField', id: hostId, key: 'layout', value: { ...(detected.value[hostId] || createFrameLayout({ mode: 'absolute' })), fromSource: true } })];
	}

	/** The operation that places one layer at `box`. A move keeps the size out of the code unless the layer was already sized. */
	function placeOperation(id, box) {
		const node = doc.value.nodes[id];
		return onFile({ op: 'setField', id, key: 'placements', value: { ...(node.placements || {}), absolute: { ...box, sized: Boolean(box.sized ?? node.placements?.absolute?.sized) } } });
	}

	/** Applies a stage drag or resize (`style-change` from DomDesignerStage). */
	function patch({ id, style }) {
		const node = doc.value?.nodes[id];
		if (!node?.parent || node.locked) return;
		const box = Object.fromEntries(['left', 'top', 'width', 'height'].map((key) => [key, parseFloat(style[key])]));
		const target = element(id);
		const before = node.placements?.absolute || (target ? { width: target.offsetWidth, height: target.offsetHeight } : null);
		// A resize, unlike a move, fixes the size, so the code export writes it too.
		box.sized = Boolean(before?.sized || (before && (Math.round(before.width) !== Math.round(box.width) || Math.round(before.height) !== Math.round(box.height))));
		// Layers moving together (a multiple selection) share one undo step.
		const group = selectedIds.value.includes(id) ? selectedIds.value.join(' ') : id;
		run([...adoptOperations(node.parent), placeOperation(id, box)], { merge: `move:${group}` });
	}

	/** A numeric X, Y, W or H edit on the primary layer. */
	function setGeometry(key, value) {
		if (value === '' || !Number.isFinite(Number(value)) || !active.value || !parent.value || active.value.locked) return;
		const current = active.value.placements?.absolute || geometry.value;
		const sized = ['width', 'height'].includes(key);
		const next = { ...current, [key]: sized ? Math.max(16, Number(value)) : Number(value), sized: Boolean(current.sized || sized) };
		run([...adoptOperations(parent.value.id), placeOperation(active.value.id, next)], { merge: `geometry:${active.value.id}:${key}` });
	}

	/** Moves layers to new boxes as one undo step, skipping locked layers and any that did not move. */
	function moveTo(host, rects) {
		const moved = rects.filter((rect) => {
			if (doc.value.nodes[rect.id].locked) return false;
			const before = rect.before;
			return Math.round(before.left) !== Math.round(rect.left) || Math.round(before.top) !== Math.round(rect.top) || !doc.value.nodes[rect.id].placements?.absolute;
		});
		if (!moved.length) return;
		run([...adoptOperations(host.id), ...moved.map(({ id, before, ...box }) => placeOperation(id, box))]);
	}

	/** The selected layers' boxes in their shared frame. */
	function selectionRects() {
		return selectedNodes.value.map((node) => {
			const box = measure(node.id);
			return box && { id: node.id, ...box, before: box };
		}).filter(Boolean);
	}

	/**
	 * Aligns the selection: one layer within its frame's padding, several to
	 * the edges or centres of their own bounds.
	 *
	 * @param {'left'|'center'|'right'|'top'|'middle'|'bottom'} alignment
	 */
	function align(alignment) {
		const host = sharedParent.value;
		const frame = host && element(host.id);
		if (!frame || !canArrange.value) return;
		const rects = selectionRects();
		if (!rects.length) return;
		const placed = rects.length === 1
			? [{ ...rects[0], ...alignFrameChild(rects[0], { width: frame.clientWidth, height: frame.clientHeight }, alignment, layoutOf(host.id)) }]
			: alignRects(rects, alignment, boundsOf(rects));
		moveTo(host, placed);
	}

	/**
	 * Spaces three or more selected layers evenly between the first and last.
	 *
	 * @param {'horizontal'|'vertical'} axis
	 */
	function distribute(axis) {
		const host = sharedParent.value;
		if (!host || !canArrange.value || selectedNodes.value.length < 3) return;
		moveTo(host, distributeRects(selectionRects(), axis));
	}

	return { detected, refresh, layoutOf, modeOf, parentMode, parentLayout, selectedNodes, sharedParent, canArrange, measure, geometry, captureOperations, adoptOperations, patch, setGeometry, align, distribute };
}
