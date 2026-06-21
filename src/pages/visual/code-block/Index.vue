<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import { DomCodeBlock } from '../../lib/vue';

import CodeSnippet from './examples/CodeSnippet.vue';
import CodeSnippetSrc from './examples/CodeSnippet.vue?raw';
import CompactSnippet from './examples/CompactSnippet.vue';
import CompactSnippetSrc from './examples/CompactSnippet.vue?raw';

const doc = DomCodeBlock.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Visual primitive">
			<DocSection eyebrow="Usage" title="Package-ready syntax highlighting">
				<Example
					:source="CodeSnippetSrc"
					filename="CodeSnippet.vue"
					description="Use DomCodeBlock in any DOM Studio app or package consumer that imports the Vue surface and stylesheet."
				>
					<CodeSnippet />
				</Example>
			</DocSection>

			<DocSection eyebrow="Sizing" title="Clamp long snippets">
				<Example
					:source="CompactSnippetSrc"
					filename="CompactSnippet.vue"
					description="Set previewLines when a code block should stay compact inside a card, table detail, drawer, or changelog entry."
				>
					<CompactSnippet />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomCodeBlock" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
