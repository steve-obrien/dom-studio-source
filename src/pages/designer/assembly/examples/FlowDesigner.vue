<script setup>
import { onMounted, ref, useId } from 'vue';
import { VueFlow, addEdge } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { DomButton } from '../../../lib/vue';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

const id = useId();
const ready = ref(false);
const graph = ref(null);
const nodes = ref([
	{ id: 'idea', label: 'An idea', position: { x: 0, y: 0 } },
	{ id: 'draft', label: 'First draft', position: { x: 230, y: 130 } },
]);
const edges = ref([]);

/** Defers the interactive viewport until browser hydration is complete. */
function mount() { ready.value = true; }
onMounted(mount);
/** Captures the instance belonging to this particular editor. */
function init(instance) { graph.value = instance; }
/** Stores new connections in application state, suppressing duplicates. */
function connect(connection) { edges.value = addEdge(connection, edges.value); }
</script>

<template>
	<div class="w-full">
		<div class="mb-3 flex gap-2">
			<DomButton size="sm" :disabled="!graph" @click="graph.zoomOut()">Zoom out</DomButton>
			<DomButton size="sm" :disabled="!graph" @click="graph.zoomIn()">Zoom in</DomButton>
			<DomButton size="sm" :disabled="!graph" @click="graph.fitView()">Fit</DomButton>
		</div>
		<div class="h-[320px] rounded-xl border border-border">
			<VueFlow v-if="ready" :id="id" v-model:nodes="nodes" v-model:edges="edges" fit-view-on-init :min-zoom="0.1" :max-zoom="3" @init="init" @connect="connect">
				<Background pattern-color="var(--border)" />
			</VueFlow>
		</div>
	</div>
</template>
