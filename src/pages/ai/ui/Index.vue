<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';

const contents = [
	{ id: 'surface', label: 'Choose a surface' },
	{ id: 'context', label: 'Prompts & context' },
	{ id: 'states', label: 'Response states' },
	{ id: 'tools', label: 'Tools & review' },
	{ id: 'voice', label: 'Voice & camera' },
	{ id: 'accessibility', label: 'Access & mobile' },
	{ id: 'integration', label: 'Connect your application' },
];

const surfaces = [
	{ name: 'Inline assistance', description: 'For a bounded task such as rewriting a paragraph, keep the action and suggestion beside the original. Let the person edit, accept, or dismiss it without leaving their work.', to: '/data/document-editor', link: 'Document editor' },
	{ name: 'Focused conversation', description: 'For questions and follow-ups, use a conversation panel with the current context visible. A compact thread can sit alongside a record, document, or support case.', to: '/data/agent-chat#dom-agent-conversation', link: 'Agent conversation' },
	{ name: 'Agent workspace', description: 'When people manage several conversations and inspect tool output, give history, the active thread, and results their own space. Collapse secondary panes on smaller screens.', to: '/data/agent-chat#agent-chat-demo', link: 'Agent workspace demo' },
];

const states = [
	{ name: 'Ready', message: 'What would you like to change?', behaviour: 'Show the selected context and a useful starting prompt. Keep the draft editable.' },
	{ name: 'Waiting', message: 'Request sent. Waiting for a response.', behaviour: 'Acknowledge submission immediately. Keep the submitted prompt visible and offer cancellation where supported.' },
	{ name: 'Working', message: 'Searching the selected documents…', behaviour: 'Name the work reported by the application. Use measured progress only; an indeterminate activity indicator is enough when the total is unknown.' },
	{ name: 'Streaming', message: 'Writing the draft…', behaviour: 'Update the same response as content arrives. Keep Stop available, preserve partial output, and allow people to read earlier messages.' },
	{ name: 'Needs review', message: 'Three edits are ready to review.', behaviour: 'Show the proposed change and its destination. Offer specific actions such as Apply edits, Edit draft, or Discard.' },
	{ name: 'Complete', message: 'Draft saved.', behaviour: 'Only claim the result that the application has confirmed. A generated answer, an approved change, and a saved record are separate events.' },
	{ name: 'Stopped or failed', message: 'The connection ended. Your draft is still here.', behaviour: 'Retain useful work, explain what happened, and provide the next step. Distinguish a deliberate stop from a failure; check the saved result before retrying an action.' },
];

const responsibilities = [
	{ name: 'Components', detail: 'Render controlled records, messages, inputs, tool cards, and local capture state. Emit submit, stop, selection, and tool-action events.' },
	{ name: 'Application state', detail: 'Track the active conversation and draft. Merge stream events by stable message and part IDs, preserve partial results, and keep request state separate from saved state.' },
	{ name: 'Server and tools', detail: 'Own model calls, credentials, authorisation, tool execution, persistence, and cancellation. Validate every requested action and return the outcome the interface should display.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Designing AI interfaces" eyebrow="AI / Guide" tag="Patterns & behaviour" tagline="A useful AI interface makes the task, context, progress, and next action clear. Design the whole interaction around the answer.">
			<nav aria-label="On this page" class="flex flex-wrap gap-x-5 gap-y-3 text-sm">
				<a v-for="item in contents" :key="item.id" :href="`#${item.id}`" class="rounded-sm text-muted-fg underline decoration-border underline-offset-4 hover:text-canvas-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{{ item.label }}</a>
			</nav>

			<DocSection id="surface" class="scroll-mt-24" title="Choose a surface that fits the task" eyebrow="01 / Interaction">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Start with what someone is trying to accomplish. A rewrite, a question about a document, and a task that runs across several tools need different amounts of interface.</p>
				<div class="grid gap-4 lg:grid-cols-3">
					<article v-for="item in surfaces" :key="item.name" class="flex flex-col rounded-xl border border-border skin-card p-5">
						<h3 class="font-semibold">{{ item.name }}</h3>
						<p class="mt-3 flex-1 text-sm leading-6 text-muted-fg">{{ item.description }}</p>
						<RouterLink :to="item.to" class="mt-4 text-sm font-medium underline underline-offset-4">{{ item.link }} <span aria-hidden="true">↗</span></RouterLink>
					</article>
				</div>
			</DocSection>

			<DocSection id="context" class="scroll-mt-24" title="Make the input and its context visible" eyebrow="02 / Before sending">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>A composer should show what will be sent: the draft, attached files, selected records, and any relevant scope. Give people a way to remove context before submitting. If a file is still uploading or could not be read, show that state beside the file.</p>
					<p>Use a specific suggestion such as “Summarise the selected meeting notes” to explain the available task. Keep suggestions editable, preserve an unsent draft when switching views, and label the send action. Make the Enter and newline behaviour clear.</p>
					<p><RouterLink to="/forms/textarea-composer" class="font-medium text-canvas-fg underline underline-offset-4">DomTextareaComposer</RouterLink> provides an autosizing field with attachment and action slots. The application supplies the attachment records, upload progress, and context selection.</p>
				</div>
			</DocSection>

			<DocSection id="states" class="scroll-mt-24" title="Design every stage of a response" eyebrow="03 / Feedback & recovery">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Use these as product states when designing the flow. They are example labels, rather than a required API enum. Each state should explain what is happening and what the person can do next.</p>
				<dl class="divide-y divide-border overflow-hidden rounded-xl border border-border">
					<div v-for="state in states" :key="state.name" class="grid gap-3 p-5 md:grid-cols-[8rem_1fr] md:gap-6">
						<dt class="text-sm font-semibold">{{ state.name }}</dt>
						<dd class="space-y-2 text-sm leading-6"><p class="font-medium">{{ state.message }}</p><p class="text-muted-fg">{{ state.behaviour }}</p></dd>
					</div>
				</dl>
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Keep following new content while the reader is at the end of the conversation. Once they scroll back, preserve their position and offer a jump to the latest response. Connect the chat component’s stop event to cancellation in your application; changing a button alone does not stop a remote task.</p>
			</DocSection>

			<DocSection id="tools" class="scroll-mt-24" title="Turn tool output into something people can use" eyebrow="04 / Results & review">
				<div class="grid gap-6 md:grid-cols-2">
					<div class="space-y-3 text-sm leading-7 text-muted-fg">
						<h3 class="font-semibold text-canvas-fg">Show the result in its own shape</h3>
						<p>Render search results as links, a booking as a summary, and a proposed edit as a diff. Keep the tool’s label, progress, and outcome together. The conversation’s renderer map lets the application supply Vue components for known tools.</p>
						<p>Keep sources close to the claims they support, with names and links people can inspect. Identify missing evidence or a failed lookup directly. A source link should come from the retrieved record; avoid inventing references or displaying an uncalibrated confidence percentage.</p>
						<RouterLink to="/data/agent-chat" class="inline-block font-medium text-canvas-fg underline underline-offset-4">Explore tool renderers ↗</RouterLink>
					</div>
					<div class="space-y-3 text-sm leading-7 text-muted-fg">
						<h3 class="font-semibold text-canvas-fg">Make changes reviewable</h3>
						<p>For an action that needs approval, show the exact proposed change, destination, and consequence before asking. Use a concrete button label such as “Apply three edits”. Keep approval, execution, and successful persistence as separate states.</p>
						<p>Pair a <RouterLink to="/visual/text-diff" class="font-medium text-canvas-fg underline underline-offset-4">text diff</RouterLink> with application-owned accept and discard actions. If the action fails after approval, keep the proposal available and show the actual result. Offer undo when your application can reliably reverse the change.</p>
						<p>Describe observable work, such as “Read two documents”, using events your application actually received. Keep user-facing progress summaries concise.</p>
					</div>
				</div>
			</DocSection>

			<DocSection id="voice" class="scroll-mt-24" title="Separate device activity from the AI session" eyebrow="05 / Voice & camera">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>A moving waveform shows input activity. It does not establish that speech was recognised, sent, or understood. Show microphone capture and the remote session separately: connecting, listening, processing, speaking, or disconnected, as supported by your integration.</p>
					<p><RouterLink to="/components/audio-controls" class="font-medium text-canvas-fg underline underline-offset-4">DomAudioControls</RouterLink> combines start, stop, mute, input selection, and a live waveform. <RouterLink to="/components/audio-input" class="font-medium text-canvas-fg underline underline-offset-4">DomAudioInput</RouterLink> and <RouterLink to="/components/camera-input" class="font-medium text-canvas-fg underline underline-offset-4">DomCameraInput</RouterLink> provide separate setup surfaces. Each capture component owns its stream; pass that stream to <RouterLink to="/visual/audio-visualizer" class="font-medium text-canvas-fg underline underline-offset-4">DomAudioVisualizer</RouterLink> for another display.</p>
					<p>Start capture from an explicit user action, explain whether input will be transmitted, and keep stopping easy. Provide a text path if permission is declined or a device is unavailable. Camera and microphone access require a secure context and browser permission; embedded experiences also need the appropriate permissions policy. <a href="https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia" class="font-medium text-canvas-fg underline underline-offset-4">Read the browser capture requirements.</a></p>
					<p>Your application implements recording, transcription, playback, and interruption of a remote response. A local microphone mute and a request to stop the assistant are different controls with different effects.</p>
				</div>
			</DocSection>

			<DocSection id="accessibility" class="scroll-mt-24" title="Keep the interface usable as it changes" eyebrow="06 / Access & mobile">
				<div class="grid gap-6 md:grid-cols-2">
					<div class="space-y-3 text-sm leading-7 text-muted-fg">
						<h3 class="font-semibold text-canvas-fg">Announce meaningful changes</h3>
						<p>Expose waiting, completion, and error messages to assistive technology without moving focus. Avoid announcing every streamed token. Use text alongside colour or animation, preserve keyboard focus as results arrive, and test the announcement frequency with a screen reader.</p>
						<a href="https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html" class="inline-block font-medium text-canvas-fg underline underline-offset-4">W3C guidance on status messages ↗</a>
					</div>
					<div class="space-y-3 text-sm leading-7 text-muted-fg">
						<h3 class="font-semibold text-canvas-fg">Give the conversation room</h3>
						<p>On a phone, give the thread the main screen and move history or context into a drawer. Keep the composer reachable when the keyboard opens, give long results their own scroll behaviour, and keep Stop and review actions within reach.</p>
						<p>Use the <RouterLink to="/mobile" class="font-medium text-canvas-fg underline underline-offset-4">mobile shell guidance</RouterLink> for scroll ownership, safe areas, and keyboard layout. Check the full-screen view on a target device as well as the embedded docs preview.</p>
					</div>
				</div>
			</DocSection>

			<DocSection id="integration" class="scroll-mt-24" title="Connect the interface to application state" eyebrow="07 / Integration">
				<div class="grid gap-4 lg:grid-cols-3">
					<article v-for="item in responsibilities" :key="item.name" class="rounded-xl border border-border skin-card p-5"><h3 class="font-semibold">{{ item.name }}</h3><p class="mt-3 text-sm leading-6 text-muted-fg">{{ item.detail }}</p></article>
				</div>
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Treat generated content and tool arguments as untrusted input. Map known result types to your own renderers, validate actions on the server, and keep credentials there. The <RouterLink to="/data/agent-chat#agent-chat-demo" class="font-medium text-canvas-fg underline underline-offset-4">agent workspace demo</RouterLink> shows message parts and a store with a mock API you can replace.</p>
				<RouterLink to="/ai" class="inline-block text-sm font-medium underline underline-offset-4">Browse all AI components →</RouterLink>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
