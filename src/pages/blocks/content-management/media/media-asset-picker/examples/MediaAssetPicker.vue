<script setup>
import { computed, ref } from 'vue';
import { DomBadge, DomButton, DomCheckbox, DomDialog, DomListbox, DomStatusPill, DomTabs, DomTextInput, DomTooltip } from '@getdom/studio/vue';
import AssetPreviewArtwork from '../components/AssetPreviewArtwork.vue';
import AssetTile from '../components/AssetTile.vue';
import SelectedAssetChip from '../components/SelectedAssetChip.vue';

const collectionTabs = [
	{ key: 'all', label: 'All' },
	{ key: 'product', label: 'Product' },
	{ key: 'campaigns', label: 'Campaigns' },
	{ key: 'brand', label: 'Brand' },
	{ key: 'uploads', label: 'Uploads' },
];

const typeOptions = [
	{ label: 'All file types', value: 'all', description: 'Images, videos, docs', count: 8, icon: 'M5 5h14v14H5V5Zm3 9 2.5-3 2 2.5 1.5-2 3 4H8Zm8-5.5h.01' },
	{ label: 'Images', value: 'image', description: 'Product and brand visuals', count: 6, icon: 'M5 5h14v14H5V5Zm3 9 2.5-3 2 2.5 1.5-2 3 4H8Zm8-5.5h.01' },
	{ label: 'Video', value: 'video', description: 'Clips and motion assets', count: 1, icon: 'M5 6h10v12H5V6Zm10 4 5-3v10l-5-3' },
	{ label: 'Documents', value: 'document', description: 'SVG, PDF, and packs', count: 1, icon: 'M7 4h7l4 4v12H7V4Zm7 0v5h5M10 13h5M10 17h4' },
];

const sortOptions = [
	{ label: 'Recently updated', value: 'recent', description: 'Best for active publishing work', metric: 'Default' },
	{ label: 'Most used', value: 'usage', description: 'Promote proven approved assets', metric: 'Usage' },
	{ label: 'Largest files', value: 'size', description: 'Find heavy assets before insert', metric: 'Weight' },
];

const assets = [
	{
		id: 'asset-dashboard-hero',
		title: 'Workspace dashboard hero',
		type: 'image',
		collection: 'product',
		collectionLabel: 'Product',
		dimensions: '2400 x 1600',
		size: '842 KB',
		sizeValue: 842,
		owner: 'Maya Chen',
		updatedAt: '8 minutes ago',
		usage: 12,
		status: 'Approved',
		review: 'Alt text and license verified',
		placement: 'Hero',
		alt: 'Dashboard screen showing project health metrics and tasks.',
		license: 'Company owned',
		accent: 'from-cyan-200 via-sky-300 to-indigo-500',
		shape: 'rounded-[2rem] bg-white/45',
	},
	{
		id: 'asset-checkout-card',
		title: 'Checkout card detail',
		type: 'image',
		collection: 'product',
		collectionLabel: 'Product',
		dimensions: '1800 x 1200',
		size: '618 KB',
		sizeValue: 618,
		owner: 'Oscar Reed',
		updatedAt: 'Today 09:42',
		usage: 8,
		status: 'Approved',
		review: 'Ready for production pages',
		placement: 'Checkout',
		alt: 'Payment review card with order total and shipping address.',
		license: 'Company owned',
		accent: 'from-emerald-200 via-teal-300 to-slate-700',
		shape: 'rounded-2xl bg-white/50',
	},
	{
		id: 'asset-launch-banner',
		title: 'Launch banner background',
		type: 'image',
		collection: 'campaigns',
		collectionLabel: 'Campaigns',
		dimensions: '3200 x 1400',
		size: '1.4 MB',
		sizeValue: 1400,
		owner: 'Growth Studio',
		updatedAt: 'Yesterday',
		usage: 19,
		status: 'Approved',
		review: 'Campaign license active',
		placement: 'Launch',
		alt: 'Colorful campaign artwork with layered product cards.',
		license: 'Licensed through 2027',
		accent: 'from-rose-300 via-orange-200 to-yellow-300',
		shape: 'rounded-full bg-black/20',
	},
	{
		id: 'asset-founder-video',
		title: 'Founder intro clip',
		type: 'video',
		collection: 'campaigns',
		collectionLabel: 'Campaigns',
		dimensions: '1920 x 1080',
		size: '18.2 MB',
		sizeValue: 18200,
		owner: 'Nina Patel',
		updatedAt: 'Jun 10',
		usage: 5,
		status: 'Needs caption',
		review: 'Caption file required',
		placement: 'Video',
		alt: 'Video thumbnail for a founder product announcement.',
		license: 'Company owned',
		accent: 'from-zinc-800 via-stone-600 to-amber-300',
		shape: 'rounded-full bg-white/35',
	},
	{
		id: 'asset-logo-pack',
		title: 'Partner logo pack',
		type: 'document',
		collection: 'brand',
		collectionLabel: 'Brand',
		dimensions: 'SVG set',
		size: '246 KB',
		sizeValue: 246,
		owner: 'Brand Team',
		updatedAt: 'Jun 08',
		usage: 26,
		status: 'Approved',
		review: 'Partner terms confirmed',
		placement: 'Brand',
		alt: 'Approved partner logo package for co-marketing pages.',
		license: 'Partner approved',
		accent: 'from-neutral-100 via-lime-200 to-emerald-500',
		shape: 'rounded-lg bg-black/20',
	},
	{
		id: 'asset-social-proof',
		title: 'Customer quote tile',
		type: 'image',
		collection: 'brand',
		collectionLabel: 'Brand',
		dimensions: '1600 x 1600',
		size: '512 KB',
		sizeValue: 512,
		owner: 'Maya Chen',
		updatedAt: 'Jun 07',
		usage: 14,
		status: 'Approved',
		review: 'Customer quote approved',
		placement: 'Social',
		alt: 'Square customer quote graphic for social proof sections.',
		license: 'Customer approved',
		accent: 'from-fuchsia-200 via-pink-300 to-red-500',
		shape: 'rounded-3xl bg-white/45',
	},
	{
		id: 'asset-upload-profile',
		title: 'Uploaded profile header',
		type: 'image',
		collection: 'uploads',
		collectionLabel: 'Uploads',
		dimensions: '2100 x 900',
		size: '734 KB',
		sizeValue: 734,
		owner: 'Alex Morgan',
		updatedAt: 'Jun 06',
		usage: 2,
		status: 'Review',
		review: 'Missing accessibility description',
		placement: 'Profile',
		alt: '',
		license: 'Pending review',
		accent: 'from-violet-200 via-indigo-200 to-cyan-500',
		shape: 'rounded-[1.75rem] bg-white/45',
	},
	{
		id: 'asset-product-empty',
		title: 'Empty state illustration',
		type: 'image',
		collection: 'product',
		collectionLabel: 'Product',
		dimensions: '1400 x 1000',
		size: '438 KB',
		sizeValue: 438,
		owner: 'Oscar Reed',
		updatedAt: 'Jun 05',
		usage: 7,
		status: 'Approved',
		review: 'Safe for onboarding flows',
		placement: 'Empty state',
		alt: 'Empty project state with a simple upload prompt.',
		license: 'Company owned',
		accent: 'from-sky-100 via-white to-emerald-300',
		shape: 'rounded-full bg-slate-900/15',
	},
];

const activeCollection = ref('all');
const selectedType = ref('all');
const selectedSort = ref('recent');
const searchQuery = ref('');
const selectedAssetIds = ref(['asset-dashboard-hero', 'asset-launch-banner']);
const requireApproved = ref(true);
const previewAssetId = ref(assets[0].id);
const previewOpen = ref(false);
const inserted = ref(false);

const filteredAssets = computed(() => {
	const query = searchQuery.value.trim().toLowerCase();
	const filtered = assets.filter((asset) => {
		const collectionMatch = activeCollection.value === 'all' || asset.collection === activeCollection.value;
		const typeMatch = selectedType.value === 'all' || asset.type === selectedType.value;
		const approvalMatch = !requireApproved.value || asset.status === 'Approved';
		const queryMatch = !query || [
			asset.title,
			asset.collectionLabel,
			asset.owner,
			asset.alt,
			asset.status,
		].join(' ').toLowerCase().includes(query);

		return collectionMatch && typeMatch && approvalMatch && queryMatch;
	});

	return [...filtered].sort((a, b) => {
		if (selectedSort.value === 'usage') return b.usage - a.usage;
		if (selectedSort.value === 'size') return b.sizeValue - a.sizeValue;
		return assets.indexOf(a) - assets.indexOf(b);
	});
});

const selectedAssets = computed(() => selectedAssetIds.value
	.map((id) => assets.find((asset) => asset.id === id))
	.filter(Boolean));
const previewAsset = computed(() => assets.find((asset) => asset.id === previewAssetId.value) || assets[0]);
const approvedSelectedCount = computed(() => selectedAssets.value.filter((asset) => asset.status === 'Approved').length);
const selectedSize = computed(() => {
	const total = selectedAssets.value.reduce((sum, asset) => sum + asset.sizeValue, 0);
	return total >= 1000 ? `${(total / 1000).toFixed(1)} MB` : `${total} KB`;
});
const insertReady = computed(() => selectedAssets.value.length > 0 && approvedSelectedCount.value === selectedAssets.value.length);
const reviewIssueCount = computed(() => selectedAssets.value.length - approvedSelectedCount.value);
const trayStatus = computed(() => {
	if (!selectedAssets.value.length) return 'Select media to insert';
	if (!insertReady.value) return 'Selection needs review';
	if (inserted.value) return 'Assets inserted';
	return 'Ready to insert';
});

function toggleAsset(asset) {
	inserted.value = false;
	if (selectedAssetIds.value.includes(asset.id)) {
		selectedAssetIds.value = selectedAssetIds.value.filter((id) => id !== asset.id);
		return;
	}
	selectedAssetIds.value = [...selectedAssetIds.value, asset.id];
}

function openPreview(asset) {
	previewAssetId.value = asset.id;
	previewOpen.value = true;
}

function clearSelection() {
	selectedAssetIds.value = [];
	inserted.value = false;
}

function removeAsset(asset) {
	selectedAssetIds.value = selectedAssetIds.value.filter((id) => id !== asset.id);
	inserted.value = false;
}

function insertAssets() {
	if (!insertReady.value) return;
	inserted.value = true;
}

function statusTone(status) {
	return {
		Approved: 'success',
		Review: 'warning',
		'Needs caption': 'info',
	}[status] || 'neutral';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-card px-4 py-4 sm:px-5">
			<div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Content library</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Choose media assets</h3>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Browse approved visuals, preview metadata, and insert selected assets into the current product surface.
					</p>
				</div>
				<div class="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_minmax(11rem,0.55fr)_minmax(11rem,0.55fr)] xl:w-[47rem]">
					<DomTextInput v-model="searchQuery" label="Search assets" placeholder="Search title, owner, or alt text" />
					<DomListbox v-model="selectedType" label="Type" :options="typeOptions">
						<template #option="{ option }">
							<span class="flex min-w-0 items-center gap-2">
								<span class="grid size-8 shrink-0 place-items-center rounded-lg bg-canvas/70">
									<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
										<path :d="option.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</span>
								<span class="min-w-0 flex-1">
									<span class="block truncate font-semibold">{{ option.label }}</span>
									<span class="block truncate text-[11px] opacity-75">{{ option.description }}</span>
								</span>
								<span class="rounded-full bg-canvas/70 px-2 py-0.5 text-[11px]">{{ option.count }}</span>
							</span>
						</template>
					</DomListbox>
					<DomListbox v-model="selectedSort" label="Sort" :options="sortOptions">
						<template #option="{ option }">
							<span class="flex min-w-0 items-center justify-between gap-3">
								<span class="min-w-0">
									<span class="block truncate font-semibold">{{ option.label }}</span>
									<span class="block truncate text-[11px] opacity-75">{{ option.description }}</span>
								</span>
								<span class="rounded-full bg-canvas/70 px-2 py-0.5 text-[11px]">{{ option.metric }}</span>
							</span>
						</template>
					</DomListbox>
				</div>
			</div>
		</header>

		<section class="border-b border-border px-4 py-3 sm:px-5">
			<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div class="asset-collection-tabs">
					<DomTabs v-model="activeCollection" :tabs="collectionTabs">
						<template #all><span class="sr-only">All assets</span></template>
						<template #product><span class="sr-only">Product assets</span></template>
						<template #campaigns><span class="sr-only">Campaign assets</span></template>
						<template #brand><span class="sr-only">Brand assets</span></template>
						<template #uploads><span class="sr-only">Uploaded assets</span></template>
					</DomTabs>
				</div>
				<div class="flex flex-wrap items-center gap-3">
					<DomCheckbox
						v-model="requireApproved"
						label="Approved only"
						description="Hide files that need caption, license, or brand review."
					/>
					<DomTooltip text="Upload hooks should connect to your file service and virus scan queue.">
						<DomButton size="sm" variant="secondary">
							<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M12 16V5M8 9l4-4 4 4M5 19h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
							Upload
						</DomButton>
					</DomTooltip>
				</div>
			</div>
		</section>

		<main class="bg-secondary/35 p-3 pb-28 sm:p-5 sm:pb-28">
			<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<AssetTile
					v-for="asset in filteredAssets"
					:key="asset.id"
					:asset="asset"
					:selected="selectedAssetIds.includes(asset.id)"
					@preview="openPreview"
					@toggle="toggleAsset"
				/>
			</div>

			<div v-if="!filteredAssets.length" class="rounded-2xl border border-dashed border-border bg-canvas p-8 text-center">
				<p class="font-semibold">No assets match these filters</p>
				<p class="mt-2 text-sm text-muted-fg">Try another collection, turn off approved-only, or clear the search query.</p>
			</div>
		</main>

		<div class="sticky bottom-0 z-10 border-t border-border bg-canvas/95 px-4 py-3 shadow-2xl shadow-black/15 backdrop-blur sm:px-5">
			<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-sm font-semibold">{{ trayStatus }}</p>
						<DomStatusPill v-if="reviewIssueCount" tone="warning" size="sm">{{ reviewIssueCount }} issue{{ reviewIssueCount === 1 ? '' : 's' }}</DomStatusPill>
						<DomBadge v-else-if="selectedAssets.length" tone="success" size="sm" variant="outline">Publish safe</DomBadge>
					</div>
					<p class="mt-1 text-xs text-muted-fg">
						{{ selectedAssets.length }} selected / {{ approvedSelectedCount }} approved / {{ selectedSize }} total
					</p>
				</div>
				<div class="flex min-w-0 flex-1 gap-2 overflow-x-auto lg:justify-center">
					<SelectedAssetChip
						v-for="asset in selectedAssets"
						:key="asset.id"
						:asset="asset"
						@preview="openPreview"
						@remove="removeAsset"
					/>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<DomButton variant="secondary" :disabled="!selectedAssets.length" @click="clearSelection">Clear</DomButton>
					<DomButton :disabled="!insertReady" @click="insertAssets">
						{{ inserted ? 'Inserted' : 'Insert selected' }}
					</DomButton>
				</div>
			</div>
		</div>

		<DomDialog v-model="previewOpen" :title="previewAsset.title" description="Review metadata before inserting this asset.">
			<div class="space-y-4">
				<AssetPreviewArtwork :asset="previewAsset" size="dialog" />
				<dl class="grid gap-3 text-sm sm:grid-cols-2">
					<div>
						<dt class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Owner</dt>
						<dd class="mt-1 font-medium">{{ previewAsset.owner }}</dd>
					</div>
					<div>
						<dt class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">License</dt>
						<dd class="mt-1 font-medium">{{ previewAsset.license }}</dd>
					</div>
					<div>
						<dt class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Size</dt>
						<dd class="mt-1 font-medium">{{ previewAsset.size }} / {{ previewAsset.dimensions }}</dd>
					</div>
					<div>
						<dt class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Usage</dt>
						<dd class="mt-1 font-medium">{{ previewAsset.usage }} placements</dd>
					</div>
					<div>
						<dt class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Review</dt>
						<dd class="mt-1 flex items-center gap-2 font-medium">
							<DomStatusPill :tone="statusTone(previewAsset.status)" size="sm">{{ previewAsset.status }}</DomStatusPill>
						</dd>
					</div>
				</dl>
				<div class="rounded-2xl bg-secondary/70 p-3 text-sm leading-6">
					<p class="font-semibold">Alt text</p>
					<p class="mt-1 text-muted-fg">{{ previewAsset.alt || 'Missing alt text. Require a description before publishing this asset.' }}</p>
				</div>
				<div class="rounded-2xl border border-border bg-canvas p-3 text-sm leading-6">
					<p class="font-semibold">Review signal</p>
					<p class="mt-1 text-muted-fg">{{ previewAsset.review }}</p>
				</div>
			</div>
			<template #footer>
				<DomButton data-close variant="secondary">Close</DomButton>
				<DomButton data-close @click="toggleAsset(previewAsset)">
					{{ selectedAssetIds.includes(previewAsset.id) ? 'Remove from selection' : 'Add to selection' }}
				</DomButton>
			</template>
		</DomDialog>
	</div>
</template>

<style scoped>
.asset-collection-tabs :deep(dom-tabs > div:nth-child(2)) {
	display: none;
}
</style>
