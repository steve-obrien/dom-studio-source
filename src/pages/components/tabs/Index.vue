<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import PropsTable from '../../_layout/PropsTable.vue';
import { DomTabs } from '../../lib/vue';
import { ref } from 'vue';
import FlatTabs from './examples/FlatTabs.vue';
import FlatTabsSrc from './examples/FlatTabs.vue?raw';
import PageTabs from './examples/PageTabs.vue';
import PageTabsSrc from './examples/PageTabs.vue?raw';

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
\t{ key: 'overview', label: 'Overview' },
\t{ key: 'pricing', label: 'Pricing' },
];
<\/script>

<template>
\t<DomTabs v-model="active" :tabs="tabs">
\t\t<template #overview>Overview content…</template>
\t\t<template #pricing>Pricing content…</template>
\t</DomTabs>
</template>`;

const usageWeb = `<dom-tabs value="overview">
\t<div role="tablist">
\t\t<button data-tab="overview">Overview</button>
\t\t<button data-tab="pricing">Pricing</button>
\t</div>
\t<div data-panel="overview">Overview…</div>
\t<div data-panel="pricing">Pricing…</div>
</dom-tabs>`;

const props = [
	{ name: 'v-model', type: 'string', default: 'first tab key', description: 'Active tab key.' },
	{ name: 'tabs', type: 'Array<{ key, label }>', default: '—', description: 'Tabs to render.' },
	{ name: 'variant', type: "'pill' | 'flat' | 'page'", default: "'pill'", description: 'Use flat for underlined navigation or page for editor-style tabs attached to a panel.' },
	{ name: 'fill', type: 'boolean', default: 'false', description: 'Stretch the tab list and active panel inside a flex parent.' },
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

			<DocSection eyebrow="Variant" title="Page tabs">
				<Example
					:source="PageTabsSrc"
					filename="PageTabs.vue"
					title="Page tabs"
					description="Editor-style tabs can use variant=&quot;page&quot;, scoped tab labels, and reactive tab arrays."
					default-open
					:preview-lines="18"
				>
					<PageTabs />
				</Example>
			</DocSection>

			<DocSection eyebrow="Variant" title="Flat tabs">
				<Example
					:source="FlatTabsSrc"
					filename="FlatTabs.vue"
					title="Flat tabs"
					description="Flat tabs use a simple active underline for page-level navigation without a contained control surface."
					default-open
					:preview-lines="18"
				>
					<FlatTabs />
				</Example>
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
