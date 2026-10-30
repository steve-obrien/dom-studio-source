<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { VueFlow, Handle, Position, MarkerType, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { DomButton, DomSplitterPanel, DomTextInput, DomTextareaInput } from '../../lib/vue';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';

const ready = ref(false);
const showInspector = ref(false);
const board = ref(null);
const panelWidth = ref(260);
const notice = ref('Edits stay in this tab. Export JSON before leaving.');
let nextId = 5;
const nodes = ref([
	{ id: '1', type: 'step', position: { x: 60, y: 80 }, data: { label: 'An idea arrives', detail: 'Capture a new idea for the next campaign.' } },
	{ id: '2', type: 'step', position: { x: 380, y: 80 }, data: { label: 'Create a draft', detail: 'Turn the idea into a first version.' } },
	{ id: '3', type: 'step', position: { x: 700, y: -40 }, data: { label: 'Review together', detail: 'Gather feedback and refine the details.' } },
	{ id: '4', type: 'step', position: { x: 700, y: 210 }, data: { label: 'Ready to share', detail: 'Publish something worth sharing.' } },
]);
const edges = ref([
	{ id: '1-2', source: '1', target: '2' },
	{ id: '2-3', source: '2', target: '3' },
	{ id: '3-4', source: '3', target: '4' },
]);
const { addEdges, addNodes, removeNodes, removeEdges, findNode, addSelectedNodes, removeSelectedElements, screenToFlowCoordinate, fitView, toObject } = useVueFlow('designer-flowchart');
const selectedNode = computed(() => nodes.value.find((node) => node.selected));
const selectedEdge = computed(() => edges.value.find((edge) => edge.selected));
const edgeDefaults = { type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--muted-fg)' }, style: { stroke: 'var(--muted-fg)', strokeWidth: 2 } };

/** Mounts the browser-only graph after SSR hydration. */
function mount() { ready.value = true; }
onMounted(mount);

/** Selects a node from the sidebar using the same selection state as the stage. */
function selectNode(id) {
	removeSelectedElements();
	const node = findNode(id);
	if (node) addSelectedNodes([node]);
}

/** Adds a step near the visible viewport centre, in graph coordinates. */
async function addStep() {
	await revealStage();
	const bounds = board.value.getBoundingClientRect();
	const position = screenToFlowCoordinate({ x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 });
	position.x -= 110;
	position.y -= 50;
	const id = String(nextId++);
	addNodes([{ id, type: 'step', position, data: { label: 'New step', detail: 'Describe what happens here.' } }]);
	selectNode(id);
}

/** Reveals the mobile stage and allows its viewport measurement to catch up. */
async function revealStage() {
	showInspector.value = false;
	await nextTick();
	await new Promise(requestAnimationFrame);
}

/** Fits all nodes after revealing the stage when the mobile inspector was open. */
async function fitGraph() {
	await revealStage();
	fitView({ padding: 0.2 });
}

/** Adds an arrow between two distinct nodes; Vue Flow suppresses duplicate connections. */
function connect(connection) {
	if (connection.source !== connection.target) addEdges([connection]);
}

/** Deletes the selected node and its connections, or the selected connection alone. */
function removeSelection() {
	if (selectedNode.value) removeNodes([selectedNode.value.id]);
	else if (selectedEdge.value) removeEdges([selectedEdge.value.id]);
}

/** Saves graph data and viewport position as a portable JSON document. */
function exportGraph() {
	const url = URL.createObjectURL(new Blob([JSON.stringify(toObject(), null, '\t')], { type: 'application/json' }));
	const link = document.createElement('a');
	link.href = url;
	link.download = 'dom-studio-flowchart.json';
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
	notice.value = 'Flowchart exported as JSON.';
}
</script>

<template>
	<main class="flowchart flex h-dvh min-h-0 flex-col bg-canvas text-fg">
		<header class="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-3">
			<RouterLink to="/designer" class="text-sm text-muted-fg">← UI designer</RouterLink><RouterLink to="/designer/assembly#flowchart" class="text-sm text-primary underline underline-offset-4">Assembly guide</RouterLink>
			<h1 class="text-sm font-semibold">Flowchart designer</h1>
			<span class="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Beta</span>
			<div class="ml-auto flex gap-2">
				<DomButton size="sm" variant="outline" :disabled="!ready" @click="addStep">+ Step</DomButton>
				<DomButton size="sm" variant="outline" :disabled="!ready" @click="fitGraph">Fit</DomButton>
				<DomButton size="sm" variant="outline" :disabled="!ready" @click="exportGraph">Export JSON</DomButton>
				<DomButton size="sm" variant="outline" class="lg:hidden" :aria-pressed="showInspector" @click="showInspector = !showInspector">{{ showInspector ? 'Stage' : 'Inspector' }}</DomButton>
			</div>
		</header>
		<DomSplitterPanel v-model:start-size="panelWidth" :min-start="220" :min-main="280" class="flow-panels min-h-0 flex-1" :data-inspector="showInspector">
			<template #start>
				<aside class="h-full overflow-auto border-r border-border p-4" aria-label="Flowchart inspector">
					<h2 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-fg">Steps</h2>
					<div class="mb-6 space-y-1">
						<button v-for="node in nodes" :key="node.id" type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring" :class="node.selected ? 'bg-primary/10 text-primary' : ''" :aria-pressed="Boolean(node.selected)" @click="selectNode(node.id)">{{ node.data.label }}</button>
					</div>
					<div v-if="selectedNode" class="space-y-4">
						<DomTextInput v-model="selectedNode.data.label" label="Step name" />
						<DomTextareaInput v-model="selectedNode.data.detail" label="Description" />
					</div>
					<p v-else class="text-sm leading-6 text-muted-fg">{{ selectedEdge ? 'Connection selected.' : 'Select a step to edit its name and description.' }}</p>
					<DomButton v-if="selectedNode || selectedEdge" size="sm" variant="outline" class="mt-4" @click="removeSelection">Delete {{ selectedNode ? 'step' : 'connection' }}</DomButton>
					<p class="mt-6 text-xs leading-5 text-muted-fg">Drag a step to move it. Drag between the dots to connect steps. Drag empty space to pan; scroll or pinch to zoom. Select a connection to delete it.</p>
					<p class="mt-4 text-xs leading-5 text-muted-fg">Powered by <a href="https://vueflow.dev/" target="_blank" rel="noopener noreferrer" class="underline">Vue Flow</a>. An open-ended workspace with HTML nodes and SVG connections.</p>
				</aside>
			</template>
			<template #default>
				<div ref="board" class="h-full min-h-0" aria-label="Flowchart stage">
					<VueFlow v-if="ready" id="designer-flowchart" v-model:nodes="nodes" v-model:edges="edges" :default-edge-options="edgeDefaults" :min-zoom="0.1" :max-zoom="3" fit-view-on-init :delete-key-code="null" @connect="connect">
						<Background :gap="24" :size="1" pattern-color="var(--border)" />
						<Controls position="bottom-left" :show-interactive="false">
							<template #icon-zoom-in><span aria-hidden="true">+</span><span class="sr-only">Zoom in</span></template>
							<template #icon-zoom-out><span aria-hidden="true">−</span><span class="sr-only">Zoom out</span></template>
							<template #icon-fit-view><span aria-hidden="true">⛶</span><span class="sr-only">Fit flowchart</span></template>
						</Controls>
						<MiniMap class="hidden sm:block" pannable zoomable node-color="var(--primary)" mask-color="var(--secondary)" />
						<template #node-step="{ data, selected }">
							<div class="w-[220px] rounded-xl border bg-canvas p-4 text-fg shadow-sm" :class="selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'">
								<Handle type="target" :position="Position.Left" aria-label="Input connection" />
								<div class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">Step</div>
								<h2 class="break-words text-sm font-semibold">{{ data.label }}</h2>
								<p class="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-muted-fg">{{ data.detail }}</p>
								<Handle type="source" :position="Position.Right" aria-label="Output connection" />
							</div>
						</template>
					</VueFlow>
				</div>
			</template>
		</DomSplitterPanel>
		<footer class="shrink-0 border-t border-border px-4 py-2 text-xs text-muted-fg" role="status">{{ notice }}</footer>
	</main>
</template>

<style scoped>
.flowchart :deep(.vue-flow__handle) { width: 10px; height: 10px; border: 2px solid var(--canvas); background: var(--primary); }
.flowchart :deep(.vue-flow__connection-path) { stroke: var(--primary); }
.flowchart :deep(.vue-flow__edge.selected .vue-flow__edge-path) { stroke: var(--primary) !important; }
.flowchart :deep(.vue-flow__controls-button) { background: var(--canvas); color: var(--fg); fill: currentColor; border-color: var(--border); }
.flowchart :deep(.vue-flow__controls-button:hover) { background: var(--secondary); }
.flowchart :deep(.vue-flow__minimap) { background: var(--canvas); border: 1px solid var(--border); }
/* Preserve a full-width stage on small screens; the inspector is an explicit tab. */
@media (max-width: 1023px) {
	.flow-panels { display: block; min-width: 0 !important; }
	.flow-panels :deep(> button), .flow-panels :deep(> section:first-child) { display: none; }
	.flow-panels :deep(> section) { height: 100%; }
	.flow-panels[data-inspector="true"] :deep(> section:first-child) { display: block; }
	.flow-panels[data-inspector="true"] :deep(> section:last-child) { display: none; }
}
</style>
