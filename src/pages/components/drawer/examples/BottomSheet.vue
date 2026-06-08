<script setup>
import { ref } from 'vue';
import { DomButton, DomDrawer } from '@getdom/studio/vue';

const open = ref(false);
</script>

<template>
	<DomButton variant="secondary" @click="open = true">Open bottom drawer</DomButton>
	<DomDrawer
		v-model="open"
		side="bottom"
		title="Quick actions"
		width="100%"
	>
		<div class="grid gap-3 p-4 sm:grid-cols-3">
			<DomButton variant="secondary" class="justify-center">Duplicate</DomButton>
			<DomButton variant="secondary" class="justify-center">Share</DomButton>
			<DomButton class="justify-center" data-close>Done</DomButton>
		</div>
	</DomDrawer>
</template>
