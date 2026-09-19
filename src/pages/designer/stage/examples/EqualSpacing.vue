<script setup>
import { ref } from 'vue';
import { DomDesignerStage } from '../../../lib/vue';

const selected = ref('third');
const spacing = ref(true);
const alignment = ref(true);
const layers = ref([
	{ id: 'first', label: 'First', style: { left: '30px', top: '70px', width: '80px', height: '70px' } },
	{ id: 'second', label: 'Second', style: { left: '120px', top: '70px', width: '80px', height: '70px' } },
	{ id: 'third', label: 'Drag me', style: { left: '270px', top: '70px', width: '80px', height: '70px' } },
]);

/** Applies the snapped or unsnapped geometry to application-owned layer state. */
function applyStyle({ id, style }) {
	const layer = layers.value.find((item) => item.id === id);
	if (layer) Object.assign(layer.style, style);
}
</script>

<template>
	<div class="w-full space-y-3">
		<div class="flex flex-wrap gap-4 text-sm">
			<label><input v-model="spacing" type="checkbox" /> Equal spacing</label>
			<label><input v-model="alignment" type="checkbox" /> Alignment</label>
		</div>
		<p class="text-xs text-muted-fg">The first two layers have a 10px gap. Move the third left to repeat it. Hold Control to bypass both snap stages.</p>
		<div class="overflow-auto">
			<DomDesignerStage v-model="selected" positioning :snapping="alignment" :spacing-snapping="spacing" class="relative h-[220px] w-[440px] bg-secondary" @style-change="applyStyle">
				<div v-for="layer in layers" :key="layer.id" :data-designer-id="layer.id" :style="layer.style" class="absolute grid place-items-center rounded-lg border border-border bg-canvas text-sm">{{ layer.label }}</div>
			</DomDesignerStage>
		</div>
		<p class="text-xs text-muted-fg">Third layer X: {{ layers[2].style.left }}. The repeated-gap target is 210px.</p>
	</div>
</template>
