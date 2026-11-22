<script setup>
import { RouterLink } from 'vue-router';
import DomStudioLayout from '../_layout/DomStudioLayout.vue';
import DocPage from '../_layout/DocPage.vue';
import DocSection from '../_layout/DocSection.vue';
import CodeBlock from '../_layout/CodeBlock.vue';
import Playground from '../_layout/docs/Playground.vue';
import DomStatusPill from '../visual/status-pill/DomStatusPill.vue';
import statusPillSource from '../visual/status-pill/DomStatusPill.vue?raw';

const sections = [
	{ id: 'live-example', label: 'Live example' },
	{ id: 'component-docs', label: 'Component docs' },
	{ id: 'prop-editors', label: 'Prop editors' },
	{ id: 'adding-components', label: 'Adding components' },
];

const docFields = [
	['name', 'Readable component name for documentation and navigation.'],
	['description', 'A short explanation of what the component does and when to use it.'],
	['tag', 'The component tag shown in documentation and generated usage examples.'],
	['playground.initial', 'Starting prop values for the generated playground. These override the component defaults in the demo only.'],
	['slots', 'Slot descriptions, with optional payloads for scoped slots.'],
	['events', 'Event descriptions and payloads. Event names are also read from Vue emits and component source.'],
	['keyboard', 'Key and action pairs for pages that include the keyboard reference helper.'],
	['icon / order / badge', 'An SVG path, numeric ordering hint, and optional badge for the component catalogue.'],
	['nav', 'Navigation overrides: icon, badge, and hidden.'],
	['studio', 'Palette settings such as group, icon, hidden, defaults, accepts, and editor hints.'],
	['hidden', 'Hides the component from navigation and the Studio palette. This does not disable its route or package export.'],
];

const editFields = [
	['description', 'Helper text for the prop reference and inspector field.'],
	['options', 'Available choices. Uses a select editor when no editor component is specified.'],
	['component', 'An inspector editor name, such as DomTextInput, DomJsonInput, or DomJsonListInput.'],
	['props', 'Configuration passed to that editor, such as rows, compact, or schema.'],
	['label', 'A readable field label. Defaults to a label derived from the prop name.'],
	['group', 'An optional group heading for related fields in the playground.'],
	['overriddenBy', 'The name of a sibling prop. A truthy value in that prop disables this editor and names the override. Clearing the override restores the editor and its previous value.'],
];

const docCode = `defineOptions({
	__doc: {
		name: 'Status pill',
		tag: '<DomStatusPill>',
		description: 'A compact label for workflow status.',
		playground: {
			initial: { label: 'Live', tone: 'success' },
		},
		slots: [
			{ name: '(default)', description: 'Status label.' },
		],
	},
});`;

const editCode = `const props = defineProps({
	tone: {
		type: String,
		default: 'neutral',
		_edit: {
			options: ['neutral', 'success', 'warning', 'danger'],
			description: 'Visual state shown by the pill.',
		},
	},
});`;

const eventsCode = `defineOptions({
	__doc: {
		events: [
			{
				name: 'update:modelValue',
				payload: 'string',
				description: 'The current text after editing.',
			},
		],
	},
});

const emit = defineEmits(['update:modelValue']);`;
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Component metadata"
			tagline="DOM Studio reads your Vue props to build documentation and editing controls. Add optional metadata to describe your components and refine how they are edited."
			eyebrow="Authoring components"
			class="min-w-0"
		>
			<div class="min-w-0 space-y-5">
				<p class="max-w-3xl text-base leading-7 text-muted-fg">
					Use this guide when adding or adapting components in DOM Studio. For components in your application,
					start with the
					<RouterLink to="/install" class="font-medium text-canvas-fg underline decoration-border underline-offset-4 hover:text-primary">installation guide</RouterLink>
					and their props, slots, and events. Metadata is optional for ordinary Vue usage; installing the package does not add a docs site to your app.
				</p>
				<nav aria-label="On this page" class="flex flex-wrap gap-x-6 gap-y-3 text-sm">
					<a
						v-for="section in sections"
						:key="section.id"
						:href="`#${section.id}`"
						class="font-medium text-canvas-fg underline decoration-border underline-offset-4 hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
					>{{ section.label }}</a>
				</nav>
			</div>

			<DocSection id="live-example" title="See the metadata at work" class="scroll-mt-28">
				<p class="max-w-3xl text-sm leading-6 text-muted-fg">
					This is the real <code class="font-mono text-canvas-fg">DomStatusPill</code> component.
					Change its label, choose a tone, or toggle the dot. Vue prop types supply the text and toggle controls;
					<code class="font-mono text-canvas-fg">_edit.options</code> supplies the choices.
				</p>
				<Playground
					:inspect="DomStatusPill"
					:initial="DomStatusPill.__doc.playground.initial"
					title="Status pill"
					description="Edit the properties to update the component and its usage example."
				/>
				<details class="min-w-0 rounded-2xl border border-border">
					<summary class="cursor-pointer rounded-2xl px-4 py-4 text-sm font-medium text-canvas-fg hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5">
						View the complete component source
					</summary>
					<div class="min-w-0 border-t border-border">
						<CodeBlock :code="statusPillSource" filename="DomStatusPill.vue" lang="vue" :framed="false" />
					</div>
				</details>
				<p class="text-sm leading-6 text-muted-fg">
					The source above is loaded from the same file as the preview.
					<RouterLink to="/visual/status-pill" class="font-medium text-canvas-fg underline decoration-border underline-offset-4 hover:text-primary">Open the full status pill reference</RouterLink>.
				</p>
			</DocSection>

			<DocSection id="component-docs" title="Describe the component with __doc" class="scroll-mt-28">
				<p class="max-w-3xl text-sm leading-6 text-muted-fg">
					Add <code class="font-mono text-canvas-fg">__doc</code> inside
					<code class="font-mono text-canvas-fg">defineOptions()</code> in your component's script setup.
					Start with a name and description, then document slots and events as needed.
				</p>
				<CodeBlock :code="docCode" lang="js" />
				<dl class="min-w-0 divide-y divide-border rounded-2xl border border-border text-sm">
					<div v-for="[field, description] in docFields" :key="field" class="grid min-w-0 gap-1 px-4 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6 sm:px-5">
						<dt class="min-w-0 break-words font-mono text-xs font-medium leading-6 text-canvas-fg">{{ field }}</dt>
						<dd class="min-w-0 leading-6 text-muted-fg">{{ description }}</dd>
					</div>
				</dl>
				<details class="min-w-0 rounded-2xl border border-border">
					<summary class="cursor-pointer rounded-2xl px-4 py-4 text-sm font-medium text-canvas-fg hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5">
						Documenting an input event
					</summary>
					<div class="min-w-0 space-y-4 border-t border-border p-4 sm:p-5">
						<p class="max-w-3xl text-sm leading-6 text-muted-fg">
							Declare events with Vue's <code class="font-mono text-canvas-fg">defineEmits()</code>, and describe their meaning in
							<code class="font-mono text-canvas-fg">__doc.events</code>. For an input component, an entry might look like this:
						</p>
						<CodeBlock :code="eventsCode" lang="js" />
						<p class="text-sm leading-6 text-muted-fg">Metadata documents the event; the component still needs to emit it when its value changes.</p>
					</div>
				</details>
			</DocSection>

			<DocSection id="prop-editors" title="Choose editing controls with _edit" class="scroll-mt-28">
				<p class="max-w-3xl text-sm leading-6 text-muted-fg">
					String, number, and boolean props get basic editors automatically. Put
					<code class="font-mono text-canvas-fg">_edit</code> on a prop definition to add help text,
					provide choices, or use a richer editor. These hints configure the inspector; they do not validate the prop at runtime.
				</p>
				<CodeBlock :code="editCode" lang="js" />
				<dl class="min-w-0 divide-y divide-border rounded-2xl border border-border text-sm">
					<div v-for="[field, description] in editFields" :key="field" class="grid min-w-0 gap-1 px-4 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6 sm:px-5">
						<dt class="min-w-0 break-words font-mono text-xs font-medium leading-6 text-canvas-fg">{{ field }}</dt>
						<dd class="min-w-0 leading-6 text-muted-fg">{{ description }}</dd>
					</div>
				</dl>
				<p class="max-w-3xl text-sm leading-6 text-muted-fg">
					Array and object props need an explicit editor, such as <code class="font-mono text-canvas-fg">DomJsonInput</code>
					or <code class="font-mono text-canvas-fg">DomJsonListInput</code>, or a choices hint.
					Use JSDoc <code class="font-mono text-canvas-fg">@typedef</code> and <code class="font-mono text-canvas-fg">@type</code>
					comments in the source to describe their data shapes in the prop reference.
				</p>
			</DocSection>

			<DocSection id="adding-components" title="Add a component to this repository" class="scroll-mt-28">
				<ol class="max-w-3xl list-decimal space-y-3 pl-5 text-sm leading-6 text-muted-fg marker:font-medium marker:text-canvas-fg">
					<li class="pl-1">Add a <code class="font-mono text-canvas-fg">Dom*.vue</code> file in a component folder under components, data, charts, dev, forms, mobile, or visual.</li>
					<li class="pl-1">Run the dev server. The generated catalogue supplies the route and navigation entry; a playground and prop reference are created when the folder has no <code class="font-mono text-canvas-fg">Index.vue</code>.</li>
					<li class="pl-1">Add metadata where it helps. Keep examples beside the component, and add an <code class="font-mono text-canvas-fg">Index.vue</code> when you need an authored documentation page.</li>
					<li class="pl-1">For a public package component, add its export to <code class="break-words font-mono text-canvas-fg">src/pages/lib/vue/index.js</code> and run <code class="font-mono text-canvas-fg">npm run types:generate</code>.</li>
				</ol>
				<p class="max-w-3xl text-sm leading-6 text-muted-fg">
					The docs engine is part of this repository. Reusing it in another app requires its catalogue generation,
					loaders, routing, and documentation helpers.
				</p>
				<p class="max-w-3xl text-sm leading-6 text-muted-fg">
					For composing and saving UI layouts, explore
					<RouterLink to="/designer/canvas" class="font-medium text-canvas-fg underline decoration-border underline-offset-4 hover:text-primary">the canvas</RouterLink>.
					Saved layout data has a separate renderer format from the component metadata described here.
				</p>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
