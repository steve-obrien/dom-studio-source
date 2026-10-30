<script setup>
import { DomFontPicker } from '@getdom/studio/vue';
import { computed, ref } from 'vue';

const family = ref('Lato');
const sampleStyle = computed(getSampleStyle);

/**
 * Build the demonstration font stack from the selected family.
 *
 * @returns {Record<string, string>} Inline style for the preview sentence.
 */
function getSampleStyle() {
	const escapedFamily = family.value.replace(/[\\']/g, '\\$&');
	return { fontFamily: `'${escapedFamily}', sans-serif` };
}
</script>

<template>
	<div class="grid w-full max-w-lg gap-4">
		<DomFontPicker
			v-model="family"
			label="Font family"
			description="Type a family such as Lato. Only visible previews are requested."
			placeholder="Search Google Fonts"
		/>
		<div class="rounded-2xl border border-border bg-secondary/40 p-5">
			<p class="text-xs font-medium uppercase tracking-wide text-muted-fg">Selected family</p>
			<p class="mt-2 text-2xl text-canvas-fg" :style="sampleStyle">{{ family || 'Choose a font' }}</p>
		</div>
	</div>
</template>
