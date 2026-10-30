<script setup>
import { computed, ref } from 'vue';
import { DomPopover, DomSelect } from '@getdom/studio/vue';

const selectedType = ref('guide-how-to');
const contentTypes = [
	{
		id: 'guide-how-to',
		typeLabel: 'Guide',
		subtypeLabel: 'How-to',
		description: 'Step-by-step guidance that helps readers complete a specific task with sequential, testable actions.',
	},
	{
		id: 'guide-explainer',
		typeLabel: 'Guide',
		subtypeLabel: 'Explainer',
		description: 'Educational content that builds understanding of a topic, concept, or process without forcing a step-by-step structure.',
	},
	{
		id: 'guide-comparison',
		typeLabel: 'Guide',
		subtypeLabel: 'Focused comparison',
		description: 'A focused side-by-side analysis of a small number of options for readers making a specific decision.',
	},
	{
		id: 'guide-reference',
		typeLabel: 'Guide',
		subtypeLabel: 'Reference',
		description: 'A scannable lookup resource for definitions, requirements, prices, statistics, benchmarks, or terminology.',
	},
	{
		id: 'listicle-comparison',
		typeLabel: 'Listicle',
		subtypeLabel: 'Comparison list',
		description: 'A multi-option list that evaluates products or services using the same practical criteria.',
	},
	{
		id: 'listicle-round-up',
		typeLabel: 'Listicle',
		subtypeLabel: 'Round-up',
		description: 'A curated collection of tips, recommendations, strategies, or ideas organized around a common theme.',
	},
	{
		id: 'listicle-resources',
		typeLabel: 'Listicle',
		subtypeLabel: 'Resources',
		description: 'A practical collection of external tools, software, templates, websites, or resources readers can use.',
	},
	{
		id: 'listicle-examples',
		typeLabel: 'Listicle',
		subtypeLabel: 'Examples',
		description: 'A showcase of real-world implementations, case studies, samples, or inspirational examples.',
	},
];

const options = contentTypes.map(toSelectOption);
const selectedItem = computed(() => contentTypes.find((item) => item.id === selectedType.value));

/**
 * Adapt an application-owned content type record to the DomSelect option contract.
 *
 * @param {{ id: string, typeLabel: string, subtypeLabel: string, description: string }} item Content type record.
 * @returns {Object} Select option that retains the original application fields.
 */
function toSelectOption(item) {
	return {
		...item,
		value: item.id,
		label: item.subtypeLabel,
		group: item.typeLabel,
	};
}
</script>

<template>
	<div class="grid w-full max-w-xl gap-3">
		<DomSelect
			v-model="selectedType"
			label="Content type"
			description="Choose the structure that best matches the reader's intent."
			:options="options"
			searchable
			search-placeholder="Search content types..."
			width="w-[min(34rem,calc(100vw-2rem))]"
		>
			<template #option="{ option, optionId }">
				<span class="block font-medium">{{ option.label }}</span>
				<DomPopover
					:trigger-id="optionId"
					trigger="hover"
					position="end"
					width="w-72 max-w-[calc(100vw-2rem)]"
					padding="p-3"
				>
					<p class="leading-5 text-muted-fg">{{ option.description }}</p>
				</DomPopover>
			</template>
		</DomSelect>

		<p class="text-xs text-muted-fg">
			Selected: <code class="text-canvas-fg">{{ selectedItem?.typeLabel }} / {{ selectedItem?.subtypeLabel }}</code>
		</p>
	</div>
</template>
