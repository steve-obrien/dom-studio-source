<script setup>
import { ref } from 'vue';
import { DomButton, DomDesignerStage } from '../../../lib/vue';
import { DomCodePanel, DomEditorRender, createComponentCatalog, createEditorTypes, createWorkspace, useCodeSync, useEditorSession, useInlineText } from '../../../lib/designer';

// One session holds the document; every part below reads and writes through it.
const source = '<template>\n<article class="space-y-3 p-6">\n\t<h2 class="text-xl font-semibold">Release notes</h2>\n\t<p>Double-click this text, select a few words and press <strong>Bold</strong>. Or edit the code.</p>\n</article>\n</template>';
// Ids are counted, so a page rendered on the server matches when it hydrates.
let next = 0;
const session = useEditorSession({
	workspace: createWorkspace([{ name: 'Note.vue', source }], { widths: [600], makeId: () => `note${next++}` }),
});
const { selected, doc, activeArtboard, historySize, undo, redo } = session;
const types = createEditorTypes(createComponentCatalog([]));

// Double-click text on the stage to edit it in place.
const inline = useInlineText({ session });
const { editing, editState, revisions } = inline;

// The code of the same document, in sync both ways.
const stage = ref(null);
const codeSync = useCodeSync({ session, inline, element: (id) => stage.value?.$el.querySelector(`[data-designer-id="${id}"]`) || null });

const marks = [['bold', 'B'], ['italic', 'I'], ['underline', 'U'], ['strike', 'S']];
/** Marks the words selected on the stage while editing, else the text selected in the code. */
function mark(name) {
	if (editing.value) inline.toggle(name);
	else codeSync.mark(name);
}
function active(name) {
	return Boolean(editing.value ? editState.value.marks?.[name] : codeSync.marks.value?.[name]);
}
</script>

<template>
	<div class="grid gap-4 lg:grid-cols-2">
		<div class="min-w-0 overflow-hidden rounded-xl border border-border">
			<div class="flex items-center gap-1 border-b border-border px-2 py-1.5">
				<DomButton v-for="[name, label] in marks" :key="name" size="sm" :variant="active(name) ? 'primary' : 'ghost'" :aria-label="name" :aria-pressed="active(name)" @mousedown.prevent @click="mark(name)">{{ label }}</DomButton>
				<span class="flex-1"></span>
				<DomButton size="sm" variant="ghost" :disabled="!historySize.undo" @click="undo">Undo</DomButton>
				<DomButton size="sm" variant="ghost" :disabled="!historySize.redo" @click="redo">Redo</DomButton>
			</div>
			<DomDesignerStage ref="stage" v-model="selected" :editing="editing?.id || ''" class="min-h-48" @edit-text="inline.start(activeArtboard, $event)">
				<DomEditorRender :doc="doc" :types="types" :revisions="revisions" />
			</DomDesignerStage>
		</div>
		<DomCodePanel :sync="codeSync" label="Note.vue source" class="h-72 overflow-hidden rounded-xl border border-border" />
	</div>
</template>
