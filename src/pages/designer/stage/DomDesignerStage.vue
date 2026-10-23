<script setup>
import DesignerBounds from './DesignerBounds.vue';
import { resizeBounds } from './resizeGeometry.js';
import { createSnapIndex, snapResize } from './snapGeometry.js';
import { createSpacingIndex } from './spacingGeometry.js';
import { snapTranslation } from './snapPipeline.js';
import SpacingGuides from './SpacingGuides.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

defineOptions({ __doc: { name: 'Designer stage', description: 'Beta HTML stage with controlled selection and opt-in absolute movement and resizing.' } });
const props = defineProps({
	modelValue: { type: String, default: '' },
	positioning: { type: Boolean, default: false },
	interactive: { type: Boolean, default: false },
	snapping: { type: Boolean, default: false },
	spacingSnapping: { type: Boolean, default: false, _edit: { description: 'Repeat horizontal and vertical layer gaps while dragging. Independent of alignment snapping; disabled by default.' } },
	frameScoped: { type: Boolean, default: false, _edit: { description: 'Only move children of an absolute data-designer-frame. Snap to that frame and its direct children.' } },
	selection: { type: Array, default: undefined, _edit: { description: 'Selected IDs for multi-select. Shift-click adds or removes a layer; dragging moves every selected layer that can be positioned.' } },
	zoom: { type: Number, default: 1, _edit: { description: 'Scale applied outside the stage\'s own document, such as a zoomed canvas around an artboard iframe, so outlines and handles keep their screen size.' } },
	reorder: { type: Boolean, default: false, _edit: { description: 'Drag layers inside flow, flex and grid frames to reorder them. Emits reorder with the new parent and the sibling it goes before.' } },
	editing: { type: String, default: '', _edit: { description: 'ID of a layer whose text is being edited in place. Clicks inside it move the caret instead of selecting, and the selection box stops taking the pointer.' } },
});
const emit = defineEmits(['update:modelValue', 'update:selection', 'style-change', 'reorder', 'edit-text']);
const root = ref(null);
const box = ref(null);
const viewScale = ref(1);
// Outlines and handles are sized in screen pixels: the stage's own scale times any zoom outside its document.
const screenScale = computed(() => viewScale.value * (props.zoom || 1));
const guides = ref({});
const canPosition = ref(false);
const guideClip = ref(null);
const others = ref([]);
const canReorder = ref(false);
const drop = ref(null);
let moveFrame;
let pendingMove;
let observer;
let mutationObserver;
let gesture;

/** Finds a marked element without interpolating application identifiers into selectors. */
function selectedElement() {
	if (gesture?.element) return gesture.element;
	return [...(root.value?.querySelectorAll('[data-designer-id]') || [])].find((el) => el.dataset.designerId === props.modelValue);
}
/** Resolves the nearest containing frame without changing legacy stage behaviour. */
function containingFrame(element) {
	return element?.parentElement?.closest('[data-designer-frame]');
}
/** Allows free movement only where the parent, rather than the selected frame, is absolute. */
function permitsPositioning(element) {
	const frame = containingFrame(element);
	return props.positioning && (!props.frameScoped || (frame?.dataset.designerFrame === 'absolute' && element.parentElement === frame));
}
/** Measures the selection in the stage's CSS coordinates, including its scroll offset. */
function measure() {
	const el = selectedElement();
	canPosition.value = permitsPositioning(el);
	canReorder.value = !canPosition.value && Boolean(reorderHost(el));
	// Every other rendered copy is outlined too: a v-for repeats its layers, and an edit changes all of them.
	const ids = new Set([...(props.selection || []), props.modelValue].filter(Boolean));
	others.value = [...(root.value?.querySelectorAll('[data-designer-id]') || [])].filter((item) => ids.has(item.dataset.designerId) && item !== el && !item.closest('[data-designer-overlay]')).map(stageBox);
	if (!el || !root.value) { box.value = null; return; }
	box.value = stageBox(el);
}
/** Measures an element in the stage's CSS coordinates, including its scroll offset. */
function stageBox(el) {
	const r = el.getBoundingClientRect();
	const stage = root.value.getBoundingClientRect();
	const scale = stage.width / root.value.offsetWidth || 1;
	viewScale.value = scale;
	return { left: (r.left - stage.left) / scale - root.value.clientLeft + root.value.scrollLeft, top: (r.top - stage.top) / scale - root.value.clientTop + root.value.scrollTop, width: r.width / scale, height: r.height / scale };
}
/** Finds the first rendered element for an ID; repeated list items share their source's ID. */
function markedElement(id) {
	return [...(root.value?.querySelectorAll('[data-designer-id]') || [])].find((el) => el.dataset.designerId === id && !el.hasAttribute('data-designer-repeat'));
}
/** Measures an element relative to its offset parent, as CSS left/top/width/height. */
function parentBox(el) {
	const parent = el.offsetParent || root.value;
	const rect = el.getBoundingClientRect();
	const pr = parent.getBoundingClientRect();
	const scale = pr.width / parent.offsetWidth || 1;
	return { left: (rect.left - pr.left) / scale - parent.clientLeft + parent.scrollLeft, top: (rect.top - pr.top) / scale - parent.clientTop + parent.scrollTop, width: rect.width / scale, height: rect.height / scale, scale };
}
/** The flow, flex or grid frame an element can be reordered within, when reordering is on. */
function reorderHost(el) {
	if (!props.reorder || !el || el.hasAttribute('data-designer-repeat')) return null;
	const host = el.parentElement?.closest('[data-designer-id]');
	return host && root.value?.contains(host) && host.dataset.designerFrame && host.dataset.designerFrame !== 'absolute' ? host : null;
}
/** The layer being edited in place, if this click landed in it. */
function inEditing(target) {
	const host = props.editing && target?.closest?.('[contenteditable="true"]');
	return Boolean(host && host.dataset.designerId === props.editing);
}
/** Selects the innermost marked HTML layer and prevents preview controls from activating. */
function select(event) {
	if (props.interactive || inEditing(event.target)) return;
	if (event.detail === 2) { requestEdit(event); return; }
	if (event.target.closest('[data-designer-overlay]')) return;
	const el = event.target.closest('[data-designer-id]');
	if (!el || !root.value.contains(el)) return;
	event.preventDefault();
	event.stopPropagation();
	choose(el.dataset.designerId, event.shiftKey || event.metaKey);
}
/** A double click asks to edit the text under the pointer, looking through the selection box to the layer beneath. */
function requestEdit(event) {
	const el = event.target.ownerDocument.elementsFromPoint(event.clientX, event.clientY).find((item) => item.hasAttribute('data-designer-id') && root.value.contains(item) && !item.closest('[data-designer-overlay]'));
	if (!el) return;
	event.preventDefault();
	event.stopPropagation();
	emit('edit-text', { id: el.dataset.designerId, element: el, x: event.clientX, y: event.clientY });
}
/** Shift-click adds to the selection, so it must not also extend the browser's text selection. */
function keepTextSelection(event) {
	if (props.selection && !props.interactive && (event.shiftKey || event.metaKey) && !event.target.closest('[data-designer-overlay]')) event.preventDefault();
}
/** Selects one layer, or adds and removes it from a multi-selection. */
function choose(id, additive = false) {
	if (!props.selection) { emit('update:modelValue', id); return; }
	if (!additive) {
		emit('update:selection', [id]);
		emit('update:modelValue', id);
		return;
	}
	const current = props.selection.includes(props.modelValue) || !props.modelValue ? props.selection : [...props.selection, props.modelValue];
	const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
	emit('update:selection', next);
	emit('update:modelValue', next.includes(id) ? id : next[next.length - 1] || '');
}
/** Begins a captured pointer gesture; conversion to absolute positioning occurs on movement. */
function begin(event, resize = '') {
	if (event.button !== 0) return;
	const el = selectedElement();
	if (!el) return;
	if (!resize) {
		const hit = el.ownerDocument.elementsFromPoint(event.clientX, event.clientY).find((item) => item.hasAttribute('data-designer-id') && root.value.contains(item));
		if (hit && (hit.dataset.designerId !== props.modelValue || (props.selection && (event.shiftKey || event.metaKey)))) {
			choose(hit.dataset.designerId, event.shiftKey || event.metaKey);
			return;
		}
	}
	if (!resize && !permitsPositioning(el) && reorderHost(el)) { beginReorder(event, el); return; }
	if (!permitsPositioning(el)) return;
	event.preventDefault();
	event.currentTarget.focus();
	const rect = el.getBoundingClientRect();
	const start = parentBox(el);
	gesture = { id: props.modelValue, pointer: event.pointerId, handle: event.currentTarget, x: event.clientX, y: event.clientY, resize, ...start };
	gesture.element = el;
	// Other selected layers follow a move, keeping their offsets from the dragged one.
	gesture.followers = resize ? [] : (props.selection || []).filter((id) => id !== props.modelValue).map((id) => ({ id, element: markedElement(id) })).filter((item) => item.element && permitsPositioning(item.element) && !item.element.contains(el) && !el.contains(item.element)).map((item) => ({ ...item, ...parentBox(item.element) }));
	if (props.snapping || (props.spacingSnapping && !resize)) {
		const stage = root.value.getBoundingClientRect();
		const stageScale = stage.width / root.value.offsetWidth || 1;
		const origin = { left: (rect.left - stage.left) / stageScale - root.value.clientLeft + root.value.scrollLeft, top: (rect.top - stage.top) / stageScale - root.value.clientTop + root.value.scrollTop };
		const scope = props.frameScoped ? containingFrame(el) : null;
		const scopeRect = scope?.getBoundingClientRect();
		const rects = [scope ? { left: (scopeRect.left - stage.left) / stageScale - root.value.clientLeft + root.value.scrollLeft + scope.clientLeft, top: (scopeRect.top - stage.top) / stageScale - root.value.clientTop + root.value.scrollTop + scope.clientTop, width: scope.clientWidth, height: scope.clientHeight } : { left: 0, top: 0, width: root.value.clientWidth, height: root.value.clientHeight }];
		const bounds = rects[0];
		guideClip.value = scope ? `inset(${bounds.top}px ${Math.max(0, root.value.clientWidth - bounds.left - bounds.width)}px ${Math.max(0, root.value.clientHeight - bounds.top - bounds.height)}px ${bounds.left}px)` : null;
		for (const target of root.value.querySelectorAll('[data-designer-id]')) {
			if (target === el || el.contains(target) || target.contains(el)) continue;
			if (gesture.followers.some((item) => item.element === target || item.element.contains(target) || target.contains(item.element))) continue;
			if (scope && target.parentElement !== scope) continue;
			const r = target.getBoundingClientRect();
			const style = target.ownerDocument.defaultView.getComputedStyle(target);
			if (!r.width || !r.height || style.visibility === 'hidden' || style.display === 'none') continue;
			const left = (r.left - stage.left) / stageScale - root.value.clientLeft + root.value.scrollLeft;
			const top = (r.top - stage.top) / stageScale - root.value.clientTop + root.value.scrollTop;
			if (left + r.width / stageScale < 0 || top + r.height / stageScale < 0 || left > root.value.clientWidth || top > root.value.clientHeight) continue;
			rects.push({ left, top, width: r.width / stageScale, height: r.height / stageScale });
		}
		gesture.snap = {
			index: props.snapping ? createSnapIndex(rects) : null,
			spacing: props.spacingSnapping && !resize ? createSpacingIndex(rects.slice(1)) : null,
			origin, scale: stageScale, matches: {},
		};
	}
	event.currentTarget.setPointerCapture(event.pointerId);
}
/** Coalesces pointer events to one geometry update per animation frame. */
function move(event) {
	if (!gesture || gesture.pointer !== event.pointerId) return;
	pendingMove = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, ctrlKey: event.ctrlKey };
	if (!moveFrame) moveFrame = requestAnimationFrame(flushMove);
}
/** Applies the latest pointer sample without retaining browser event objects. */
function flushMove() {
	moveFrame = null;
	const event = pendingMove;
	pendingMove = null;
	if (event) applyMove(event);
}
/** Emits CSS patches in parent coordinates after optional stage-coordinate snapping. */
function applyMove(event) {
	if (!gesture || gesture.pointer !== event.pointerId) return;
	const g = gesture;
	if (g.reorder) { moveReorder(event); return; }
	const dx = (event.clientX - g.x) / g.scale;
	const dy = (event.clientY - g.y) / g.scale;
	if (!g.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
	g.moved = true;
	const proposed = g.resize ? resizeBounds(g, g.resize, dx, dy) : { left: g.left + dx, top: g.top + dy, width: g.width, height: g.height };
	let { left, top, width, height } = proposed;
	if (g.snap && (props.snapping || (props.spacingSnapping && !g.resize)) && !event.ctrlKey) {
		const snap = g.snap;
		const ratio = g.scale / snap.scale;
		const result = g.resize
			? snapResize({ left: snap.origin.left + (left - g.left) * ratio, top: snap.origin.top + (top - g.top) * ratio, width: width * ratio, height: height * ratio }, snap.index, snap.scale, snap.matches, 16 * ratio, g.resize)
			: snapTranslation({ left: snap.origin.left + dx * ratio, top: snap.origin.top + dy * ratio, width: g.width * ratio, height: g.height * ratio }, { alignment: snap.index, spacing: snap.spacing }, snap.scale, snap.matches);
		if (g.resize) {
			width = result.width / ratio;
			height = result.height / ratio;
		}
		left = g.left + (result.left - snap.origin.left) / ratio;
		top = g.top + (result.top - snap.origin.top) / ratio;
		snap.matches = result.matches;
		guides.value = result.matches;
	} else {
		guides.value = {};
		if (g.snap) g.snap.matches = {};
	}
	const style = { position: 'absolute', margin: '0px', boxSizing: 'border-box', left: `${Math.round(left)}px`, top: `${Math.round(top)}px`, width: `${Math.max(16, Math.round(width))}px`, height: `${Math.max(16, Math.round(height))}px` };
	emit('style-change', { id: g.id, style });
	for (const item of g.followers) emit('style-change', { id: item.id, style: { ...style, left: `${Math.round(item.left + left - g.left)}px`, top: `${Math.round(item.top + top - g.top)}px`, width: `${Math.round(item.width)}px`, height: `${Math.round(item.height)}px` } });
	nextTick(measure);
}
/** Starts dragging a flow child; the drop position is shown as a line between siblings. */
function beginReorder(event, el) {
	event.preventDefault();
	event.currentTarget.focus();
	gesture = { reorder: true, id: props.modelValue, pointer: event.pointerId, handle: event.currentTarget, x: event.clientX, y: event.clientY, element: el, box: stageBox(el) };
	event.currentTarget.setPointerCapture(event.pointerId);
}
/** Finds the frame under the pointer and the sibling the dragged layer would precede. */
function moveReorder(event) {
	const g = gesture;
	const dx = (event.clientX - g.x) / viewScale.value;
	const dy = (event.clientY - g.y) / viewScale.value;
	if (!g.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
	g.moved = true;
	const host = g.element.ownerDocument.elementsFromPoint(event.clientX, event.clientY).find((item) => item.dataset?.designerFrame && item.dataset.designerFrame !== 'absolute' && item.dataset.designerId && root.value.contains(item) && !item.closest('[data-designer-overlay]') && !g.element.contains(item) && !item.closest('[data-designer-repeat]'));
	if (!host) { drop.value = { ghost: { ...g.box, left: g.box.left + dx, top: g.box.top + dy } }; g.target = null; return; }
	const children = [...host.querySelectorAll('[data-designer-id]')].filter((item) => item.parentElement.closest('[data-designer-id]') === host && item !== g.element && !item.hasAttribute('data-designer-repeat'));
	const style = host.ownerDocument.defaultView.getComputedStyle(host);
	const vertical = !/flex|grid/.test(style.display) || (style.display.includes('flex') && style.flexDirection.startsWith('column'));
	const pointer = { x: event.clientX, y: event.clientY };
	const before = children.find((item) => {
		const r = item.getBoundingClientRect();
		if (vertical) return pointer.y < r.top + r.height / 2;
		return pointer.y < r.top || (pointer.y <= r.bottom && pointer.x < r.left + r.width / 2);
	});
	const frame = stageBox(host);
	const edge = before ? stageBox(before) : children.length ? stageBox(children[children.length - 1]) : null;
	const thickness = 3 / screenScale.value;
	let line;
	if (!edge) line = vertical ? { left: frame.left, top: frame.top + frame.height / 2, width: frame.width, height: thickness } : { left: frame.left + frame.width / 2, top: frame.top, width: thickness, height: frame.height };
	else if (vertical) line = { left: edge.left, top: before ? edge.top - thickness : edge.top + edge.height, width: edge.width, height: thickness };
	else line = { left: before ? edge.left - thickness : edge.left + edge.width, top: edge.top, width: thickness, height: edge.height };
	g.target = { parent: host.dataset.designerId, before: before?.dataset.designerId || null };
	drop.value = { frame, line, ghost: { ...g.box, left: g.box.left + dx, top: g.box.top + dy } };
}
/** Flushes the last queued sample before a normal pointer release. */
function finish() {
	if (moveFrame) cancelAnimationFrame(moveFrame);
	flushMove();
	const g = gesture;
	end();
	if (g?.reorder && g.moved && g.target) emit('reorder', { id: g.id, ...g.target });
}
/** Releases capture on completion, cancellation, selection change or unmount. */
function end() {
	if (moveFrame) cancelAnimationFrame(moveFrame);
	moveFrame = null;
	pendingMove = null;
	guides.value = {};
	guideClip.value = null;
	drop.value = null;
	const g = gesture;
	gesture = null;
	if (g?.handle.hasPointerCapture(g.pointer)) g.handle.releasePointerCapture(g.pointer);
}
/** Provides keyboard movement and resizing for the same selected HTML layer. */
function nudge(event, handle = '') {
	if (!props.positioning || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
	const el = selectedElement();
	if (!el || !permitsPositioning(el)) return;
	event.preventDefault();
	const step = event.shiftKey ? 10 : 1;
	if (!handle && !event.altKey) {
		const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
		const delta = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -step : step;
		for (const id of [props.modelValue, ...(props.selection || []).filter((item) => item !== props.modelValue)]) {
			const target = id === props.modelValue ? el : markedElement(id);
			if (!target || !permitsPositioning(target)) continue;
			const { scale, ...geometry } = parentBox(target);
			geometry[horizontal ? 'left' : 'top'] += delta;
			emit('style-change', { id, style: { position: 'absolute', margin: '0px', boxSizing: 'border-box', ...Object.fromEntries(Object.entries(geometry).map(([name, value]) => [name, `${Math.round(value)}px`])) } });
		}
		return;
	}
	const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
	const delta = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -step : step;
	const key = event.altKey ? (horizontal ? 'width' : 'height') : (horizontal ? 'left' : 'top');
	const parent = el.offsetParent || root.value;
	const rect = el.getBoundingClientRect();
	const pr = parent.getBoundingClientRect();
	const scale = pr.width / parent.offsetWidth || 1;
	const geometry = { left: (rect.left - pr.left) / scale - parent.clientLeft + parent.scrollLeft, top: (rect.top - pr.top) / scale - parent.clientTop + parent.scrollTop, width: rect.width / scale, height: rect.height / scale };
	if (handle) Object.assign(geometry, resizeBounds(geometry, handle, horizontal ? delta : 0, horizontal ? 0 : delta));
	else geometry[key] = event.altKey ? Math.max(16, geometry[key] + delta) : geometry[key] + delta;
	emit('style-change', { id: props.modelValue, style: { position: 'absolute', margin: '0px', boxSizing: 'border-box', ...Object.fromEntries(Object.entries(geometry).map(([name, value]) => [name, `${Math.round(value)}px`])) } });
}
/** Installs observers for responsive HTML, font loading and application-owned edits. */
function mount() {
	observer = new ResizeObserver(measure);
	observer.observe(root.value);
	mutationObserver = new MutationObserver(refresh);
	mutationObserver.observe(root.value, { childList: true, subtree: true, attributes: true, characterData: true });
	window.addEventListener('resize', measure);
	refresh();
}
/** Updates observed layer boxes while ignoring mutations to the editor overlay itself. */
function refresh(records = []) {
	if (records.length && records.every((r) => r.target.closest?.('[data-designer-overlay]'))) return;
	if (gesture) { measure(); return; }
	observer?.disconnect();
	if (root.value) {
		observer?.observe(root.value);
		root.value.querySelectorAll('[data-designer-id]').forEach((el) => observer?.observe(el));
	}
	measure();
}
/** Tears down every observer, listener and pointer capture owned by this stage. */
function cleanup() {
	end();
	observer?.disconnect();
	mutationObserver?.disconnect();
	window.removeEventListener('resize', measure);
}
watch(() => [props.modelValue, props.selection?.join(' '), props.positioning, props.interactive, props.snapping, props.spacingSnapping, props.frameScoped, props.reorder], async () => { end(); await nextTick(); measure(); });
onMounted(mount);
onBeforeUnmount(cleanup);
</script>

<template>
	<div ref="root" class="relative isolate" @click.capture="select" @mousedown.capture="keepTextSelection" @scroll.capture="measure">
		<slot />
		<div data-designer-overlay aria-hidden="true" class="pointer-events-none absolute inset-0 z-[2147483647]" :style="{ clipPath: guideClip }">
			<div v-if="guides.x && guides.x.kind !== 'spacing'" class="absolute inset-y-0 bg-primary" :style="{ left: `${guides.x.target}px`, width: `${1 / screenScale}px` }" />
			<div v-if="guides.y && guides.y.kind !== 'spacing'" class="absolute inset-x-0 bg-primary" :style="{ top: `${guides.y.target}px`, height: `${1 / screenScale}px` }" />
			<SpacingGuides :matches="guides" :scale="screenScale" />
			<template v-if="!interactive">
				<div v-for="(item, index) in others" :key="index" class="absolute border-primary" :style="{ borderWidth: `${1 / screenScale}px`, left: `${item.left}px`, top: `${item.top}px`, width: `${item.width}px`, height: `${item.height}px` }" />
			</template>
			<template v-if="drop">
				<div v-if="drop.frame" class="absolute border-dashed border-primary" :style="{ borderWidth: `${1 / screenScale}px`, left: `${drop.frame.left}px`, top: `${drop.frame.top}px`, width: `${drop.frame.width}px`, height: `${drop.frame.height}px` }" />
				<div class="absolute border-dashed border-primary/60 bg-primary/5" :style="{ borderWidth: `${1 / screenScale}px`, left: `${drop.ghost.left}px`, top: `${drop.ghost.top}px`, width: `${drop.ghost.width}px`, height: `${drop.ghost.height}px` }" />
				<div v-if="drop.line" class="absolute bg-primary" :style="{ left: `${drop.line.left}px`, top: `${drop.line.top}px`, width: `${drop.line.width}px`, height: `${drop.line.height}px` }" />
			</template>
		</div>
		<DesignerBounds v-if="box && !interactive" :box="box" :scale="screenScale" :positioning="canPosition" :reorderable="canReorder" :editing="Boolean(editing) && editing === modelValue" @begin="begin($event.event, $event.handle)" @move="move" @finish="finish" @cancel="end" @nudge="nudge($event.event, $event.handle)" />
	</div>
</template>
