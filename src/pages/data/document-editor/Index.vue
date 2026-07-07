<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodePanel from '../../_layout/docs/CodePanel.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import DomDocumentEditor from './DomDocumentEditor.vue';
import DomDocumentEditorSrc from './DomDocumentEditor.vue?raw';
import DomWysiwyg from '../../forms/wysiwyg/DomWysiwyg.vue';
import DomWysiwygSrc from '../../forms/wysiwyg/DomWysiwyg.vue?raw';
import DocumentEditorDemo from './examples/DocumentEditorDemo.vue';
import DocumentEditorDemoSrc from './examples/DocumentEditorDemo.vue?raw';
import DocumentEditorFormField from './examples/DocumentEditorFormField.vue';
import DocumentEditorFormFieldSrc from './examples/DocumentEditorFormField.vue?raw';
import DocumentEditorCustomTools from './examples/DocumentEditorCustomTools.vue';
import DocumentEditorCustomToolsSrc from './examples/DocumentEditorCustomTools.vue?raw';
import StoreSrc from './examples/useDocumentEditorDemoStore.js?raw';
import MockApiSrc from './examples/documentEditorMockApi.js?raw';

const doc = DomDocumentEditor.__doc;

const clientOnlyCode = `<script setup>
import { DomDocumentEditor } from '@getdom/studio/vue';

function handleRewriteRequest(payload) {
\treturn api.rewriteSelection({
\t\tselectedText: payload.selectedText,
\t\tinstruction: payload.instruction,
\t}).then((suggestion) => payload.respond(suggestion));
}
<\/script>

<template>
\t<DomDocumentEditor
\t\tv-model="document.content"
\t\t:collaborators="[{ id: 'ai', name: 'AI', color: '#2563eb', type: 'ai' }]"
\t\t@rewrite-request="handleRewriteRequest"
\t\t@media-request="openMediaBrowser"
\t/>
</template>`;

const collaborationCode = `import * as Y from 'yjs';

const ydoc = new Y.Doc();
const provider = createYourProvider(ydoc);

const collaboration = {
\tdocument: ydoc,
\tprovider,
\tfield: 'body',
\tuser: {
\t\tid: currentUser.id,
\t\tname: currentUser.name,
\t\tcolor: currentUser.color,
\t\ttype: 'human',
\t},
};`;

const suggestionShapeCode = `{
\tid: 'sug_ai_1001',
\ttype: 'replace',
\tfrom: 42,
\tto: 188,
\toriginal: 'Highlight a paragraph and ask for a rewrite.',
\tproposed: 'Select any passage, ask AI for a rewrite, then review the proposed change before it is applied.',
\tinstruction: 'Make this clearer',
\tauthor: {
\t\tid: 'ai-editor',
\t\tname: 'AI editor',
\t\tcolor: '#2563eb',
\t\ttype: 'ai'
\t},
\tstatus: 'pending'
}`;

const customToolCode = `const customTools = [
\t{
\t\tid: 'mention-user',
\t\tlabel: 'Mention user',
\t\ticon: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0ZM4 21a8 8 0 0 1 16 0',
\t\tcommand: ({ editor }) => {
\t\t\tmentionEditor.value = editor;
\t\t\tmentionMenuOpen.value = true;
\t\t},
\t},
];

function insertMention(user) {
\tmentionEditor.value
\t\t?.chain()
\t\t.focus()
\t\t.insertContent(\`@\${user.name} \`)
\t\t.run();
}`;

const extensionHookCode = `import Mention from '@tiptap/extension-mention';

const mentionExtension = Mention.configure({
\tHTMLAttributes: { class: 'mention' },
\tsuggestion: {
\t\tchar: '@',
\t\titems: ({ query }) => users.filter((user) => user.name.toLowerCase().includes(query.toLowerCase())),
\t\trender: () => ({
\t\t\tonStart: (props) => mentionMenu.open(props),
\t\t\tonUpdate: (props) => mentionMenu.update(props),
\t\t\tonExit: () => mentionMenu.close(),
\t\t}),
\t},
});

function configureExtensions({ extensions }) {
\treturn [...extensions, mentionExtension];
}`;
</script>

<template>
	<DomStudioLayout>
		<DocPage
			:name="doc.name"
			tagline="A client-only WYSIWYG editing surface with structured JSON output, app-owned AI rewrite suggestions, media insertion, video embeds, and optional Yjs collaboration."
			tag="Document editor"
		>
			<DocSection eyebrow="Demo" title="AI-ready editing workspace">
				<Example
					:source="DocumentEditorDemoSrc"
					filename="DocumentEditorDemo.vue"
					description="A Pinia setup store loads and saves structured document JSON, emulates an AI rewrite endpoint, and opens DomMediaBrowser when the editor image tool requests media."
					:preview-lines="0"
				>
					<DocumentEditorDemo />
				</Example>
			</DocSection>

			<DocSection eyebrow="Form" title="Textarea-style v-model">
				<Example
					:source="DocumentEditorFormFieldSrc"
					filename="DocumentEditorFormField.vue"
					description="A compact form field setup uses DomWysiwyg with a normal v-model binding, a reduced WYSIWYG toolbar, and no collaboration, rewrite, media, or external store wiring."
					:preview-lines="0"
				>
					<DocumentEditorFormField />
				</Example>
			</DocSection>

			<DocSection eyebrow="Extend" title="Toolbar tools and document behavior">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Custom toolbar tools</h3>
						<p class="mt-2">
							Pass <code class="text-canvas-fg">customTools</code> records. Each command receives the editor instance, current selection, and helpers such as <code class="text-canvas-fg">requestRewrite</code>.
						</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Typed editor behavior</h3>
						<p class="mt-2">
							Use <code class="text-canvas-fg">extensions</code> or <code class="text-canvas-fg">configureExtensions</code> when a feature belongs inside the document model, such as mentions, embeds, or custom marks.
						</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">App-owned popups</h3>
						<p class="mt-2">
							Menus for people, assets, records, and commands stay in the app. The editor supplies the trigger context; the owner renders and commits the selected item.
						</p>
					</div>
				</div>

				<Example
					class="mt-5"
					:source="DocumentEditorCustomToolsSrc"
					filename="DocumentEditorCustomTools.vue"
					description="Register a custom toolbar tool, open an app-owned user picker, and insert a mention into the active editor."
					:preview-lines="0"
				>
					<DocumentEditorCustomTools />
				</Example>

				<div class="mt-5 grid gap-4 lg:grid-cols-2">
					<CodePanel
						class="overflow-hidden rounded-lg border border-border"
						:source="customToolCode"
						:preview-lines="0"
						:default-open="false"
						:border-top="false"
						filename="custom-toolbar-tool.js"
						lang="js"
					/>
					<CodePanel
						class="overflow-hidden rounded-lg border border-border"
						:source="extensionHookCode"
						:preview-lines="0"
						:default-open="false"
						:border-top="false"
						filename="mention-extension.js"
						lang="js"
					/>
				</div>
			</DocSection>

			<DocSection eyebrow="Boundary" title="Editor experience, not document output">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Client-only runtime</h3>
						<p class="mt-2">
							<code class="text-canvas-fg">DomDocumentEditor</code> dynamically imports the Tiptap runtime after mount. The docs shell can SSR, but the editing canvas belongs to the browser.
						</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">Structured persistence</h3>
						<p class="mt-2">
							The editor emits Tiptap JSON, HTML, and plain text in the change payload. Store JSON for editing and render public document output through a separate renderer.
						</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas p-4">
						<h3 class="font-semibold text-canvas-fg">App-owned integrations</h3>
						<p class="mt-2">
							AI rewrite and media picking are events. Apps keep model calls, media permissions, and storage rules behind their own API boundaries.
						</p>
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Usage" title="Client editor integration">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The component is safe to place on an SSR page because the editor packages are loaded from <code class="text-canvas-fg">onMounted</code>. Use the page for an authenticated editing workflow and keep SEO rendering separate.
					</p>
				</div>
				<CodePanel
					class="mt-5 overflow-hidden rounded-lg border border-border"
					:source="clientOnlyCode"
					:preview-lines="0"
					:default-open="false"
					:border-top="false"
					filename="document-editor.vue"
					lang="vue"
				/>
			</DocSection>

			<DocSection eyebrow="AI" title="Suggestion contract">
				<div class="grid gap-4 lg:grid-cols-2">
					<div class="space-y-4 text-sm leading-7 text-muted-fg">
						<p>
							When the user asks for a rewrite, the component emits the selected text, JSON slice, document range, and a <code class="text-canvas-fg">respond</code> callback. The owner can call an AI endpoint, then pass back a suggestion.
						</p>
						<p>
							Pending suggestions mark the original range inline and render a word-level diff in the review rail. Accepting replaces the current marked range; rejecting removes the mark.
						</p>
					</div>
					<CodePanel
						class="overflow-hidden rounded-lg border border-border"
						:source="suggestionShapeCode"
						:preview-lines="0"
						:default-open="false"
						:border-top="false"
						filename="document-editor-suggestion.js"
						lang="js"
					/>
				</div>
			</DocSection>

			<DocSection eyebrow="Collaboration" title="Yjs adapter">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Pass a Yjs document or fragment when the app wants true multi-user editing. The component wires Tiptap's collaboration extension and, when a provider is present, collaboration carets.
					</p>
					<p>
						The AI can be represented as a collaborator in the header today and as a provider awareness user later while it is actively proposing changes.
					</p>
				</div>
				<CodePanel
					class="mt-5 overflow-hidden rounded-lg border border-border"
					:source="collaborationCode"
					:preview-lines="0"
					:default-open="false"
					:border-top="false"
					filename="document-editor-yjs.js"
					lang="js"
				/>
			</DocSection>

			<DocSection eyebrow="Demo API" title="Store and API boundaries">
				<div class="grid gap-4 lg:grid-cols-2">
					<CodePanel
						class="overflow-hidden rounded-lg border border-border"
						:source="StoreSrc"
						:preview-lines="0"
						:default-open="false"
						:border-top="false"
						filename="useDocumentEditorDemoStore.js"
						lang="js"
					/>
					<CodePanel
						class="overflow-hidden rounded-lg border border-border"
						:source="MockApiSrc"
						:preview-lines="0"
						:default-open="false"
						:border-top="false"
						filename="documentEditorMockApi.js"
						lang="js"
					/>
				</div>
			</DocSection>

			<DocSection eyebrow="Reference" title="Component API">
				<div class="space-y-6">
					<ComponentProps :component="DomDocumentEditor" :source="DomDocumentEditorSrc" />
					<ComponentEvents :component="DomDocumentEditor" :source="DomDocumentEditorSrc" />
					<ComponentSlots :component="DomDocumentEditor" :source="DomDocumentEditorSrc" />
					<ComponentProps :component="DomWysiwyg" :source="DomWysiwygSrc" />
					<ComponentEvents :component="DomWysiwyg" :source="DomWysiwygSrc" />
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
