<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomTextDiff } from '../../lib/vue';

import CodeEdit from './examples/CodeEdit.vue';
import CodeEditSrc from './examples/CodeEdit.vue?raw';
import DocumentRewrite from './examples/DocumentRewrite.vue';
import DocumentRewriteSrc from './examples/DocumentRewrite.vue?raw';
import SeoMetaRewrite from './examples/SeoMetaRewrite.vue';
import SeoMetaRewriteSrc from './examples/SeoMetaRewrite.vue?raw';

const doc = DomTextDiff.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Visual primitive">
			<DocSection eyebrow="Playground" title="Compare text live">
				<Playground
					:inspect="DomTextDiff"
					:initial="{
						original: 'Write better pages with a flexible visual editor.',
						proposed: 'Create clearer pages with an editor built for focused teams.',
						mode: 'diff',
						view: 'inline',
						format: 'text',
						originalLabel: 'Current',
						proposedLabel: 'Suggested',
						showHeader: true,
						showModeSwitcher: true,
						framed: true,
					}"
					title="Text diff playground"
					description="Switch between the complete diff, current text, and finished replacement. Inline, unified, and split still control how the diff itself is arranged."
				/>
			</DocSection>

			<DocSection eyebrow="Code" title="Cursor-style file edit">
				<Example
					:source="CodeEditSrc"
					filename="CodeEdit.vue"
					description="Use the unified code view for a compact patch with line numbers and word-level emphasis inside changed lines."
					:preview-lines="24"
				>
					<CodeEdit />
				</Example>
			</DocSection>

			<DocSection eyebrow="Writing" title="Word processor suggestion">
				<Example
					:source="DocumentRewriteSrc"
					filename="DocumentRewrite.vue"
					description="Keep review actions app-owned while DomTextDiff renders the semantic insertion and deletion markup."
					:preview-lines="24"
				>
					<DocumentRewrite />
				</Example>
			</DocSection>

			<DocSection eyebrow="SEO" title="Meta description rewrite">
				<Example
					:source="SeoMetaRewriteSrc"
					filename="SeoMetaRewrite.vue"
					description="Compare the current metadata value with an AI replacement without embedding acceptance or persistence rules in the diff primitive."
					:preview-lines="22"
				>
					<SeoMetaRewrite />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomTextDiff" />
				<ComponentEvents :component="DomTextDiff" />
			</DocSection>

			<ComponentSlots :component="DomTextDiff" />
		</DocPage>
	</DomStudioLayout>
</template>
