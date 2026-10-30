<script setup>
import { DomButton, DomTooltip } from '@getdom/studio/vue';
</script>

<template>
	<DomButton id="save-button" variant="secondary">
		Save
	</DomButton>
	<DomTooltip
		for="save-button"
		text="Save your changes"
		placement="top"
	/>
</template>
