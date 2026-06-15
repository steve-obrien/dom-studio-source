<script setup>
import { DomBadge, DomButton, DomCard, DomStatusPill } from '../../../lib/vue';

const assets = [
	{
		id: 'dashboard-hero',
		title: 'Workspace dashboard hero',
		collection: 'Product',
		dimensions: '2400 x 1600',
		size: '842 KB',
		owner: 'Maya Chen',
		placement: 'Hero',
		status: 'Approved',
		tone: 'success',
		alt: 'Dashboard screen showing project health metrics and tasks.',
		src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&h=675&q=80',
		position: 'center',
	},
	{
		id: 'launch-banner',
		title: 'Launch banner background',
		collection: 'Campaigns',
		dimensions: '3200 x 1400',
		size: '1.4 MB',
		owner: 'Growth Studio',
		placement: 'Launch',
		status: 'Approved',
		tone: 'success',
		alt: 'Colorful campaign artwork with layered product cards.',
		src: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=900&h=675&q=80',
		position: 'center',
	},
	{
		id: 'profile-header',
		title: 'Uploaded profile header',
		collection: 'Uploads',
		dimensions: '2100 x 900',
		size: '734 KB',
		owner: 'Alex Morgan',
		placement: 'Profile',
		status: 'Review',
		tone: 'warning',
		alt: 'Workspace table with notes, laptops, and planning materials.',
		src: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&h=675&q=80',
		position: 'center',
	},
];
</script>

<template>
	<div class="grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<DomCard
			v-for="asset in assets"
			:key="asset.id"
			as="article"
			padding="none"
			class="min-w-0"
		>
			<div class="relative aspect-[4/3] overflow-hidden bg-secondary">
				<img
					:src="asset.src"
					:alt="asset.alt"
					class="absolute inset-0 size-full object-cover"
					:style="{ objectPosition: asset.position }"
					loading="lazy"
					decoding="async"
				>
				<div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent"></div>
				<DomBadge class="absolute left-3 top-3 bg-black/55 text-white ring-white/20" size="sm">
					Image
				</DomBadge>
				<DomStatusPill class="absolute right-3 top-3" :tone="asset.tone" size="sm" :dot="false">
					{{ asset.status }}
				</DomStatusPill>
			</div>

			<div class="space-y-4 p-4">
				<div class="min-w-0">
					<h3 class="truncate text-sm font-semibold">{{ asset.title }}</h3>
					<p class="mt-1 truncate text-xs text-muted-fg">{{ asset.collection }} / {{ asset.dimensions }}</p>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<DomBadge size="sm" variant="outline">{{ asset.size }}</DomBadge>
					<DomBadge size="sm" variant="outline">4:3 preview</DomBadge>
				</div>

				<div class="flex items-center justify-between gap-3 border-t border-border pt-4">
					<p class="truncate text-xs text-muted-fg">{{ asset.owner }} / {{ asset.placement }}</p>
					<DomButton variant="secondary" size="sm">Preview</DomButton>
				</div>
			</div>
		</DomCard>
	</div>
</template>
