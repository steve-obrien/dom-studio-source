<script setup>
import { ref } from 'vue';
import { DomDialog, DomButton } from '@getdom/studio/vue';

const dialogRef = ref(null);
</script>

<template>
	<div class="flex flex-wrap items-center justify-center gap-2">
		<DomButton @click="dialogRef?.open()">Open</DomButton>
		<DomButton variant="secondary" @click="dialogRef?.close()">Close</DomButton>
		<DomButton variant="ghost" @click="dialogRef?.toggle()">Toggle</DomButton>
	</div>
	<DomDialog
		ref="dialogRef"
		title="Programmatic control"
		description="No trigger slot — open from script via the component ref."
	>
		<p class="text-sm text-muted-fg">
			Call <code class="text-canvas-fg">open()</code>, <code class="text-canvas-fg">close()</code>, or
			<code class="text-canvas-fg">toggle()</code> on the ref, or bind <code class="text-canvas-fg">v-model</code>.
		</p>
		<template #footer>
			<DomButton variant="secondary" data-close>Done</DomButton>
		</template>
	</DomDialog>
</template>
