<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

defineOptions({ __doc: { name: 'Designer stage', description: 'Beta HTML stage with controlled selection and opt-in absolute movement and resizing.' } });
const props = defineProps({
	modelValue: { type: String, default: '' },
	positioning: { type: Boolean, default: false },
	interactive: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'style-change']);
const root = ref(null);
const box = ref(null);
let observer;
let mutationObserver;
let gesture;

/** Finds a marked element without interpolating application identifiers into selectors. */
function selectedElement() {
	return [...(root.value?.querySelectorAll('[data-designer-id]') || [])].find((el) => el.dataset.designerId === props.modelValue);
}
/** Measures the selection in the stage's CSS coordinates, including its scroll offset. */
function measure() {
	const el = selectedElement();
	if (!el || !root.value) { box.value = null; return; }
	const r = el.getBoundingClientRect();
	const stage = root.value.getBoundingClientRect();
	const scale = stage.width / root.value.offsetWidth || 1;
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
function begin(event, resize = false) {
	if (!props.positioning || event.button !== 0) return;
	const el = selectedElement();
	if (!el) return;
	event.preventDefault();
	event.currentTarget.focus();
	const parent = el.offsetParent || root.value;
	const rect = el.getBoundingClientRect();
	const pr = parent.getBoundingClientRect();
	const scale = pr.width / parent.offsetWidth || 1;
	gesture = { id: props.modelValue, pointer: event.pointerId, handle: event.currentTarget, x: event.clientX, y: event.clientY, scale, resize, left: (rect.left - pr.left) / scale - parent.clientLeft + parent.scrollLeft, top: (rect.top - pr.top) / scale - parent.clientTop + parent.scrollTop, width: rect.width / scale, height: rect.height / scale };
	event.currentTarget.setPointerCapture(event.pointerId);
}
/** Emits CSS patches in unscaled coordinates; the host applies them to its HTML model. */
function move(event) {
	if (!gesture || gesture.pointer !== event.pointerId) return;
	const g = gesture;
	const dx = (event.clientX - g.x) / g.scale;
	const dy = (event.clientY - g.y) / g.scale;
	if (Math.abs(dx) + Math.abs(dy) < 2) return;
	const style = { position: 'absolute', margin: '0px', boxSizing: 'border-box', left: `${Math.round(g.left + (g.resize ? 0 : dx))}px`, top: `${Math.round(g.top + (g.resize ? 0 : dy))}px`, width: `${Math.max(16, Math.round(g.width + (g.resize ? dx : 0)))}px`, height: `${Math.max(16, Math.round(g.height + (g.resize ? dy : 0)))}px` };
	emit('style-change', { id: g.id, style });
	nextTick(measure);
}
/** Releases capture on completion, cancellation, selection change or unmount. */
function end() {
	const g = gesture;
	gesture = null;
	if (g?.handle.hasPointerCapture(g.pointer)) g.handle.releasePointerCapture(g.pointer);
}
/** Provides keyboard movement and resizing for the same selected HTML layer. */
function nudge(event) {
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
	geometry[key] = event.altKey ? Math.max(16, geometry[key] + delta) : geometry[key] + delta;
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
watch(() => [props.modelValue, props.positioning, props.interactive], async () => { end(); await nextTick(); measure(); });
onMounted(mount);
onBeforeUnmount(cleanup);
</script>

<template>
	<div ref="root" class="relative isolate" @click.capture="select" @scroll.capture="measure">
		<slot />
		<div v-if="box && !interactive" data-designer-overlay class="pointer-events-none absolute z-20 border-2 border-primary" :style="{ left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` }">
			<button v-if="positioning" type="button" class="pointer-events-auto absolute inset-0 cursor-move touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Move selected layer. Arrow keys move; Alt and arrows resize; Shift uses ten pixels." @pointerdown="begin($event)" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @keydown="nudge"></button>
			<button v-if="positioning" type="button" class="pointer-events-auto absolute -bottom-2 -right-2 size-4 cursor-se-resize touch-none border-2 border-primary bg-canvas" aria-label="Resize selected layer" @pointerdown.stop="begin($event, true)" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @keydown="nudge"></button>
		</div>
	</div>
</template>
