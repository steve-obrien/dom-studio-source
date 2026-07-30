<script setup>
import DomLiquidGlassSurface from '../../lib/vue/_internal/DomLiquidGlassSurface.vue';

defineOptions({
	name: 'ExperimentalLiquidGlassSurface',
	__doc: {
		description: 'Compatibility wrapper for the shared internal liquid-glass surface used by this experiment.',
	},
});

defineProps({
	refraction: {
		type: Number,
		default: 50,
	},
});
</script>

<template>
	<DomLiquidGlassSurface :refraction="refraction">
		<slot />
	</DomLiquidGlassSurface>
</template>
