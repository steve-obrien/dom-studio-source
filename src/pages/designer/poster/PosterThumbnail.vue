<script setup>
import { computed } from 'vue';
import { posterLayerStyle, safePosterImage } from './posterModel.js';

/**
 * A read-only, scaled rendering of a poster: the same HTML and CSS as the
 * stage and export, without selection ids. Used for format previews.
 */
const props = defineProps({
	poster: { type: Object, required: true },
	height: { type: Number, default: 132 },
});
const scale = computed(() => props.height / props.poster.height);
</script>

<template>
	<div class="relative overflow-hidden rounded-sm shadow-sm" :style="{ width: `${Math.round(poster.width * scale)}px`, height: `${height}px` }" aria-hidden="true">
		<article class="absolute left-0 top-0 origin-top-left" :style="{ width: `${poster.width}px`, height: `${poster.height}px`, overflow: 'hidden', background: poster.background, transform: `scale(${scale})` }">
			<template v-for="(layer, index) in poster.layers" :key="layer.id">
				<img v-if="layer.type === 'image'" :src="safePosterImage(layer.value)" alt="" :style="posterLayerStyle(layer, index)" draggable="false" loading="lazy" />
				<component :is="layer.type === 'text' ? 'p' : 'div'" v-else :style="posterLayerStyle(layer, index)">{{ layer.type === 'text' ? layer.value : '' }}</component>
			</template>
		</article>
	</div>
</template>
