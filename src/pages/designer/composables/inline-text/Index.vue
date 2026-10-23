<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import PropsTable from '../../../_layout/PropsTable.vue';

const usage = `<script setup>
import { DomDesignerStage } from '@getdom/studio/vue';
import { DomEditorRender, useEditorSession, useInlineText } from '@getdom/studio/designer';

const session = useEditorSession({ workspace });
const { selected, doc, activeArtboard } = session;
const inline = useInlineText({ session, notify: (message) => toast(message) });
const { editing, editState, revisions } = inline;
<\/script>

<template>
	<DomDesignerStage v-model="selected" :editing="editing?.id || ''" @edit-text="inline.start(activeArtboard, $event)">
		<DomEditorRender :doc="doc" :types="types" :revisions="revisions" />
	</DomDesignerStage>
	<DomTypographyEditor v-model="textStyle" :marks="editing ? editState.marks : null" @mark="inline.toggle" />
</template>`;

const options = [
	{ name: 'session', type: 'EditorSession', default: '', description: 'The session the edited text is written to.' },
	{ name: 'view', type: '() => string', default: '', description: 'What is on screen; when it changes (another artboard or view), the edit ends.' },
	{ name: 'notify', type: '(message) => void', default: '', description: 'Says why some text cannot be edited in place, such as text bound to data.' },
];
const returns = [
	{ name: 'start(artboard, event)', type: 'function', description: 'Starts editing from a stage’s edit-text event (a double-click). The nearest text element is edited, so double-clicking a bold word edits its paragraph.' },
	{ name: 'finish()', type: 'function', description: 'Ends the edit and writes it to the document as one undo step. Enter, Escape and selecting something else also end it.' },
	{ name: 'toggle(mark)', type: 'function', description: 'Bold, italic, underline or strike on the selected words; at a caret, for the next text typed.' },
	{ name: 'editing', type: 'ShallowRef', description: 'The edit in progress, { board, file, id }, or null. Pass its id to the stage’s editing prop.' },
	{ name: 'editState', type: 'Ref', description: 'Where the selection falls, and its marks for a Text panel.' },
	{ name: 'editDoc', type: 'ShallowRef', description: 'The document as the edit would save it; useCodeSync shows it while you type.' },
	{ name: 'revisions', type: 'Ref<Record<string, number>>', description: 'Finished edits per layer. Pass to DomEditorRender so edited elements are drawn afresh.' },
];
const keys = [
	{ name: 'Typing', type: 'browser', description: 'Left to the browser inside a word, so input methods (Chinese, Japanese, Korean), spellcheck, autocorrect and phone keyboards work as usual.' },
	{ name: '⌘/Ctrl B, I, U', type: 'model', description: 'Toggle a mark on the selection, or for the next text typed at a caret.' },
	{ name: 'Shift+Enter', type: 'model', description: 'A line break (<br>) that keeps the marks around it.' },
	{ name: 'Paste, cut, drop', type: 'model', description: 'Plain text only, so no foreign markup reaches the file.' },
	{ name: 'Delete, type over a selection', type: 'model', description: 'Across elements, made on the model. Typing takes the marks of the text before it.' },
	{ name: '⌘/Ctrl Z, ⇧⌘Z', type: 'model', description: 'Undo and redo inside the edit; after it ends, the session’s history has it as one step.' },
	{ name: 'Enter, Escape', type: '', description: 'End the edit.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="useInlineText" eyebrow="Designer composable" tag="Beta" tagline="Double-click text on the stage and edit it where it is, with marks, as one undo step.">
			<DocSection title="What it does">
				<p class="text-muted-fg">The double-clicked text element becomes editable in place. The document stays the model. The browser’s editing only tells the editor what you mean:</p>
				<ul class="list-disc space-y-1 pl-5 text-muted-fg">
					<li>Typing inside a word is left to the browser.</li>
					<li>Everything that changes structure is made on the <RouterLink to="/designer/composables/rich-text" class="text-primary">rich text model</RouterLink>, and the element is drawn again from it. That covers marks, line breaks, paste and deletes across elements.</li>
				</ul>
				<p class="text-muted-fg">Browsers write formatting their own way, such as styled spans or <code>&lt;b&gt;</code>. This way, a mark always comes out as <code>&lt;strong&gt;</code>, <code>&lt;em&gt;</code>, <code>&lt;u&gt;</code> or <code>&lt;s&gt;</code>, the same as in the code panel. Text runs keep their ids, so the file keeps its formatting.</p>
				<p class="text-muted-fg">Text bound to data (<code v-pre>{{ item.title }}</code>) and elements that mix text with components are not edited this way. Use the Data panel and the inspector for those.</p>
			</DocSection>
			<DocSection title="Use it">
				<CodeBlock :code="usage" language="vue" />
			</DocSection>
			<DocSection title="API">
				<PropsTable title="Options" :rows="options" />
				<PropsTable title="Returns" :rows="returns" />
				<PropsTable title="Keys and edits (type: who makes the edit)" :rows="keys" />
			</DocSection>
			<DocSection title="Related">
				<p class="text-muted-fg">Pass it to <RouterLink to="/designer/composables/code-sync" class="text-primary">useCodeSync</RouterLink> to see the text in the code as it is typed. <RouterLink to="/designer/composables" class="text-primary">All composables →</RouterLink></p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
