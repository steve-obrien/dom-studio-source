<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Playground from '../../_layout/docs/Playground.vue';
import PropsTable from '../../_layout/PropsTable.vue';
import { DomAccordion } from '../../lib/vue';

const items = [
	{ title: 'How do I install DOM Studio?', content: 'npm install @getdom/studio/vue, then import the components you need. Tree-shaking is on by default.' },
	{ title: 'Does it work without Vue?', content: 'Yes — the headless layer is plain custom elements that work in any HTML page.' },
	{ title: 'How do I theme it?', content: 'Override CSS variables on :root (or [data-theme]). Tailwind 4 token utilities are provided out of the box.' },
];

const usageVue = `<script setup>
import { DomAccordion } from '@getdom/studio/vue';
const items = [
  { title: 'Q1', content: 'A1' },
  { title: 'Q2', content: 'A2' },
];
<\/script>

<template>
  <DomAccordion :items="items" />
  <!-- allow multiple panels open -->
  <DomAccordion :items="items" multiple />
</template>`;

const usageWeb = `<dom-accordion>
  <dom-accordion-item open>
    <button slot="header">Section A</button>
    <div slot="content">…</div>
  </dom-accordion-item>
  <dom-accordion-item>
    <button slot="header">Section B</button>
    <div slot="content">…</div>
  </dom-accordion-item>
</dom-accordion>`;

const props = [
	{ name: 'items', type: 'Array<{ title, content }>', default: '—', description: 'Items to render.' },
	{ name: 'multiple', type: 'boolean', default: 'false', description: 'Allow multiple panels open at the same time.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Accordion" tagline="Disclosure panels with ARIA region/expanded wiring, single or multiple open, and clean transitions." tag="<dom-accordion>">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomAccordion"
					:initial="{ items }"
					title="Accordion playground"
					description="Edit props in the inspector — expand sections to preview items and the multiple mode."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Live preview">
				<Demo>
					<div class="w-full max-w-lg">
						<DomAccordion :items="items" />
					</div>
				</Demo>
			</DocSection>

			<DocSection eyebrow="Usage" title="Vue">
				<CodeBlock :code="usageVue" lang="vue" />
			</DocSection>

			<DocSection eyebrow="Usage" title="Web component">
				<CodeBlock :code="usageWeb" lang="html" />
			</DocSection>

			<DocSection title="Props">
				<PropsTable :rows="props" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
