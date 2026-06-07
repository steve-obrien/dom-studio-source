<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Playground from '../../_layout/docs/Playground.vue';
import PropsTable from '../../_layout/PropsTable.vue';
import { DomTooltip, DomButton } from '../../lib/vue';

const usageVue = `<script setup>
import { DomTooltip, DomButton } from '@getdom/studio/vue';
<\/script>

<template>
  <DomTooltip text="Sync now (⌘+S)" placement="top">
    <DomButton variant="secondary">Save</DomButton>
  </DomTooltip>
</template>`;

const usageWeb = `<dom-tooltip text="Save your changes" placement="top" delay="120">
  <button>Save</button>
</dom-tooltip>`;

const props = [
	{ name: 'text', type: 'string', default: '—', description: 'Tooltip content.' },
	{ name: 'placement', type: "'top' | 'bottom' | 'left' | 'right'", default: "'top'", description: 'Position relative to the trigger.' },
	{ name: 'delay', type: 'number', default: '120', description: 'Show delay in ms.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Tooltip" tagline="Lightweight, accessible tooltip wired through aria-describedby — fires on hover and focus." tag="<dom-tooltip>">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomTooltip"
					:initial="{ text: 'Tooltip text', placement: 'top' }"
					title="Tooltip playground"
					description="Edit props in the inspector — hover or focus the trigger to preview placement and delay."
				>
					<DomButton variant="secondary">Hover me</DomButton>
				</Playground>
			</DocSection>

			<DocSection eyebrow="Demo" title="Live preview">
				<Demo>
					<div class="flex flex-wrap items-center gap-6">
						<DomTooltip text="Save (⌘+S)" placement="top">
							<DomButton variant="secondary">Top</DomButton>
						</DomTooltip>
						<DomTooltip text="Open settings" placement="bottom">
							<DomButton variant="secondary">Bottom</DomButton>
						</DomTooltip>
						<DomTooltip text="Previous" placement="left">
							<DomButton variant="secondary">Left</DomButton>
						</DomTooltip>
						<DomTooltip text="Next" placement="right">
							<DomButton variant="secondary">Right</DomButton>
						</DomTooltip>
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
