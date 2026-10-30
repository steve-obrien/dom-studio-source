<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Demo from '../../_layout/Demo.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import PropsTable from '../../_layout/PropsTable.vue';
import { DomTooltip, DomButton } from '../../lib/vue';

import TooltipDirective from './examples/Directive.vue';
import TooltipDirectiveSrc from './examples/Directive.vue?raw';
import ExplicitTarget from './examples/ExplicitTarget.vue';
import ExplicitTargetSrc from './examples/ExplicitTarget.vue?raw';

const usageWeb = `<dom-tooltip text="Save your changes" placement="top" delay="120">
  <button>Save</button>
</dom-tooltip>`;

const props = [
	{ name: 'for', type: 'string', default: "''", description: 'ID of an existing trigger. Leave empty to wrap the trigger in the default slot.' },
	{ name: 'text', type: 'string', default: '—', description: 'Tooltip content.' },
	{ name: 'placement', type: "'top' | 'bottom' | 'left' | 'right'", default: "'top'", description: 'Position relative to the trigger.' },
	{ name: 'delay', type: 'number', default: '120', description: 'Show delay in ms.' },
	{ name: 'offset', type: 'number', default: '6', description: 'Gap in pixels between trigger and tooltip.' },
	{ name: 'collisionPadding', type: 'number', default: '8', description: 'Viewport padding used when the tooltip flips or shifts.' },
	{ name: 'floatingMode', type: "'viewport' | 'anchor'", default: "'viewport'", description: 'Shared floating positioning mode.' },
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

			<DocSection eyebrow="Vue directive" title="Add presentation without a wrapper">
				<p class="mb-4 max-w-3xl text-sm leading-6 text-muted-fg">
					Import <code>vDomTooltip</code> and use <code>v-dom-tooltip</code> on a native element or a Vue component with one HTML root.
					Pass the tooltip text and append <code>.top</code>, <code>.right</code>, <code>.bottom</code>, or <code>.left</code> to set its placement.
					The object form remains available for dynamic placement and other options.
				</p>
				<Example
					:source="TooltipDirectiveSrc"
					filename="Directive.vue"
					description="Attach the tooltip directly to its trigger without adding a wrapper element."
				>
					<TooltipDirective />
				</Example>
			</DocSection>

			<DocSection eyebrow="Explicit target" title="Reference an element by id">
				<p class="mb-4 max-w-3xl text-sm leading-6 text-muted-fg">
					Use <code>for</code> when the tooltip should be declared separately from its trigger. The tooltip host registers only that element
					and does not scan or observe the document.
				</p>
				<Example
					:source="ExplicitTargetSrc"
					filename="ExplicitTarget.vue"
					description="Declare the tooltip separately and connect it to one element by id."
				>
					<ExplicitTarget />
				</Example>
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
