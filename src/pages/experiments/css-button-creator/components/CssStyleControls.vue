<script setup>
import { reactive } from 'vue';
import CssBackgroundControl from './CssBackgroundControl.vue';
import CssBorderControl from './CssBorderControl.vue';
import CssBoxShadowControl from './CssBoxShadowControl.vue';
import CssLayoutControl from './CssLayoutControl.vue';
import DomTypographyEditor from '../../../designer/typography-editor/DomTypographyEditor.vue';
import { buttonTypography, setButtonTypography } from '../lib/styleModel.js';

defineProps({
	button: {
		type: Object,
		required: true,
	},
	shadows: {
		type: Array,
		required: true,
	},
	stateLabel: {
		type: String,
		default: 'Current',
	},
});

const sectionOpen = reactive({
	layout: true,
	typography: true,
	border: true,
	background: true,
	shadows: true,
});
</script>

<template>
	<div class="contents">
		<CssLayoutControl v-model="sectionOpen.layout" :layout="button.layout" />
		<DomTypographyEditor title="Typography" :model-value="buttonTypography(button.typography)" @update:model-value="setButtonTypography(button.typography, $event)" />
		<CssBorderControl v-model="sectionOpen.border" :border="button.border" />
		<CssBackgroundControl v-model="sectionOpen.background" :background="button.background" />
		<CssBoxShadowControl v-model="sectionOpen.shadows" :shadows="shadows" :title="`${stateLabel} box shadows`" />
	</div>
</template>
