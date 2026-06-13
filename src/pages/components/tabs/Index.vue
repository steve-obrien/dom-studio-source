<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Playground from '../../_layout/docs/Playground.vue';
import PropsTable from '../../_layout/PropsTable.vue';
import { DomTabs } from '../../lib/vue';
import { ref } from 'vue';

const active = ref('overview');
const tabs = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'pricing', label: 'Pricing' },
	{ key: 'changelog', label: 'Changelog' },
];

const usageVue = `<script setup>
import { DomTabs } from '@getdom/studio/vue';
import { ref } from 'vue';
const active = ref('overview');
const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'pricing',  label: 'Pricing' },
];
<\/script>

<template>
  <DomTabs v-model="active" :tabs="tabs">
    <template #overview>Overview content…</template>
    <template #pricing>Pricing content…</template>
  </DomTabs>
</template>`;

const usageWeb = `<dom-tabs value="overview">
  <div role="tablist">
    <button data-tab="overview">Overview</button>
    <button data-tab="pricing">Pricing</button>
  </div>
  <div data-panel="overview">Overview…</div>
  <div data-panel="pricing">Pricing…</div>
</dom-tabs>`;

const props = [
	{ name: 'v-model', type: 'string', default: 'first tab key', description: 'Active tab key.' },
	{ name: 'tabs', type: 'Array<{ key, label }>', default: '—', description: 'Tabs to render.' },
];
const keys = [
	{ k: '← / →', d: 'Move to previous / next tab.' },
	{ k: 'Home / End', d: 'Jump to first / last tab.' },
	{ k: 'Enter / Space', d: 'Activate focused tab.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Tabs" tagline="Roving-tabindex tab list with managed ARIA, keyboard navigation, and panel linking." tag="<dom-tabs>">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomTabs"
					:initial="{ tabs, modelValue: active }"
					title="Tabs playground"
					description="Edit props in the inspector — switch tabs to preview panel slots and the active tab key."
				>
					<template #overview><p class="text-sm text-muted-fg">Overview panel content.</p></template>
					<template #pricing><p class="text-sm text-muted-fg">Pricing panel content.</p></template>
					<template #changelog><p class="text-sm text-muted-fg">Changelog panel content.</p></template>
				</Playground>
			</DocSection>

			<DocSection eyebrow="Demo" title="Live preview">
				<Demo>
					<div class="w-full max-w-md">
						<DomTabs v-model="active" :tabs="tabs">
							<template #overview>
								<div class="rounded-xl border border-border bg-canvas p-5 text-sm text-muted-fg">Overview content. Tabs preserve focus and announce panel changes to assistive tech.</div>
							</template>
							<template #pricing>
								<div class="rounded-xl border border-border bg-canvas p-5 text-sm text-muted-fg">Pricing content. Use the arrow keys to move between tabs.</div>
							</template>
							<template #changelog>
								<div class="rounded-xl border border-border bg-canvas p-5 text-sm text-muted-fg">Changelog content. Each panel is keyboard-reachable.</div>
							</template>
						</DomTabs>
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

			<DocSection title="Keyboard">
				<ul class="space-y-2 rounded-2xl border border-border bg-secondary/40 p-5 text-sm">
					<li v-for="row in keys" :key="row.k" class="flex items-start gap-4">
						<kbd class="rounded bg-canvas px-2 py-0.5 font-mono text-xs ring-1 ring-border">{{ row.k }}</kbd>
						<span class="text-muted-fg">{{ row.d }}</span>
					</li>
				</ul>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
