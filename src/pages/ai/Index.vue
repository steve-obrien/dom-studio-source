<script setup>
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import { componentAnchor, getComponentNavigationSection, getComponentRecords } from '../_layout/componentManager.js';
import { inspectComponentRecord } from '../_layout/componentInspector.js';

const components = getComponentRecords()
	.map(inspectComponentRecord)
	.filter((record) => !record.navHidden && getComponentNavigationSection(record) === 'ai')
	.sort(compareComponents);

const supportingComponents = [
	{ name: 'Message composer', to: '/forms/textarea-composer', description: 'Compose a prompt with attachments, context chips, and supporting actions.' },
	{ name: 'Text diff', to: '/visual/text-diff', description: 'Show the original and proposed text together before accepting a change.' },
	{ name: 'Document editor', to: '/data/document-editor', description: 'Keep AI suggestions beside the document, with review and editing in context.' },
];

const examples = [
	{ name: 'Agent workspace', to: '/data/agent-chat#agent-chat-demo', description: 'Conversation history, streamed responses, and custom tool cards in a working demo.' },
	{ name: 'Assistant chat', to: '/blocks/communication/chat', description: 'A complete chat block with a composer, support context, and tool results.' },
	{ name: 'AI prompt lab', to: '/blocks/developer-experience/ai-prompt-lab', description: 'A prompt workspace example with variables, runs, and output inspection.' },
];

/**
 * Keeps conversation components together before the media controls in the index.
 *
 * @param {object} a First inspected component record.
 * @param {object} b Second inspected component record.
 * @returns {number} Component display order.
 */
function compareComponents(a, b) {
	const familyOrder = Number(b.slug === 'agent-chat') - Number(a.slug === 'agent-chat');
	return familyOrder || a.order - b.order || a.label.localeCompare(b.label);
}

/**
 * Links directly to an individual component's reference within a shared family page.
 *
 * @param {object} record Inspected component metadata.
 * @returns {string} Existing documentation URL with an optional reference anchor.
 */
function componentLink(record) {
	return record.slug === 'agent-chat' ? `${record.route}#${componentAnchor(record)}` : record.route;
}
</script>

<template>
	<DomStudioLayout>
		<DocPage name="AI" eyebrow="DOM Studio" tag="Components & patterns" tagline="Interfaces for working with AI. Bring conversations, voice, context, and review into the product people already use.">
			<DocSection title="Build the interaction around the task" eyebrow="Start here">
				<div class="grid gap-4 md:grid-cols-2">
					<RouterLink to="/ai/ui" class="group rounded-xl border border-border skin-card p-6 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						<p class="text-xs font-semibold uppercase tracking-wider text-primary">Designing AI interfaces</p>
						<h3 class="mt-3 text-xl font-semibold tracking-tight">From prompt to a useful result <span aria-hidden="true" class="inline-block transition group-hover:translate-x-1">→</span></h3>
						<p class="mt-3 text-sm leading-6 text-muted-fg">Choose the right surface, show what is happening, and let people stop, review, correct, and continue. A practical guide to the states around an AI response.</p>
					</RouterLink>
					<RouterLink to="/ai/builders" class="group rounded-xl border border-border skin-card p-6 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						<p class="text-xs font-semibold uppercase tracking-wider text-muted-fg">Building with AI</p>
						<h3 class="mt-3 text-xl font-semibold tracking-tight">Give your agent a shared vocabulary <span aria-hidden="true" class="inline-block transition group-hover:translate-x-1">→</span></h3>
						<p class="mt-3 text-sm leading-6 text-muted-fg">Use DOM Studio components, canonical examples, and semantic tokens. Keep generated interfaces readable and, when useful, editable through Studio specs.</p>
					</RouterLink>
				</div>
			</DocSection>

			<DocSection title="AI components" eyebrow="Conversations, voice & camera">
				<p class="max-w-3xl text-sm leading-7 text-muted-fg">Compose a complete agent workspace or use the parts independently. These components provide the interface; your application connects the model, tools, data, and media transport.</p>
				<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					<RouterLink v-for="item in components" :key="item.exportName" :to="componentLink(item)" class="group min-w-0 rounded-xl border border-border skin-card p-5 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						<svg viewBox="0 0 24 24" class="mb-4 size-6 text-primary" fill="none" aria-hidden="true"><path :d="item.icon" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
						<h3 class="flex items-start justify-between gap-3 text-base font-semibold">{{ item.label }}<span class="text-muted-fg" aria-hidden="true">↗</span></h3>
						<code class="mt-3 inline-block max-w-full break-all rounded-md bg-secondary px-2 py-1 text-xs text-muted-fg">{{ item.exportName }}</code>
						<p class="mt-3 text-sm leading-6 text-muted-fg">{{ item.doc.description }}</p>
					</RouterLink>
				</div>
			</DocSection>

			<DocSection title="Compose the rest of the workflow" eyebrow="Shared building blocks">
				<div class="grid gap-4 md:grid-cols-3">
					<RouterLink v-for="item in supportingComponents" :key="item.to" :to="item.to" class="rounded-xl border border-border p-5 transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						<h3 class="font-semibold">{{ item.name }} <span aria-hidden="true">↗</span></h3>
						<p class="mt-2 text-sm leading-6 text-muted-fg">{{ item.description }}</p>
					</RouterLink>
					</div>
			</DocSection>

			<DocSection title="See the pieces working together" eyebrow="Examples">
				<div class="divide-y divide-border rounded-xl border border-border">
					<RouterLink v-for="item in examples" :key="item.to" :to="item.to" class="flex flex-col gap-2 p-5 transition first:rounded-t-xl last:rounded-b-xl hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:gap-8">
						<h3 class="shrink-0 font-semibold sm:w-40">{{ item.name }} <span aria-hidden="true">↗</span></h3>
						<p class="text-sm leading-6 text-muted-fg">{{ item.description }}</p>
					</RouterLink>
				</div>
				<p class="text-sm leading-6 text-muted-fg">Chat and prompt examples use demo data. Media controls capture local device input when started; recording, transcription, and AI responses need an application integration.</p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
