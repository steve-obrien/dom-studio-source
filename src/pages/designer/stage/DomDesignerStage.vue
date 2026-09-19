<script setup>
import DesignerBounds from './DesignerBounds.vue';
import { resizeBounds } from './resizeGeometry.js';
import { createSnapIndex, snapResize } from './snapGeometry.js';
import { createSpacingIndex } from './spacingGeometry.js';
import { snapTranslation } from './snapPipeline.js';
import SpacingGuides from './SpacingGuides.vue';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

defineOptions({ __doc: { name: 'Designer stage', description: 'Beta HTML stage with controlled selection and opt-in absolute movement and resizing.' } });
const props = defineProps({
	modelValue: { type: String, default: '' },
	positioning: { type: Boolean, default: false },
	interactive: { type: Boolean, default: false },
	snapping: { type: Boolean, default: false },
	spacingSnapping: { type: Boolean, default: false, _edit: { description: 'Repeat horizontal and vertical layer gaps while dragging. Independent of alignment snapping; disabled by default.' } },
});
const emit = defineEmits(['update:modelValue', 'style-change']);
const root = ref(null);
const box = ref(null);
const viewScale = ref(1);
const guides = ref({});
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
/** Measures the selection in the stage's CSS coordinates, including its scroll offset. */
function measure() {
	const el = selectedElement();
	if (!el || !root.value) { box.value = null; return; }
	const r = el.getBoundingClientRect();
	const stage = root.value.getBoundingClientRect();
	const scale = stage.width / root.value.offsetWidth || 1;
	viewScale.value = scale;
	box.value = { left: (r.left - stage.left) / scale - root.value.clientLeft + root.value.scrollLeft, top: (r.top - stage.top) / scale - root.value.clientTop + root.value.scrollTop, width: r.width / scale, height: r.height / scale };
}
/** Selects the innermost marked HTML layer and prevents preview controls from activating. */
function select(event) {
	if (props.interactive || event.target.closest('[data-designer-overlay]')) return;
	const el = event.target.closest('[data-designer-id]');
	if (!el || !root.value.contains(el)) return;
	event.preventDefault();
	event.stopPropagation();
	emit('update:modelValue', el.dataset.designerId);
}
/** Begins a captured pointer gesture; conversion to absolute positioning occurs on movement. */
function begin(event, resize = '') {
	if (!props.positioning || event.button !== 0) return;
	const el = selectedElement();
	if (!el) return;
	if (!resize) {
		const hit = document.elementsFromPoint(event.clientX, event.clientY).find((item) => item.hasAttribute('data-designer-id') && root.value.contains(item));
		if (hit && hit.dataset.designerId !== props.modelValue) {
			emit('update:modelValue', hit.dataset.designerId);
			return;
		}
	}
	event.preventDefault();
	event.currentTarget.focus();
	const parent = el.offsetParent || root.value;
	const rect = el.getBoundingClientRect();
	const pr = parent.getBoundingClientRect();
	const scale = pr.width / parent.offsetWidth || 1;
	gesture = { id: props.modelValue, pointer: event.pointerId, handle: event.currentTarget, x: event.clientX, y: event.clientY, scale, resize, left: (rect.left - pr.left) / scale - parent.clientLeft + parent.scrollLeft, top: (rect.top - pr.top) / scale - parent.clientTop + parent.scrollTop, width: rect.width / scale, height: rect.height / scale };
	gesture.element = el;
	if (props.snapping || (props.spacingSnapping && !resize)) {
		const stage = root.value.getBoundingClientRect();
		const stageScale = stage.width / root.value.offsetWidth || 1;
		const origin = { left: (rect.left - stage.left) / stageScale - root.value.clientLeft + root.value.scrollLeft, top: (rect.top - stage.top) / stageScale - root.value.clientTop + root.value.scrollTop };
		const rects = [{ left: 0, top: 0, width: root.value.clientWidth, height: root.value.clientHeight }];
		for (const target of root.value.querySelectorAll('[data-designer-id]')) {
			if (target === el || el.contains(target) || target.contains(el)) continue;
			const r = target.getBoundingClientRect();
			const style = getComputedStyle(target);
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
	nextTick(measure);
}
/** Flushes the last queued sample before a normal pointer release. */
function finish() {
	if (moveFrame) cancelAnimationFrame(moveFrame);
	flushMove();
	end();
}
/** Releases capture on completion, cancellation, selection change or unmount. */
function end() {
	if (moveFrame) cancelAnimationFrame(moveFrame);
	moveFrame = null;
	pendingMove = null;
	guides.value = {};
	const g = gesture;
	gesture = null;
	if (g?.handle.hasPointerCapture(g.pointer)) g.handle.releasePointerCapture(g.pointer);
}
/** Provides keyboard movement and resizing for the same selected HTML layer. */
function nudge(event, handle = '') {
	if (!props.positioning || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
	const el = selectedElement();
	if (!el) return;
	event.preventDefault();
	const step = event.shiftKey ? 10 : 1;
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
watch(() => [props.modelValue, props.positioning, props.interactive, props.snapping, props.spacingSnapping], async () => { end(); await nextTick(); measure(); });
onMounted(mount);
onBeforeUnmount(cleanup);
</script>

<template>
	<div ref="root" class="relative isolate" @click.capture="select" @scroll.capture="measure">
		<slot />
		<div data-designer-overlay aria-hidden="true" class="pointer-events-none absolute inset-0 z-[2147483647]">
			<div v-if="guides.x && guides.x.kind !== 'spacing'" class="absolute inset-y-0 bg-primary" :style="{ left: `${guides.x.target}px`, width: `${1 / viewScale}px` }" />
			<div v-if="guides.y && guides.y.kind !== 'spacing'" class="absolute inset-x-0 bg-primary" :style="{ top: `${guides.y.target}px`, height: `${1 / viewScale}px` }" />
			<SpacingGuides :matches="guides" :scale="viewScale" />
		</div>
		<DesignerBounds v-if="box && !interactive" :box="box" :scale="viewScale" :positioning="positioning" @begin="begin($event.event, $event.handle)" @move="move" @finish="finish" @cancel="end" @nudge="nudge($event.event, $event.handle)" />
	</div>
</template>
