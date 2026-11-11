<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import PropsTable from '../../_layout/PropsTable.vue';
import { DomToggle } from '../../lib/vue';
import { ref } from 'vue';
import StateBadges from './examples/StateBadges.vue';
import StateBadgesSrc from './examples/StateBadges.vue?raw';
import PersistentLabels from './examples/PersistentLabels.vue';
import PersistentLabelsSrc from './examples/PersistentLabels.vue?raw';
import SettingsStates from './examples/SettingsStates.vue';
import SettingsStatesSrc from './examples/SettingsStates.vue?raw';
import InsetLabels from './examples/InsetLabels.vue';
import InsetLabelsSrc from './examples/InsetLabels.vue?raw';

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
	{ name: 'showState', type: 'boolean', default: 'false', description: 'Show On or Off inside a wider switch track.' },
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
			<DocSection eyebrow="Examples" title="Make On and Off explicit">
				<p class="max-w-2xl text-sm leading-6 text-muted-fg">
					Pair the switch with visible state text so its value is clear without relying on colour or thumb position.
					Keep the setting label the same as the state changes; On and Off describe the current value.
				</p>
				<Example
					:source="InsetLabelsSrc"
					filename="InsetLabels.vue"
					title="On / Off inside the switch"
					description="Use showState to put the current value in the track. The wider switch keeps the text clear of the thumb at every size."
				>
					<InsetLabels />
				</Example>
				<Example
					:source="StateBadgesSrc"
					filename="StateBadges.vue"
					title="An On / Off badge"
					description="A check or minus symbol and a written state update together when you toggle the switch."
				>
					<StateBadges />
				</Example>
				<Example
					:source="PersistentLabelsSrc"
					filename="PersistentLabels.vue"
					title="Both states always visible"
					description="Keep Off and On on either side of the switch. Bold, underlined text marks the current state."
				>
					<PersistentLabels />
				</Example>
				<Example
					:source="SettingsStatesSrc"
					filename="SettingsStates.vue"
					title="Explain what the state means"
					description="Settings rows pair the current value with its effect. Disabled switches still show whether they are On or Off."
				>
					<SettingsStates />
				</Example>
			</DocSection>

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
