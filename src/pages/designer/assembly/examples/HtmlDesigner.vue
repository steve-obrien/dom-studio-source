<script setup>
import { computed, ref } from 'vue';
import { DomDesignerLayers, DomDesignerStage, DomSplitterPanel, DomTextInput, DomColorSwatch } from '../../../lib/vue';

const selected = ref('heading');
const panelWidth = ref(190);
const layers = ref([
	{ id: 'heading', label: 'Heading', text: 'Make something yours.', color: 'var(--canvas-fg)', style: { position: 'absolute', left: '24px', top: '32px', width: '250px', height: '100px', fontSize: '30px' } },
	{ id: 'caption', label: 'Caption', text: 'Real HTML. One shared model.', color: 'var(--muted-fg)', style: { position: 'absolute', left: '24px', top: '180px', width: '250px', height: '60px', fontSize: '16px' } },
]);
const active = computed(() => layers.value.find((layer) => layer.id === selected.value));

/** Persists the stage's CSS patch in the same model rendered by Vue. */
function applyStyle({ id, style }) {
	const layer = layers.value.find((item) => item.id === id);
	if (layer) Object.assign(layer.style, style);
}
</script>

<template>
	<div class="w-full overflow-auto">
		<DomSplitterPanel v-model:start-size="panelWidth" :min-start="160" :min-main="320" class="h-[360px]">
			<template #start>
				<aside class="h-full space-y-4 overflow-auto p-3">
					<DomDesignerLayers v-model="selected" :items="layers" />
					<template v-if="active">
						<DomTextInput v-model="active.text" label="Text" />
						<DomColorSwatch v-model="active.color" label="Text colour" />
					</template>
				</aside>
			</template>
			<template #default>
				<DomDesignerStage v-model="selected" positioning snapping class="relative h-full overflow-hidden bg-secondary" @style-change="applyStyle">
					<p v-for="layer in layers" :key="layer.id" :data-designer-id="layer.id" :style="{ ...layer.style, color: layer.color }" class="m-0 whitespace-pre-wrap p-2 font-semibold">{{ layer.text }}</p>
				</DomDesignerStage>
			</template>
		</DomSplitterPanel>
	</div>
</template>
