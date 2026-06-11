<script setup>
import DomStudioLayout from '../../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../../_layout/DocPage.vue';
import DocSection from '../../../../_layout/DocSection.vue';
import CodeBlock from '../../../../_layout/CodeBlock.vue';
import Example from '../../../../_layout/docs/Example.vue';
import MediaAssetPicker from './examples/MediaAssetPicker.vue';
import MediaAssetPickerSrc from './examples/MediaAssetPicker.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Media Asset Picker Block"
			tagline="A responsive gallery-first media picker with collection filters, asset preview, selection state, usage metadata, and an insertion tray."
			tag="Content UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Content management" title="Media asset picker">
				<Example
					:source="MediaAssetPickerSrc"
					filename="MediaAssetPicker.vue"
					presentation="iframe"
					frame-src="/blocks/content-management/media/media-asset-picker/preview/MediaAssetPicker"
					description="Copy this into a CMS, product editor, marketing builder, commerce admin, or profile customization flow. Replace the sample assets with your media API, upload pipeline, file permissions, and CDN metadata."
					default-open
					:preview-lines="14"
				>
					<MediaAssetPicker />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block anywhere a user needs to find, inspect, and insert existing media without leaving the workflow.
						The composition prioritizes fast visual scanning, metadata confidence, and an always-visible selected-assets tray instead of a heavy admin console.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Replace <code>assets</code> with records from your CMS, DAM, file service, object storage bucket, or upload API.</li>
						<li>Persist selections as asset ids, not public URLs, so later CDN transformations, permissions, and replacements remain server-controlled.</li>
						<li>Use collection and type filters as API query params when the asset library becomes too large to filter client-side.</li>
						<li>Connect the preview dialog to alt text, focal point, license, transformation, and usage controls when your product needs publishing safety.</li>
						<li>Keep the bottom tray mounted on mobile so users can select several assets without losing confirmation or insert context.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended asset shape">
				<CodeBlock lang="js" filename="media-asset.js" :code="`{
\tid: 'asset-hero-dashboard',
\ttitle: 'Workspace dashboard hero',
\ttype: 'image',
\tcollection: 'Product',
\tstatus: 'Approved',
\tsourceUrl: 'https://cdn.example.com/assets/workspace-dashboard.jpg',
\tthumbnailUrl: 'https://cdn.example.com/assets/workspace-dashboard_thumb.jpg',
\talt: 'Dashboard screen showing project health metrics and tasks.',
\tdimensions: { width: 2400, height: 1600 },
\tsizeBytes: 842000,
\townerId: 'user_123',
\tusageCount: 12,
\tupdatedAt: '2026-06-09T13:20:00Z',
\tlicense: 'Company owned',
\ttags: ['dashboard', 'product', 'launch'],
\tfocalPoint: { x: 0.46, y: 0.38 }
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Selection contract</h3>
						<p class="mt-2">Emit selected asset ids with ordered insert positions. Let the parent editor decide whether assets become images, attachments, gallery items, or references.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Publishing safety</h3>
						<p class="mt-2">Gate insertion on approval status, missing alt text, license coverage, or workspace permissions when assets can be exposed publicly.</p>
					</div>
					<div class="rounded-lg border border-border skin-raised p-4">
						<h3 class="font-semibold text-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include drag-to-reorder selection, upload drop zones, focal-point editors, duplicate detection, and provider-specific asset icons.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
