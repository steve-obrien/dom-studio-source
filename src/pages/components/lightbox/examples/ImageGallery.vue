<script setup>
import { shallowRef, ref } from 'vue';
import { DomLightbox } from '@getdom/studio/vue';

const items = [
	{
		id: 'gallery-planning-wall',
		title: 'Planning wall',
		description: 'A quiet workspace image with enough texture to show the thumbnail-to-stage motion clearly.',
		alt: 'A planning wall with notes, sketches, and daylight across a desk.',
		src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&h=1067&q=85',
		thumbnail: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=640&h=427&q=75',
		width: 1600,
		height: 1067,
	},
	{
		id: 'gallery-product-table',
		title: 'Product table',
		description: 'The preview stage uses the item dimensions, so the enlarged media lands at the same aspect ratio as the source.',
		alt: 'A product planning table with devices and notebooks arranged for review.',
		src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&h=1000&q=85',
		thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=640&h=400&q=75',
		width: 1600,
		height: 1000,
	},
	{
		id: 'gallery-studio-detail',
		title: 'Studio detail',
		description: 'Navigation changes the staged image while the close animation still returns to the originating thumbnail.',
		alt: 'A close detail of design material, color cards, and stationery.',
		src: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&h=1750&q=85',
		thumbnail: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=560&h=700&q=75',
		width: 1400,
		height: 1750,
	},
	{
		id: 'gallery-workshop',
		title: 'Workshop',
		description: 'The lightbox is controlled from outside the grid, so it can later be reused for card, calendar, and kanban detail views.',
		alt: 'A team workshop table with laptops and paper notes.',
		src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&h=1067&q=85',
		thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=640&h=427&q=75',
		width: 1600,
		height: 1067,
	},
];

const open = ref(false);
const selectedIndex = ref(0);
const originRect = shallowRef(null);

/**
 * Open the lightbox from the clicked gallery card with a stable origin snapshot.
 *
 * @param {number} index Gallery item index.
 * @param {MouseEvent} event Click event used to capture the thumbnail origin.
 * @returns {void}
 */
function openItem(index, event) {
	selectedIndex.value = index;
	originRect.value = originRectFromEvent(event);
	open.value = true;
}

/**
 * Capture the clicked card bounds before Vue updates the overlay state.
 *
 * @param {MouseEvent} event Click event fired by the card button.
 * @returns {DOMRect|null} Snapshot of the clicked card bounds.
 */
function originRectFromEvent(event) {
	return event.currentTarget?.getBoundingClientRect?.() || null;
}

/**
 * Release the retained origin after the fly-back animation finishes.
 *
 * @returns {void}
 */
function resetOrigin() {
	originRect.value = null;
}
</script>

<template>
	<div class="mx-auto w-full max-w-5xl">
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<button
				v-for="(item, index) in items"
				:key="item.id"
				type="button"
				class="group overflow-hidden rounded-lg border border-border bg-secondary/30 text-left outline-none transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring"
				@click="openItem(index, $event)"
			>
				<img
					:src="item.thumbnail"
					:alt="item.alt"
					class="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
				/>
				<span class="block space-y-1 p-3">
					<span class="block truncate text-sm font-semibold tracking-tight text-canvas-fg">{{ item.title }}</span>
					<span class="block truncate text-xs text-muted-fg">{{ item.description }}</span>
				</span>
			</button>
		</div>
	</div>

	<DomLightbox
		v-model="open"
		v-model:index="selectedIndex"
		:items="items"
		:origin="originRect"
		:duration="520"
		@after-leave="resetOrigin"
	/>
</template>
