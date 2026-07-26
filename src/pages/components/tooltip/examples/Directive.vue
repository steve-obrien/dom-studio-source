<script setup>
import { DomButton, vDomTooltip } from '@getdom/studio/vue';

const tooltip = 'No wrapper element is added';
</script>

<template>
	<DomButton
		v-dom-tooltip.right="tooltip"
		variant="secondary"
	>
		Directive target
	</DomButton>
</template>
