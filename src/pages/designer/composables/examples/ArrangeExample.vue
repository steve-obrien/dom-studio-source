<script setup>
import { onMounted, ref } from 'vue';
import { DomButton, DomDesignerStage } from '../../../lib/vue';
import { DomEditorRender, createComponentCatalog, createEditorTypes, createWorkspace, useEditorSession, useLayoutGeometry } from '../../../lib/designer';

const source = `<template>
<div class="relative h-64 bg-secondary/40">
	<div class="absolute left-[24px] top-[32px] grid h-12 w-16 place-items-center rounded-lg bg-primary text-primary-fg">A</div>
	<div class="absolute left-[140px] top-[120px] grid h-20 w-14 place-items-center rounded-lg bg-primary text-primary-fg">B</div>
	<div class="absolute left-[300px] top-[64px] grid h-14 w-24 place-items-center rounded-lg bg-primary text-primary-fg">C</div>
</div>
</template>`;
// Ids are counted, so a page rendered on the server matches when it hydrates.
let next = 0;
const session = useEditorSession({
	workspace: createWorkspace([{ name: 'Boxes.vue', source }], { widths: [480], makeId: () => `box${next++}` }),
	afterChange: () => layout.refresh(),
});
const { selected, selection, selectedIds, doc, historySize, undo, redo } = session;
const types = createEditorTypes(createComponentCatalog([]));

// Measures layers on the stage and moves them through the session.
const stage = ref(null);
const layout = useLayoutGeometry({ session, element: (id) => stage.value?.$el.querySelector(`[data-designer-id="${id}"]`) || null });
const { detected, canArrange, selectedNodes } = layout;
onMounted(() => layout.refresh());

const alignments = [['left', 'Left'], ['center', 'Centre'], ['right', 'Right'], ['top', 'Top'], ['middle', 'Middle'], ['bottom', 'Bottom']];
</script>

<template>
	<div class="min-w-0 overflow-hidden rounded-xl border border-border">
		<div class="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1.5">
			<DomButton v-for="[name, label] in alignments" :key="name" size="sm" variant="ghost" :disabled="!canArrange" @click="layout.align(name)">{{ label }}</DomButton>
			<DomButton size="sm" variant="ghost" :disabled="!canArrange || selectedNodes.length < 3" @click="layout.distribute('horizontal')">Distribute</DomButton>
			<span class="flex-1"></span>
			<DomButton size="sm" variant="ghost" :disabled="!historySize.undo" @click="undo">Undo</DomButton>
			<DomButton size="sm" variant="ghost" :disabled="!historySize.redo" @click="redo">Redo</DomButton>
		</div>
		<DomDesignerStage ref="stage" v-model="selected" v-model:selection="selection" positioning frame-scoped snapping @style-change="layout.patch">
			<DomEditorRender :doc="doc" :types="types" :detected="detected" />
		</DomDesignerStage>
		<p class="border-t border-border px-3 py-2 text-xs text-muted-fg">{{ selectedIds.length ? `${selectedIds.length} selected.` : 'Click a box.' }} Shift-click to select several, then align them or drag them together.</p>
	</div>
</template>
