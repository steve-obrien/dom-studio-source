<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import PropsTable from '../../../_layout/PropsTable.vue';

const usage = `import { createWorkspace, useEditorSession } from '@getdom/studio/designer';

const session = useEditorSession({
	workspace: createWorkspace([{ name: 'Page.vue', source }]),
	onChange: () => save(session.workspace.value),
});
const { selected, doc, onFile, run, undo, redo } = session;

// Every edit is an operation; this is one undo step.
run(onFile({ op: 'setProp', id: selected.value, key: 'class', value: 'text-2xl' }));

// Continuous input, such as typing or dragging, merges into one step.
run(onFile({ op: 'setText', id: textId, value }), { merge: \`text:\${textId}\` });`;

const options = [
	{ name: 'workspace', type: 'DesignerWorkspace', default: '', description: 'The files and artboards to start with, such as createWorkspace(sources) or a saved workspace.' },
	{ name: 'onChange', type: '() => void', default: '', description: 'Called after every change, undo and redo. Save or recompile styles here.' },
	{ name: 'afterChange', type: '() => void', default: '', description: 'Called after run, undo and redo, once the selection has been checked. Re-measure the stage here.' },
	{ name: 'onError', type: '(message) => void', default: '', description: 'An operation that could not apply. Nothing is changed when one fails.' },
];
const returns = [
	{ name: 'workspace', type: 'Ref<DesignerWorkspace>', description: 'Files and artboards. Change them only through run.' },
	{ name: 'activeArtboardId', type: 'Ref<string>', description: 'The artboard being worked on; its file is the active file.' },
	{ name: 'selected', type: 'Ref<string>', description: 'Id of the selected node, the one the inspector edits. Bind it to a stage, the layers and the inspector.' },
	{ name: 'selection', type: 'Ref<string[]>', description: 'Every selected id when several are chosen. Bind it as v-model:selection on the stage and v-model:values on the layers for Shift-click. Setting selected to a node outside it starts a new selection.' },
	{ name: 'selectedIds', type: 'ComputedRef<string[]>', description: 'Every selected id, the primary one included, without ids that no longer exist.' },
	{ name: 'artboards, activeArtboard', type: 'ComputedRef', description: 'All artboards, and the active one.' },
	{ name: 'activeFile, doc', type: 'ComputedRef', description: 'The active file and its document: a flat map of nodes by id.' },
	{ name: 'active, parent', type: 'ComputedRef', description: 'The selected node and its parent.' },
	{ name: 'run(operations, options?)', type: 'function', description: 'Applies operations as one undo step. With { merge: key }, steps with the same key in quick succession become one.' },
	{ name: 'undo(), redo()', type: 'function', description: 'Step through the history.' },
	{ name: 'historySize', type: 'Ref<{ undo, redo }>', description: 'How many steps there are, for enabling buttons.' },
	{ name: 'history', type: 'EditorHistory', description: 'The history itself; seal() ends a merge so the next change is a new step.' },
	{ name: 'onFile(operation)', type: 'function', description: 'Tags a document operation with the active file.' },
	{ name: 'fileById(id)', type: 'function', description: 'Finds a file in the workspace.' },
];
const operations = [
	{ name: 'setProp', type: '{ id, key, value }', description: 'Sets an attribute or component prop.' },
	{ name: 'setText', type: '{ id, value }', description: 'Sets a text run.' },
	{ name: 'setField', type: '{ id, key, value }', description: 'Sets another node field: style, layout, placements, label, locked, hidden.' },
	{ name: 'insert, remove, move', type: '{ parent, index, fragment } …', description: 'Changes the tree. Fragments come from fromTree or copySubtree.' },
	{ name: 'setFile, setArtboard', type: '{ id, key, value }', description: 'Workspace operations, without onFile: a file’s source or name, an artboard’s size or place.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="useEditorSession" eyebrow="Designer composable" tag="Beta" tagline="One document, one selection and one undo history for every part of an editor.">
			<DocSection title="What it does">
				<p class="text-muted-fg">A session holds a workspace of Vue or HTML files and the artboards that show them. Each file is an editor document: a flat map of nodes by id. Nothing edits the document directly. Every change is an operation with an inverse, applied through <code>run</code>, so undo works for every part of the editor. The stage, the layers, the code panel and in-place text editing all take the same session, so they always show the same tree.</p>
			</DocSection>
			<DocSection title="Use it">
				<CodeBlock :code="usage" language="js" />
			</DocSection>
			<DocSection title="API">
				<PropsTable title="Options" :rows="options" />
				<PropsTable title="Returns" :rows="returns" />
				<PropsTable title="Document operations" :rows="operations" />
			</DocSection>
			<DocSection title="Related">
				<p class="text-muted-fg"><RouterLink to="/designer/composables/code-sync" class="text-primary">useCodeSync</RouterLink> and <RouterLink to="/designer/composables/inline-text" class="text-primary">useInlineText</RouterLink> take a session. <RouterLink to="/designer/composables" class="text-primary">All composables →</RouterLink></p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
