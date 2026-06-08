<script setup>
import { ref } from 'vue';
import { DomDrawer, DomButton } from '@getdom/studio/vue';

const drawerRef = ref(null);
</script>

<template>
	<div class="flex flex-wrap items-center justify-center gap-2">
		<DomButton @click="drawerRef?.open()">Open</DomButton>
		<DomButton variant="secondary" @click="drawerRef?.close()">Close</DomButton>
		<DomButton variant="ghost" @click="drawerRef?.toggle()">Toggle</DomButton>
	</div>
	<DomDrawer ref="drawerRef" title="Via template ref">
		<p class="p-4 text-sm text-muted-foreground">
			Call <code class="text-foreground">open()</code>, <code class="text-foreground">close()</code>, or
			<code class="text-foreground">toggle()</code> on the component ref — or bind <code class="text-foreground">v-model</code> from script.
		</p>
	</DomDrawer>
</template>
