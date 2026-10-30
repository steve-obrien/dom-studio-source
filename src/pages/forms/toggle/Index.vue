<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Playground from '../../_layout/docs/Playground.vue';
import PropsTable from '../../_layout/PropsTable.vue';
import { DomToggle } from '../../lib/vue';
import { ref } from 'vue';

const notifications = ref(true);
const marketing = ref(false);
const approvals = ref(true);

const usageVue = `<script setup>
import { DomToggle } from '@getdom/studio/vue';
import { ref } from 'vue';
const on = ref(true);
<\/script>

<template>
	<DomToggle v-model="on" label="Notifications" size="md" />
</template>`;

const usageWeb = `<dom-toggle checked aria-label="Notifications"></dom-toggle>

<script type="module">
	import '@getdom/studio/headless';
	document.querySelector('dom-toggle')
		.addEventListener('dom:change', (e) => console.log(e.detail.checked));
<\/script>`;

const props = [
	{ name: 'v-model', type: 'boolean', default: 'false', description: 'Checked state.' },
	{ name: 'label', type: 'string', default: '—', description: 'Visible label next to the toggle.' },
	{ name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Switch size. Uses the same size names as DomButton.' },
	{ name: 'disabled', type: 'boolean', default: 'false', description: 'Disable interaction.' },
];
const keys = [
	{ k: 'Space / Enter', d: 'Toggle the value.' },
	{ k: 'Tab', d: 'Move focus through toggles in source order.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Toggle" tagline="Accessible switch with role=switch, keyboard support, and a smooth thumb animation." tag="<dom-toggle>">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomToggle"
					:initial="{ label: 'Notifications', modelValue: true, size: 'md' }"
					title="Toggle playground"
					description="Edit props in the inspector — the live switch and synthesised source stay in sync."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Live preview">
				<Demo>
					<div class="flex w-full max-w-sm flex-col gap-4">
						<DomToggle v-model="notifications" size="sm" label="Push notifications" />
						<DomToggle v-model="marketing" label="Marketing emails" />
						<DomToggle v-model="approvals" size="lg" label="Approval alerts" />
						<DomToggle :model-value="false" label="Disabled option" disabled />
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
