<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import PropsTable from '../../../_layout/PropsTable.vue';

const usage = `<script setup>
import { ref } from 'vue';
import { DomCodePanel, DomMonacoCodeView, useCodeSync, useEditorSession, useInlineText } from '@getdom/studio/designer';

const session = useEditorSession({ workspace });
const inline = useInlineText({ session });
const stage = ref(null);
const codeSync = useCodeSync({
	session,
	inline,
	// Where a node is rendered, to highlight letters selected in the code.
	element: (id) => stage.value?.$el.querySelector(\`[data-designer-id="\${id}"]\`),
});
<\/script>

<template>
	<DomCodePanel :sync="codeSync" label="Page.vue source" />
	<!-- Or with Monaco: :editor="DomMonacoCodeView" :editor-props="{ load }" -->
</template>`;
const ownView = `<MyCodeView
	:model-value="codeSync.text.value"
	:highlight="codeSync.highlight.value"
	@update:model-value="codeSync.edit"
	@cursor="codeSync.selectLine"
	@select="codeSync.selectText"
	@focus="codeSync.enter"
	@blur="codeSync.leave"
/>`;

const options = [
	{ name: 'session', type: 'EditorSession', default: '', description: 'The session whose active file the code shows.' },
	{ name: 'inline', type: 'InlineText', default: 'null', description: 'In-place text editing. Text typed on the stage shows in the code as it is typed, with the caret.' },
	{ name: 'element', type: '(id) => Element', default: '', description: 'A node’s rendered element, to highlight letters selected in the code.' },
	{ name: 'isStudioComponent', type: '(tag) => boolean', default: '() => false', description: 'Tags that get an import line in new files.' },
	{ name: 'open', type: 'Ref<boolean>', default: 'ref(true)', description: 'Whether the code is shown; closing it drops a typed draft.' },
];
const returns = [
	{ name: 'text', type: 'ComputedRef<string>', description: 'What the code view shows: the typed draft, else the exported source.' },
	{ name: 'source', type: 'ComputedRef<string>', description: 'The exported source of the active file, for Copy, Download or Save.' },
	{ name: 'highlight', type: 'ComputedRef', description: 'The selected node’s lines, with the caret and selection of an in-place edit.' },
	{ name: 'error, warning', type: 'Ref<string>', description: 'Why typed code does not parse, or what was left out of it.' },
	{ name: 'marks', type: 'ComputedRef', description: 'Which marks the text selected in the code has, for B/I/U/S toggles; null when no text is selected.' },
	{ name: 'edit(value)', type: 'function', description: 'Typing: kept as a draft and parsed into the document after a pause. Ids survive where the structure matches.' },
	{ name: 'apply()', type: 'function', description: 'Parses the draft now.' },
	{ name: 'selectLine(line)', type: 'function', description: 'Selects the element on a one-based line.' },
	{ name: 'selectText({ start, end })', type: 'function', description: 'The code’s selection as source offsets, highlighted on the stage.' },
	{ name: 'mark(name)', type: 'function', description: 'Bold, italic, underline or strike on the text selected in the code, made the same way as on the stage.' },
	{ name: 'enter(), leave()', type: 'function', description: 'Focus and blur: entering ends an in-place edit, leaving applies the draft.' },
	{ name: 'reset(), forgetMarks()', type: 'function', description: 'Drop the draft; forget the code’s text selection.' },
];
const panelProps = [
	{ name: 'sync', type: 'CodeSync', default: '', description: 'What useCodeSync returns.' },
	{ name: 'editor', type: 'Component', default: 'DomCodeView', description: 'A code view such as DomMonacoCodeView.' },
	{ name: 'editorProps', type: 'object', default: '{}', description: 'Props for the editor, such as Monaco’s load.' },
	{ name: 'label', type: 'string', default: 'Source', description: 'Accessible name of the code.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="useCodeSync" eyebrow="Designer composable" tag="Beta" tagline="The Vue source of the document, edited both ways and kept in step with the stage.">
			<DocSection title="What it does">
				<p class="text-muted-fg">The code is exported from the same tree the stage renders, with each node’s lines and character offsets. Typing in the code is parsed back into that tree, so the stage, the layers and the inspector follow. Selections follow each other too:</p>
				<ul class="list-disc space-y-1 pl-5 text-muted-fg">
					<li>a line in the code selects its element</li>
					<li>a selected element highlights its lines</li>
					<li>letters selected in the code are highlighted on the stage</li>
					<li>an in-place text edit moves the code’s caret as you type</li>
				</ul>
				<p class="text-muted-fg">Code sync is optional. An editor without it leaves it out.</p>
			</DocSection>
			<DocSection title="Use it">
				<CodeBlock :code="usage" language="vue" />
				<p class="text-muted-fg">DomCodePanel is the code and its parse messages; put a header or actions around it as your app needs. Any code view that has these props and events works too:</p>
				<CodeBlock :code="ownView" language="vue" />
			</DocSection>
			<DocSection title="API">
				<PropsTable title="Options" :rows="options" />
				<PropsTable title="Returns" :rows="returns" />
				<PropsTable title="DomCodePanel props" :rows="panelProps" />
			</DocSection>
			<DocSection title="Related">
				<p class="text-muted-fg">Marks use the <RouterLink to="/designer/composables/rich-text" class="text-primary">rich text model</RouterLink>, the same as <RouterLink to="/designer/composables/inline-text" class="text-primary">useInlineText</RouterLink>. <RouterLink to="/designer/composables" class="text-primary">All composables →</RouterLink></p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
