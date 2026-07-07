<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomJsonViewer } from '../../lib/vue';

import ApiResponseViewer from './examples/ApiResponseViewer.vue';
import ApiResponseViewerSrc from './examples/ApiResponseViewer.vue?raw';
import RawPayloadViewer from './examples/RawPayloadViewer.vue';
import RawPayloadViewerSrc from './examples/RawPayloadViewer.vue?raw';

const doc = DomJsonViewer.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Inspect a JSON value">
				<Playground
					:inspect="DomJsonViewer"
					:initial="{
						title: 'API response',
						filename: 'response.json',
						value: {
							ok: true,
							data: {
								id: 'workspace_dom',
								status: 'active',
								features: ['docs', 'components', 'blocks'],
							},
						},
						expandedDepth: 2,
					}"
					title="JSON viewer playground"
					description="Pass a parsed value or raw JSON string, then choose between the collapsible tree and highlighted source view."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Collapsible API response">
				<Example
					:source="ApiResponseViewerSrc"
					filename="ApiResponseViewer.vue"
					description="Tree mode keeps nested objects readable while preserving a code view for exact source output."
				>
					<ApiResponseViewer />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Raw JSON payload">
				<Example
					:source="RawPayloadViewerSrc"
					filename="RawPayloadViewer.vue"
					description="Raw strings are parsed, formatted, syntax highlighted, and copied as normalized JSON."
				>
					<RawPayloadViewer />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomJsonViewer" />
			</DocSection>

			<ComponentEvents :component="DomJsonViewer" />
		</DocPage>
	</DomStudioLayout>
</template>
