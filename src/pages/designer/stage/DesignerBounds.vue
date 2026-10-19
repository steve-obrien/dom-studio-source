<script setup>
import { onMounted, ref } from 'vue';

const props = defineProps({
	box: { type: Object, required: true },
	scale: { type: Number, default: 1 },
	positioning: { type: Boolean, default: false },
	reorderable: { type: Boolean, default: false },
});
const emit = defineEmits(['begin', 'move', 'finish', 'cancel', 'nudge']);
const handles = [
	{ id: 'nw', label: 'top left', x: 0, y: 0, cursor: 'nwse-resize' },
	{ id: 'n', label: 'top', x: 50, y: 0, cursor: 'ns-resize' },
	{ id: 'ne', label: 'top right', x: 100, y: 0, cursor: 'nesw-resize' },
	{ id: 'e', label: 'right', x: 100, y: 50, cursor: 'ew-resize' },
	{ id: 'se', label: 'bottom right', x: 100, y: 100, cursor: 'nwse-resize' },
	{ id: 's', label: 'bottom', x: 50, y: 100, cursor: 'ns-resize' },
	{ id: 'sw', label: 'bottom left', x: 0, y: 100, cursor: 'nesw-resize' },
	{ id: 'w', label: 'left', x: 0, y: 50, cursor: 'ew-resize' },
];
// Fingers need bigger handles than a mouse.
const handleSize = ref(12);
onMounted(() => { if (window.matchMedia?.('(pointer: coarse)').matches) handleSize.value = 20; });
/** Keeps handles constant in screen pixels at every stage zoom. */
function handleStyle(handle) {
	return { left: `${handle.x}%`, top: `${handle.y}%`, width: `${handleSize.value / props.scale}px`, height: `${handleSize.value / props.scale}px`, borderWidth: `${2 / props.scale}px`, cursor: handle.cursor };
}
</script>

<template>
	<div data-designer-overlay class="pointer-events-none absolute z-[2147483647] border-primary" :style="{ borderWidth: `${2 / scale}px`, left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` }">
		<button v-if="positioning || reorderable" type="button" class="pointer-events-auto absolute inset-0 touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring" :class="positioning ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'" :aria-label="positioning ? 'Move selected layer. Arrow keys move; Alt and arrows resize; Shift uses ten pixels.' : 'Drag to reorder the selected layer within its frame.'" @pointerdown="emit('begin', { event: $event, handle: '' })" @pointermove="emit('move', $event)" @pointerup="emit('finish')" @pointercancel="emit('cancel')" @lostpointercapture="emit('cancel')" @keydown="emit('nudge', { event: $event, handle: '' })" />
		<template v-if="positioning">
			<button v-for="handle in handles" :key="handle.id" type="button" class="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 touch-none border-primary bg-canvas outline-none focus-visible:ring-2 focus-visible:ring-ring" :style="handleStyle(handle)" :aria-label="`Resize selected layer: ${handle.label}`" @pointerdown.stop="emit('begin', { event: $event, handle: handle.id })" @pointermove="emit('move', $event)" @pointerup="emit('finish')" @pointercancel="emit('cancel')" @lostpointercapture="emit('cancel')" @keydown="emit('nudge', { event: $event, handle: handle.id })" />
		</template>
	</div>
</template>
