<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import { fontStack } from './fontPicker.js';

const props = defineProps({ font: { type: Object, required: true }, text: { type: String, default: '' }, active: Boolean });
const emit = defineEmits(['visibility']);
const row = ref(null);
let observer = null;

/** Observe only this row's scroll viewport; off-screen metadata never requests a font. */
function observePreview() {
	observer?.disconnect();
	if (!props.active || !row.value) return;
	observer = new IntersectionObserver(([entry]) => emit('visibility', props.font, entry.isIntersecting), {
		root: row.value.closest('[role="listbox"], dom-listbox'),
		rootMargin: '48px 0px',
	});
	observer.observe(row.value);
}

/** Release the observer and remove an unmounted row from the pending preview set. */
function releasePreview() {
	observer?.disconnect();
	emit('visibility', props.font, false);
}

watch([row, () => props.active], observePreview, { flush: 'post' });
onBeforeUnmount(releasePreview);
</script>

<template>
	<span ref="row" class="block">
		<span class="flex min-w-0 items-center justify-between gap-4">
			<span class="min-w-0 truncate text-base" :style="{ fontFamily: fontStack(font) }">{{ text || font.label }}</span>
			<span class="shrink-0 text-[0.6875rem] font-medium uppercase tracking-wide text-muted-fg">{{ font.category }}</span>
		</span>
		<span v-if="text" class="mt-0.5 block truncate text-xs text-muted-fg">{{ font.label }}</span>
	</span>
</template>
