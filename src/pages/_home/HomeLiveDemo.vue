<script setup>
import { onMounted, ref, shallowRef, watch } from 'vue';
import { useNearViewport } from '../../composable/useNearViewport.js';

const props = defineProps({
	/** Imports the live demo. Runs once, when the section nears the viewport. */
	load: { type: Function, required: true },
	/** Narrowest window, in pixels, that gets the live demo; narrower screens keep the picture. */
	minWidth: { type: Number, default: 0 },
	/** Props for the live demo. */
	demoProps: { type: Object, default: () => ({}) },
});

const target = ref(null);
const near = useNearViewport(target);
const live = shallowRef(null);
const wide = ref(false);

/** Only screens wide enough for the demo load it. @returns {void} */
function measure() {
	wide.value = window.innerWidth >= props.minWidth;
}

/** Swaps the picture for the real component once it has loaded. @returns {Promise<void>} */
async function swap() {
	if (!near.value || !wide.value || live.value) return;
	try {
		const module = await props.load();
		live.value = module.default;
	} catch {
		// The picture stays when the demo cannot load, such as offline.
	}
}

onMounted(measure);
watch([near, wide], swap);
</script>

<template>
	<div ref="target">
		<component :is="live" v-if="live" v-bind="demoProps" />
		<slot v-else />
	</div>
</template>
