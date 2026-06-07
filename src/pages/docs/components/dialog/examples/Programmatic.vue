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
		<p class="text-sm text-muted-foreground">
			Call <code class="text-foreground">open()</code>, <code class="text-foreground">close()</code>, or
			<code class="text-foreground">toggle()</code> on the ref, or bind <code class="text-foreground">v-model</code>.
		</p>
		<template #footer>
			<DomButton variant="secondary" data-close>Done</DomButton>
		</template>
	</DomDialog>
</template>
