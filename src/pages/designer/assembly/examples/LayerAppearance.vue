<script setup>
import { computed, ref } from 'vue';
import { DomBorderEditor, DomShadowEditor, DomBackgroundEditor, DomBackdropEditor, createDesignerBorder, borderToCss, shadowListToCss, createBackgroundState, backgroundImageToCss, createBackdrop, backdropToCss } from '../../../lib/vue';

const border = ref(createDesignerBorder());
const shadows = ref([]);
const background = ref(createBackgroundState({}, { allowEmpty: true }));
const backdrop = ref(createBackdrop());
const style = computed(() => ({
	border: borderToCss(border.value),
	boxShadow: shadowListToCss(shadows.value),
	backgroundImage: backgroundImageToCss(background.value),
	backdropFilter: backdropToCss(backdrop.value),
	WebkitBackdropFilter: backdropToCss(backdrop.value),
}));
</script>

<template>
	<div class="grid w-full gap-6 md:grid-cols-2">
		<div class="max-h-[400px] overflow-auto">
			<DomBorderEditor v-model="border" />
			<DomShadowEditor v-model="shadows" />
			<DomBackgroundEditor v-model="background" />
			<DomBackdropEditor v-model="backdrop" />
		</div>
		<div class="relative grid min-h-64 place-items-center overflow-hidden rounded-xl bg-secondary p-6">
			<p class="absolute inset-x-4 top-12 text-4xl font-bold text-primary">Behind the layer</p>
			<div :style="style" class="relative rounded-xl bg-canvas/60 p-8 text-center font-semibold">Your HTML layer</div>
		</div>
	</div>
</template>
