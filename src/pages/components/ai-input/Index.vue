<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import DomAiInput from './DomAiInput.vue';
import AiInputPlayground from './examples/Playground.vue';
import playgroundSource from './examples/Playground.vue?raw';
import ComposerVariants from './examples/ComposerVariants.vue';
import composerVariantsSource from './examples/ComposerVariants.vue?raw';
import FlyoutComposer from './examples/FlyoutComposer.vue';
import flyoutComposerSource from './examples/FlyoutComposer.vue?raw';
import CodingComposer from './examples/CodingComposer.vue';
import codingComposerSource from './examples/CodingComposer.vue?raw';
import MediaLibraryComposer from './examples/MediaLibraryComposer.vue';
import mediaLibraryComposerSource from './examples/MediaLibraryComposer.vue?raw';

const doc = DomAiInput.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection title="Playground">
				<Playground
					:inspect="DomAiInput"
					:component="AiInputPlayground"
					:source="playgroundSource"
					title="AI input playground"
					description="Change properties, type a Markdown shortcut in the prompt, or send it to see the request."
				/>
			</DocSection>

			<DocSection id="sliding-stack" title="Sliding stack and workflow layouts">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">
					Use the plus button to add local files. Open the model picker to see its features, then send a prompt to inspect the request.
					The OpenAI, Anthropic, and Google entries are sample catalogue data. Files and prompts stay in this page.
				</p>
				<Example :source="composerVariantsSource" filename="ComposerVariants.vue">
					<ComposerVariants />
				</Example>
			</DocSection>

			<DocSection id="flyout-picker" title="Claude-style flyout picker">
				<Example :source="flyoutComposerSource" filename="FlyoutComposer.vue" description="Choose a model from a compact list. Reasoning effort and additional models open in side menus.">
					<FlyoutComposer />
				</Example>
			</DocSection>

			<DocSection id="coding-toolbar" title="Codex-style coding toolbar">
				<Example :source="codingComposerSource" filename="CodingComposer.vue" description="The workspace sets Plan or Build and the approval policy. Click the microphone beside Send to start a local audio preview and show the live controls inline.">
					<CodingComposer />
				</Example>
			</DocSection>

			<DocSection id="media-library" title="Attach from the media library">
				<Example :source="mediaLibraryComposerSource" filename="MediaLibraryComposer.vue" description="Open the media library with the plus button, select existing files, and attach their references to the prompt.">
					<MediaLibraryComposer />
				</Example>
			</DocSection>

			<DocSection title="Connect an application">
				<ul class="max-w-3xl list-disc space-y-2 pl-5 text-sm leading-7 text-muted-fg">
					<li>Bind the draft with <code>v-model</code>. The <code>submit</code> event includes the prompt, local <code>File</code> objects, and the selected settings. Clear the draft once the app accepts the request.</li>
					<li>By default, Enter sends and Shift + Enter adds a line. Set <code>:submit-on-enter="false"</code> to swap the shortcuts.</li>
					<li>Enable <code>markdown</code> for inline formatting. At the start of a line, type <code>-</code> and a space for a bullet, <code>[]</code> and a space for a task, or <code>#</code> and a space for a heading. The request still carries Markdown text. Checking a task writes <code>- [x]</code> into that text.</li>
					<li>The model picker uses <code>DomMenuStack</code> inside <code>DomDropdown</code>. Choose a model with settings to slide into its Features page. Back returns to the same model search.</li>
					<li>Use <code>model-picker="flyout"</code> for side menus. Set <code>model-placement="trailing"</code> to show the current reasoning effort near Send.</li>
					<li>Put <code>&lt;DomAudioControls compact&gt;</code> in the <code>actions</code> slot for inline microphone capture. For live dictation, pass the <code>MediaStream</code> from <code>@stream</code> to your transcription session. Show interim text as it arrives, merge final text into the draft, and finish the session when the stream becomes <code>null</code>.</li>
					<li>Use <code>layout="workflow"</code> to show the Plan and Build menu beside the attachment button. For an app-owned workflow control, use the toolbar layout with <code>:mode-in-picker="false"</code> and write its choice to <code>draft.mode</code>.</li>
					<li>Replace the attachment trigger with the <code>add</code> slot. Put existing library files in <code>draft.media</code> to send their IDs and names alongside any local files.</li>
					<li>Pass a model catalogue with each model’s supported workflow modes, reasoning efforts, and speeds. Use <code>autoFeatures</code> for the options supported by automatic routing and <code>resolvedModelLabel</code> when the app knows which model Auto chose.</li>
					<li>Put the default reasoning effort and speed first in their lists. Compatible draft preferences carry across models. If a model can’t use the draft’s workflow mode, select a supported mode before sending.</li>
					<li>The application handles uploads, routes the request to a provider, and validates the selected mode, reasoning effort, and speed.</li>
				</ul>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomAiInput" />
				<ComponentEvents :component="DomAiInput" />
				<ComponentSlots :component="DomAiInput" />
				<ComponentKeyboard :component="DomAiInput" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
