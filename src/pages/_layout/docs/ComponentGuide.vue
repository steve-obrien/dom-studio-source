<script setup>
import { computed } from 'vue';
import DocSection from '../DocSection.vue';
import CodePanel from './CodePanel.vue';
import Example from './Example.vue';
import { createComponentExampleSources } from './componentExampleSources.js';

/**
 * Renders a component guide loaded with `import guide from './DomX.md?guide'`.
 * Prose and code come from the Markdown; each `<!-- example: Name -->` marker
 * renders the matching live example with its source.
 */
const props = defineProps({
	/** Sections from a `?guide` import. */
	guide: { type: Array, required: true },
	/** Example components keyed by file name, such as { TradingDeskGrid: { component, source } }. */
	examples: { type: Object, default: () => ({}) },
	installationMethod: { type: String, default: 'npm' },
});
const emit = defineEmits(['update:installationMethod']);

const sections = computed(() => props.guide.filter((section) => section.blocks.length));
const exampleSources = computed(() => Object.fromEntries(
	Object.entries(props.examples).map(([name, example]) => [name, createComponentExampleSources(example.source)]),
));

function updateInstallationMethod(value) {
	emit('update:installationMethod', value);
}
</script>

<template>
	<DocSection
		v-for="section in sections"
		:key="`${section.parent}/${section.title}`"
		:title="section.title"
		:eyebrow="section.parent"
	>
		<template v-for="(block, index) in section.blocks" :key="index">
			<div
				v-if="block.type === 'html'"
				class="max-w-3xl text-sm leading-7 text-muted-fg [&_a]:text-canvas-fg [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-canvas-fg [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_strong]:font-semibold [&_strong]:text-canvas-fg [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_td]:border-t [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:bg-secondary [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wider [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&>table]:block [&>table]:overflow-x-auto [&>table]:rounded-xl [&>table]:border [&>table]:border-border"
				v-html="block.html"
			/>

			<CodePanel
				v-else-if="block.type === 'code'"
				class="overflow-hidden rounded-lg border border-border"
				:source="block.source"
				:lang="block.lang"
				:border-top="false"
			/>

			<template v-else-if="block.type === 'example' && examples[block.name]">
				<Example
					:installation-method="installationMethod"
					:source="examples[block.name].source"
					:source-variants="exampleSources[block.name]"
					:filename="`${block.name}.vue`"
					:install-note="block.files.length ? `This example also uses ${block.files.map((file) => `${file}.vue`).join(' and ')}, available directly below.` : ''"
					:preview-lines="0"
					@update:installation-method="updateInstallationMethod"
				>
					<component :is="examples[block.name].component" />
				</Example>

				<div v-if="block.files.length" class="grid gap-4 lg:grid-cols-2">
					<div v-for="file in block.files" :key="file" class="min-w-0">
						<p class="mb-2 text-sm font-semibold text-canvas-fg">{{ file }}.vue</p>
						<CodePanel
							class="overflow-hidden rounded-lg border border-border"
							:source="examples[file]?.source || ''"
							:default-open="false"
							:border-top="false"
							:filename="`${file}.vue`"
							lang="vue"
						/>
					</div>
				</div>
			</template>
		</template>
	</DocSection>
</template>
