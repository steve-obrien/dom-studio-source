<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCheckbox, DomDialog, DomNativeSelect, DomTabs, DomTextInput, DomTooltip } from '@getdom/studio/vue';

const collectionTabs = [
	{ key: 'all', label: 'All' },
	{ key: 'product', label: 'Product' },
	{ key: 'campaigns', label: 'Campaigns' },
	{ key: 'brand', label: 'Brand' },
	{ key: 'uploads', label: 'Uploads' },
];

const typeOptions = [
	{ label: 'All file types', value: 'all' },
	{ label: 'Images', value: 'image' },
	{ label: 'Video', value: 'video' },
	{ label: 'Documents', value: 'document' },
];

const sortOptions = [
	{ label: 'Recently updated', value: 'recent' },
	{ label: 'Most used', value: 'usage' },
	{ label: 'Largest files', value: 'size' },
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

function insertAssets() {
	if (!insertReady.value) return;
	inserted.value = true;
}

function typeLabel(type) {
	return {
		image: 'Image',
		video: 'Video',
		document: 'Doc',
	}[type] || type;
}

function statusClasses(status) {
	return {
		Approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		Review: 'bg-warning/15 text-warning',
		'Needs caption': 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
	}[status] || 'bg-secondary text-muted-fg';
}
</script>

<template>
	<div class="w-full overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-4 py-4 sm:px-5">
			<div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
				<div class="max-w-2xl">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Content library</p>
					<h3 class="mt-1 text-2xl font-semibold tracking-tight">Choose media assets</h3>
					<p class="mt-2 text-sm leading-6 text-muted-fg">
						Browse approved visuals, preview metadata, and insert selected assets into the current product surface.
					</p>
				</div>
				<div class="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_10rem_10rem] xl:w-[42rem]">
					<DomTextInput v-model="searchQuery" label="Search assets" placeholder="Search title, owner, or alt text" />
					<DomNativeSelect v-model="selectedType" label="Type" :options="typeOptions" />
					<DomNativeSelect v-model="selectedSort" label="Sort" :options="sortOptions" />
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
				<article
					v-for="asset in filteredAssets"
					:key="asset.id"
					class="group overflow-hidden rounded-2xl border bg-background shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
					:class="selectedAssetIds.includes(asset.id) ? 'border-primary/70 ring-2 ring-primary/15' : 'border-border'"
				>
					<button type="button" class="block w-full text-left" @click="openPreview(asset)">
						<div class="relative aspect-[4/3] overflow-hidden">
							<div class="absolute inset-0 bg-gradient-to-br" :class="asset.accent"></div>
							<div class="absolute inset-x-6 top-6 h-20 shadow-2xl shadow-black/15" :class="asset.shape"></div>
							<div class="absolute bottom-4 left-4 right-4 rounded-xl border border-white/50 bg-white/55 p-3 text-slate-950 shadow-lg backdrop-blur">
								<div class="h-2 w-2/3 rounded-full bg-slate-900/70"></div>
								<div class="mt-2 h-2 w-1/2 rounded-full bg-slate-900/30"></div>
								<div class="mt-3 grid grid-cols-3 gap-1.5">
									<span class="h-8 rounded-lg bg-white/70"></span>
									<span class="h-8 rounded-lg bg-white/45"></span>
									<span class="h-8 rounded-lg bg-white/30"></span>
								</div>
							</div>
							<span class="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
								{{ typeLabel(asset.type) }}
							</span>
							<span class="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="statusClasses(asset.status)">
								{{ asset.status }}
							</span>
						</div>
					</button>

					<div class="space-y-3 p-3">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<h4 class="truncate text-sm font-semibold">{{ asset.title }}</h4>
								<p class="mt-1 truncate text-xs text-muted-fg">{{ asset.collectionLabel }} / {{ asset.dimensions }}</p>
							</div>
							<button
								type="button"
								class="grid size-8 shrink-0 place-items-center rounded-full border transition"
								:class="selectedAssetIds.includes(asset.id) ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-background text-muted-fg hover:text-fg'"
								:aria-label="selectedAssetIds.includes(asset.id) ? `Remove ${asset.title}` : `Select ${asset.title}`"
								@click="toggleAsset(asset)"
							>
								<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
									<path v-if="selectedAssetIds.includes(asset.id)" d="m6 12 4 4 8-8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
									<path v-else d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
								</svg>
							</button>
						</div>
						<div class="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-fg">
							<span class="rounded-full bg-secondary px-2 py-1">{{ asset.size }}</span>
							<span class="rounded-full bg-secondary px-2 py-1">{{ asset.usage }} uses</span>
							<span class="rounded-full bg-secondary px-2 py-1">{{ asset.updatedAt }}</span>
						</div>
					</div>
				</article>
			</div>

			<div v-if="!filteredAssets.length" class="rounded-2xl border border-dashed border-border bg-background p-8 text-center">
				<p class="font-semibold">No assets match these filters</p>
				<p class="mt-2 text-sm text-muted-fg">Try another collection, turn off approved-only, or clear the search query.</p>
			</div>
		</main>

		<div class="sticky bottom-0 z-10 border-t border-border bg-background/95 px-4 py-3 shadow-2xl shadow-black/15 backdrop-blur sm:px-5">
			<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div class="min-w-0">
					<p class="text-sm font-semibold">{{ trayStatus }}</p>
					<p class="mt-1 text-xs text-muted-fg">
						{{ selectedAssets.length }} selected / {{ approvedSelectedCount }} approved / {{ selectedSize }} total
					</p>
				</div>
				<div class="flex min-w-0 flex-1 gap-2 overflow-x-auto lg:justify-center">
					<button
						v-for="asset in selectedAssets"
						:key="asset.id"
						type="button"
						class="flex min-w-44 items-center gap-2 rounded-xl border border-border bg-secondary/70 p-2 text-left"
						@click="openPreview(asset)"
					>
						<span class="size-10 shrink-0 rounded-lg bg-gradient-to-br" :class="asset.accent"></span>
						<span class="min-w-0">
							<span class="block truncate text-xs font-semibold">{{ asset.title }}</span>
							<span class="mt-0.5 block text-[11px] text-muted-fg">{{ asset.status }}</span>
						</span>
					</button>
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
				<div class="relative aspect-[4/3] overflow-hidden rounded-2xl">
					<div class="absolute inset-0 bg-gradient-to-br" :class="previewAsset.accent"></div>
					<div class="absolute inset-x-8 top-8 h-24 shadow-2xl shadow-black/15" :class="previewAsset.shape"></div>
					<div class="absolute bottom-5 left-5 right-5 rounded-xl border border-white/50 bg-white/55 p-3 text-slate-950 shadow-lg backdrop-blur">
						<div class="h-2 w-2/3 rounded-full bg-slate-900/70"></div>
						<div class="mt-2 h-2 w-1/2 rounded-full bg-slate-900/30"></div>
					</div>
				</div>
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
				</dl>
				<div class="rounded-2xl bg-secondary/70 p-3 text-sm leading-6">
					<p class="font-semibold">Alt text</p>
					<p class="mt-1 text-muted-fg">{{ previewAsset.alt || 'Missing alt text. Require a description before publishing this asset.' }}</p>
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
