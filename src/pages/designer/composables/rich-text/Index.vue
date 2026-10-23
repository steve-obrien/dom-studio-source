<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import CodeBlock from '../../../_layout/CodeBlock.vue';
import PropsTable from '../../../_layout/PropsTable.vue';

const model = `<p>Some text <strong>bold one</strong> more text <strong>bold two</strong> final.</p>

flattenText(doc, paragraphId)
[
	{ text: 'Some text ',  run: 't1', stack: [] },
	{ text: 'bold one',    run: 't2', stack: [{ id: 'n1', tag: 'strong' }] },
	{ text: ' more text ', run: 't3', stack: [] },
	{ text: 'bold two',    run: 't4', stack: [{ id: 'n2', tag: 'strong' }] },
	{ text: ' final.',     run: 't5', stack: [] },
]`;
const usage = `import { markOperations } from '@getdom/studio/designer';

// Take bold off "bold two" (offsets 29 to 37 in the paragraph's text).
const { operations } = markOperations(doc, paragraphId, 29, 37, 'bold', { document });
session.run(operations.map(session.onFile));
// <p>Some text <strong>bold one</strong> more text bold two final.</p>`;
const pieces = `import { flattenText, marksAt, replaceRange, toggleMark } from '@getdom/studio/designer';

let pieces = flattenText(doc, paragraphId);
marksAt(pieces, 29, 37);                  // { bold: true, italic: false, ... }
pieces = toggleMark(pieces, 34, 37, 'italic');      // "two"
({ pieces } = replaceRange(pieces, 0, 4, 'More', { bold: true }));`;

const functions = [
	{ name: 'flattenText(doc, hostId)', type: 'TextPiece[]', description: 'A text element’s content as pieces. Offsets count across the whole element; a line break is one character.' },
	{ name: 'marksAt(pieces, start, end?)', type: 'marks', description: 'Which marks all the text in a range has. At a caret: the marks typing there would get, from the text before it.' },
	{ name: 'toggleMark(pieces, start, end, mark, on?)', type: 'TextPiece[]', description: 'Turns a mark on or off. By default on, unless all the text has it. New marks go inside the elements all the text shares, so one element wraps as much as it can.' },
	{ name: 'replaceRange(pieces, start, end, text, marks?)', type: '{ pieces, caret }', description: 'Typing, deleting and line breaks (\\n becomes <br>). New text takes the marks of the text before it, changed by marks ({ bold: true }).' },
	{ name: 'markOperations(doc, hostId, start, end, mark, options)', type: '{ operations, start, end }', description: 'Toggles a mark and returns document operations, and where the text is afterwards. Needs a DOM document to build in.' },
	{ name: 'markTags, inlineTags', type: 'constants', description: 'The elements each mark is written as (the first for new marks), and the elements that may sit inside edited text.' },
];
const rules = [
	{ name: 'Splitting', type: '', description: 'Taking a mark off the middle of an element splits it. Both halves keep its attributes, such as class or href, and the first keeps its id.' },
	{ name: 'Merging', type: '', description: 'Neighbouring marks of the same kind with the same attributes merge, as do neighbouring text runs.' },
	{ name: 'Ids', type: '', description: 'Text runs and elements keep their ids where they still hold the same text, so patched source keeps its formatting.' },
	{ name: 'Browser markup', type: '', description: 'Never decides the result. Styled spans and <b> from the browser are read as the marks they stand for.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Rich text model" eyebrow="Designer composable" tag="Beta" tagline="Marks and edits on a paragraph as plain data, shared by the stage and the code panel.">
			<DocSection title="What it does">
				<p class="text-muted-fg">Editors like ProseMirror keep their own model of the text and use the browser only to find out what the user means. This is that model for DOM Studio documents. A paragraph, heading or other text element is read as a flat list of pieces. Each piece is a stretch of text with the inline elements around it, outermost first. An edit, such as marking or unmarking a range, typing or deleting, changes the pieces. The pieces are then built back into elements and turned into document operations.</p>
				<CodeBlock :code="model" language="js" />
				<p class="text-muted-fg"><RouterLink to="/designer/composables/inline-text" class="text-primary">useInlineText</RouterLink> edits text on the stage with these functions. <RouterLink to="/designer/composables/code-sync" class="text-primary">useCodeSync</RouterLink> marks text selected in the code with them. A mark therefore means the same wherever it is made.</p>
			</DocSection>
			<DocSection title="Use it">
				<CodeBlock :code="usage" language="js" />
				<p class="text-muted-fg">Or work on the pieces directly:</p>
				<CodeBlock :code="pieces" language="js" />
			</DocSection>
			<DocSection title="API">
				<PropsTable title="Functions" :rows="functions" />
				<PropsTable title="How elements are kept" :rows="rules" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
