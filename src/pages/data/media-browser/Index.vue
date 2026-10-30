<script setup>
import { ref } from 'vue';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodePanel from '../../_layout/docs/CodePanel.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomMediaBrowser from './DomMediaBrowser.vue';
import DomMediaBrowserSrc from './DomMediaBrowser.vue?raw';
import MediaLibraryDemo from './examples/MediaLibraryDemo.vue';
import MediaLibraryDemoSrc from './examples/MediaLibraryDemo.vue?raw';
import MediaFilePickerField from './examples/MediaFilePickerField.vue';
import MediaFilePickerFieldSrc from './examples/MediaFilePickerField.vue?raw';
import StoreSrc from './examples/useMediaBrowserDemoStore.js?raw';
import MockApiSrc from './examples/mediaBrowserMockApi.js?raw';

const doc = DomMediaBrowser.__doc;
const selectedMediaId = ref('');
const selectedMediaIds = ref([]);

const schemaCode = `media
	ulid varchar(26) primary key
	root_id varchar(26) not null
	type enum('root', 'dir', 'file') not null
	path varchar(1024) not null
	parent_id varchar(26) null references media(ulid)
	file_uuid varchar(26) null references files(ulid)
	created_at datetime not null
	updated_at datetime not null

files
	ulid varchar(26) primary key
	name varchar(255) not null
	mime_type varchar(255) not null
	disk_path varchar(1024) not null
	size bigint unsigned not null
	public_url varchar(1024) null
	thumbnail_url varchar(1024) null
	meta json null
	created_at datetime not null
	updated_at datetime not null

unique index media_root_path_unique on media(root_id, path)
index media_parent_index on media(parent_id)
index media_file_index on media(file_uuid)`;

const endpointCode = `GET /api/media/roots/:rootId/folders?path=/Images

// Response
{
	folder: {
		ulid: 'media_images',
		type: 'dir',
		path: '/Images',
		parent_id: 'media_root_brand',
		file_uuid: null,
		name: 'Images',
	},
	data: [
		{
			ulid: 'media_hero',
			type: 'file',
			path: '/Images/hero-image.jpg',
			parent_id: 'media_images',
			file_uuid: 'file_hero',
			name: 'hero-image.jpg',
			file: {
				ulid: 'file_hero',
				name: 'hero-image.jpg',
				mimeType: 'image/jpeg',
				diskPath: 'brand/file_hero/hero-image.jpg',
				size: 842120,
				publicUrl: '/media/file_hero/hero-image.jpg',
				thumbnailUrl: '/media/file_hero/thumb.jpg',
				meta: { alt: 'Dashboard hero card', width: 1600, height: 900 },
			},
		},
	],
	breadcrumbs: [
		{ label: 'Root', path: '/', ulid: 'media_root_brand' },
		{ label: 'Images', path: '/Images', ulid: 'media_images' },
	],
	meta: {
		rootId: 'media_root_brand',
		path: '/Images',
		total: 1,
		requestedAt: '2026-07-01T10:00:00.000Z',
	},
}`;

const mutationCode = `POST /api/media/folders
{
	rootId: 'media_root_brand',
	parentId: 'media_images',
	path: '/Images',
	name: 'Campaign',
	tempUlid: 'temp_folder_lkx',
}

PATCH /api/media/:ulid
{
	name: 'Brand hero.jpg'
}

PATCH /api/media/move
{
	ulids: ['media_hero', 'media_product'],
	targetParentId: 'media_campaign',
}

PATCH /api/files/:fileUuid/meta
{
	meta: {
		alt: 'Product interface shown on a laptop',
		publicUrl: '/media/file_product/product-shot.png',
	}
}`;

const uploadCode = `POST /api/media/uploads
{
	rootId: 'media_root_brand',
	parentId: 'media_images',
	path: '/Images',
	chunkSize: 5242880,
	files: [
		{
			tempUlid: 'temp_upload_8',
			name: 'homepage.png',
			relativePath: 'homepage.png',
			pathSegments: ['homepage.png'],
			size: 628120,
			mimeType: 'image/png',
		},
		{
			tempUlid: 'temp_upload_9',
			name: 'detail.png',
			relativePath: 'Campaign/detail.png',
			pathSegments: ['Campaign', 'detail.png'],
			size: 450120,
			mimeType: 'image/png',
		},
	],
}

// Progress event emitted by the uploader service
{
	overall: 64,
	files: [
		{ tempUlid: 'temp_upload_8', progress: 68 },
		{ tempUlid: 'temp_upload_9', progress: 61 },
	],
}

// Completion response
{
	data: [
		/* created media rows, using tempUlid when the server accepts it */
	],
	visible: [
		/* canonical children for the current folder after upload */
	],
	meta: {
		action: 'upload-batch',
		total: 2,
		requestedAt: '2026-07-01T10:01:00.000Z',
	},
}`;

const routeCode = `// src/routes.js
{
	path: '/data/media-browser/:folderPath(.*)*',
	component: MediaBrowserPage,
	meta: routeMeta('/data/media-browser'),
}

// Inside a page that wraps DomMediaBrowser
function routePathForFolder(path) {
	if (path === '/') return '/data/media-browser';
	const encoded = path
		.split('/')
		.filter(Boolean)
		.map((segment) => encodeURIComponent(segment))
		.join('/');
	return \`/data/media-browser/\${encoded}\`;
}

function pathFromRouteParam(folderPath) {
	const parts = Array.isArray(folderPath) ? folderPath : [folderPath].filter(Boolean);
	return parts.length ? \`/\${parts.map(decodeURIComponent).join('/')}\` : '/';
}`;

const customRendererCode = `<DomMediaBrowser
	:items="store.items"
	:item-components="{
		image: ImageMediaTile,
		pdf: PdfMediaTile,
		default: FileMediaTile,
	}"
	:inspector-components="{
		image: ImageMetadataInspector,
		default: FileMetadataInspector,
	}"
	:detail-components="{
		image: { component: ImageMediaDetail, mode: 'dialog' },
		pdf: { component: PdfMediaDetail, mode: 'inline' },
	}"
/>

<!-- Or replace the whole visible row. -->
<template #item="{ item, kind, selected, rename }">
	<MyMediaRow
		:item="item"
		:kind="kind"
		:selected="selected"
		@rename="rename"
	/>
</template>`;

const storeConfigCode = `import { defineMediaBrowserStore } from '@getdom/studio/vue';

export const useProjectMediaStore = defineMediaBrowserStore('project-media', {
	rootId: 'media_root_brand',
	baseUrl: '/api/media',
	filesBaseUrl: '/api/files',
	mode: 'grid',
});

// The store updates currentPath and derived breadcrumbs immediately.
// Cached children stay visible while the server refresh request runs.
await store.loadFolder('/Images/Campaign');`;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Demo" title="Server-backed media library">
				<Example
					:source="MediaLibraryDemoSrc"
					filename="MediaLibraryDemo.vue"
					description="A Pinia setup store drives folder loading, optimistic folder creation, rename, move, metadata edits, route-aware navigation, picker selection, and emulated chunk uploads."
					:preview-lines="0"
				>
					<MediaLibraryDemo />
				</Example>
			</DocSection>

			<DocSection eyebrow="Forms" title="File picker field">
				<Example
					:source="MediaFilePickerFieldSrc"
					filename="MediaFilePickerField.vue"
					description="A form-style control opens DomMediaBrowser in a dialog, allows files to be uploaded or selected, then writes either a single media row id or an array of ids back into the form value."
					:preview-lines="0"
				>
					<div class="grid gap-4 xl:grid-cols-2">
						<MediaFilePickerField
							v-model="selectedMediaId"
							name="hero_media_id"
							store-id="single"
							test-id="single-media-picker"
						/>
						<MediaFilePickerField
							v-model="selectedMediaIds"
							multiple
							name="gallery_media_ids"
							label="Gallery media"
							description="The form model receives an array of selected media row ids, with shift-click, command-click, and rubber-band selection available in the dialog."
							store-id="multiple"
							test-id="multiple-media-picker"
						/>
					</div>
				</Example>
			</DocSection>

			<DocSection eyebrow="Architecture" title="Data model">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The media row is the folder structure. The file row is the stored object. Keeping them separate lets one uploaded file appear in multiple roots or folders while the binary, MIME type, size, and metadata stay canonical.
					</p>
					<p>
						This follows the data grid and month calendar pattern: the component renders current rows and emits intent, while the Pinia store owns fetching, optimistic updates, stale-response guards, cached folder data, and server mutation policy.
					</p>
				</div>
				<CodeBlock class="mt-5" :code="schemaCode" lang="sql" />
			</DocSection>

			<DocSection eyebrow="REST" title="Folder read endpoint">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Folder navigation reads one parent at a time. The store updates the route path and derived breadcrumbs immediately, keeps any cached rows visible, then merges the server response when it returns. The response includes the current folder, hydrated children, canonical breadcrumbs, and request metadata.
					</p>
				</div>
				<CodeBlock class="mt-5" :code="endpointCode" lang="js" />
			</DocSection>

			<DocSection eyebrow="Store" title="Configurable Pinia store">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The demo store exports a configured demo instance and a reusable store factory. Projects can provide REST endpoint roots or a custom API adapter with the same method names. Rows and files are stored in reactive object maps, so external inspector and detail components can observe file metadata updates without replacing the whole collection.
					</p>
				</div>
				<CodeBlock class="mt-5" :code="storeConfigCode" lang="js" />
			</DocSection>

			<DocSection eyebrow="REST" title="Optimistic mutations">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The store updates visible rows first, marks the row as saving, sends the REST request, then replaces the optimistic row with the canonical server response. Rename and move stay server-defined, so descendant paths and duplicate names are resolved by the API.
					</p>
				</div>
				<CodeBlock class="mt-5" :code="mutationCode" lang="js" />
			</DocSection>

			<DocSection eyebrow="Upload" title="Chunk upload contract">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						When uploads are enabled, the browser shows a persistent drag-and-drop prompt and an Upload files button. Button selection and drops emit the same upload payload; dropped folders remain folder-aware where the browser exposes relative paths. The store creates temporary media rows with upload status fields and image object previews; the upload service reports per-file and overall progress; completion returns canonical rows.
					</p>
					<p>
						The built-in context menu only opens when folder creation or rename actions are enabled. Picker configurations that disable those library mutations keep the browser's normal right-click behavior.
					</p>
				</div>
				<CodeBlock class="mt-5" :code="uploadCode" lang="js" />
			</DocSection>

			<DocSection eyebrow="Routing" title="Folder paths in the URL">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						Use a catch-all child route when a browser route should deep-link into folders. The page converts route params to the media path, loads the folder through the store, and pushes breadcrumb or folder navigation back into the URL.
					</p>
				</div>
				<CodeBlock class="mt-5" :code="routeCode" lang="js" />
			</DocSection>

			<DocSection eyebrow="Rendering" title="Custom file components">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The built-in renderer covers folder, image, pdf, and default file rows. Product teams can register components per kind, or replace the item, inspector, and detail slots entirely when a file type needs a bespoke preview, metadata editor, or full detail view. Detail components can open in a dialog or inline inside the browser; folders keep using the navigation event.
					</p>
				</div>
				<CodeBlock class="mt-5" :code="customRendererCode" lang="vue" />
			</DocSection>

			<DocSection eyebrow="Source" title="Store and mock API">
				<div class="grid gap-4 xl:grid-cols-2">
					<div class="min-w-0">
						<p class="mb-2 text-sm font-semibold text-canvas-fg">useMediaBrowserDemoStore.js</p>
						<CodePanel
							class="overflow-hidden rounded-lg border border-border"
							:source="StoreSrc"
							:preview-lines="0"
							:default-open="false"
							:border-top="false"
							filename="useMediaBrowserDemoStore.js"
							lang="js"
						/>
					</div>
					<div class="min-w-0">
						<p class="mb-2 text-sm font-semibold text-canvas-fg">mediaBrowserMockApi.js</p>
						<CodePanel
							class="overflow-hidden rounded-lg border border-border"
							:source="MockApiSrc"
							:preview-lines="0"
							:default-open="false"
							:border-top="false"
							filename="mediaBrowserMockApi.js"
							lang="js"
						/>
					</div>
				</div>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomMediaBrowser" :source="DomMediaBrowserSrc" />
				<ComponentEvents :component="DomMediaBrowser" :source="DomMediaBrowserSrc" />
				<ComponentSlots :component="DomMediaBrowser" :source="DomMediaBrowserSrc" />
				<ComponentKeyboard :component="DomMediaBrowser" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
