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
			tagline="A Cloudinary- and Contentful-inspired media workspace with API-backed search, ingestion recovery, metadata approval, archiving, and receipt-backed insertion."
			tag="Working API"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Content management" title="Media asset picker">
				<Example
					:source="MediaAssetPickerSrc"
					filename="MediaAssetPicker.vue"
					presentation="iframe"
					frame-src="/blocks/content-management/media/media-asset-picker/preview/MediaAssetPicker"
					description="Copy this complete app section into a CMS, product editor, marketing builder, or commerce admin where teams need to find, review, and insert publish-ready media."
					default-open
					:preview-lines="18"
				>
					<MediaAssetPicker />
				</Example>
			</DocSection>

			<DocSection eyebrow="Integration" title="How to use this block">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use this block when media selection includes real publishing responsibility, not only browsing.
						The composition pairs the reusable <code>DomMediaBrowser</code> with server-filtered collections, focused metadata review, an ingestion pipeline, and an always-visible insertion action.
					</p>
					<ul class="list-disc space-y-2 pl-5">
						<li>Load filter options and collection counts from <code>/api/block-demos/media-asset-library/bootstrap</code>, then query assets server-side by collection, type, readiness, sort, and search text.</li>
						<li>Persist selections as asset ids, not public URLs, so CDN transformations, permissions, and file replacements stay server-controlled.</li>
						<li>Run uploads through explicit validation, malware scanning, duplicate detection, and metadata extraction states; the demo includes a recoverable scanner outage.</li>
						<li>Save title, alt text, license, and tags with optimistic revisions. The server recalculates publishing readiness after every metadata mutation.</li>
						<li>Archive and restore through dedicated routes so placements, metadata, and activity remain auditable.</li>
						<li>Insert only approved assets and return a destination, timestamp, stable receipt id, and checksum as proof.</li>
						<li>The demo API is intentionally process-local. Production integrations should add authentication, authorization, durable storage, real binary upload, worker queues, provider webhooks, CDN signing, and immutable audit events.</li>
					</ul>
				</div>
			</DocSection>

			<DocSection eyebrow="Data" title="Recommended asset shape">
				<CodeBlock lang="js" filename="media-asset.js" :code="`{
\tid: 'asset-hero-dashboard',
\trevision: 4,
\ttitle: 'Workspace dashboard hero',
\tname: 'workspace-dashboard.jpg',
\tmimeType: 'image/jpeg',
\tcollection: 'product',
\tstatus: 'Approved',
\talt: 'Dashboard screen showing project health metrics and tasks.',
\tlicense: 'Company owned',
\twidth: 2400,
\theight: 1600,
\tsize: 842000,
\towner: 'Maya Chen',
\tusage: 12,
\tplacements: ['Homepage hero', 'Launch overview'],
\tupdatedAt: '2026-06-09T13:20:00Z',
\ttags: ['dashboard', 'product', 'launch'],
\tthumbnailUrl: 'https://cdn.example.com/assets/workspace-dashboard_thumb.jpg',
\tpublicUrl: 'https://cdn.example.com/assets/workspace-dashboard.jpg'
}`" />
			</DocSection>

			<DocSection eyebrow="Customization" title="Implementation notes">
				<div class="grid gap-3 text-sm leading-7 text-muted-fg md:grid-cols-3">
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">DOM Studio composition</h3>
						<p class="mt-2">Use <code>DomMediaBrowser</code> for selection and view modes, <code>DomSelect</code> for rich filters, and DOM Studio drawers, dialogs, alerts, upload, tags, status, and form controls for the surrounding workflow.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Publishing safety</h3>
						<p class="mt-2">Keep readiness server-owned. A non-empty form is not proof that an asset passed accessibility, license, permission, malware, and duplicate checks.</p>
					</div>
					<div class="rounded-lg border border-border skin-card p-4">
						<h3 class="font-semibold text-canvas-fg">Future updates</h3>
						<p class="mt-2">Useful follow-ups include signed direct-upload sessions, background processing progress, focal-point editing, asset replacement, version comparison, and provider-specific storage adapters.</p>
					</div>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
