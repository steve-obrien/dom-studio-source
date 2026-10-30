<script setup>
import { DomCard, DomCardRail } from '../../../lib/vue';

const categoryItems = [
	{
		id: 'laptop',
		label: 'Laptops',
		image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=320&h=220&q=80',
		alt: 'Silver laptop on a desk.',
	},
	{
		id: 'phone',
		label: 'Phones',
		image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=320&h=220&q=80',
		alt: 'Smartphone shown at an angle.',
	},
	{
		id: 'tablet',
		label: 'Tablets',
		image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=320&h=220&q=80',
		alt: 'Tablet with a bright screen.',
	},
	{
		id: 'watch',
		label: 'Watches',
		image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=320&h=220&q=80',
		alt: 'Modern smartwatch face.',
	},
	{
		id: 'audio',
		label: 'Audio',
		image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=320&h=220&q=80',
		alt: 'Wireless earbuds in a charging case.',
	},
	{
		id: 'accessories',
		label: 'Accessories',
		image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=320&h=220&q=80',
		alt: 'Over-ear headphones on a clean surface.',
	},
];

const latestCards = [
	{
		id: 'phone-pro',
		eyebrow: '',
		title: 'Aster Phone Pro',
		subtitle: 'All out performance.',
		price: 'From GBP 999 or GBP 41.62/mo. for 24 mo.',
		image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=900&h=900&q=80',
		alt: 'Premium smartphone with a reflective screen.',
		tone: 'dark',
	},
	{
		id: 'laptop-neo',
		eyebrow: 'New',
		title: 'StudioBook Neo',
		subtitle: 'The magic of portable power at a surprising price.',
		price: 'From GBP 599 or GBP 49.91/mo. for 12 mo.',
		image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&h=900&q=80',
		alt: 'Open laptop balanced on a table.',
		tone: 'light',
	},
	{
		id: 'watch-band',
		eyebrow: 'New',
		title: 'Pride Edition Sport Loop',
		subtitle: 'A vibrant woven band for every day.',
		price: 'From GBP 49 or GBP 4.08/mo. for 12 mo.',
		image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&h=900&q=80',
		alt: 'Smartwatch with a colorful watch face.',
		tone: 'light',
	},
	{
		id: 'phone-lite',
		eyebrow: '',
		title: 'Aster Phone 17e',
		subtitle: 'Feature stacked. Value packed.',
		price: 'From GBP 599 or GBP 24.95/mo. for 24 mo.',
		image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&h=900&q=80',
		alt: 'Smartphone held in one hand.',
		tone: 'light',
	},
];

const supportCards = [
	{
		id: 'specialist',
		eyebrow: 'Store specialist',
		title: 'Shop one on one with a Specialist.',
		subtitle: 'Online or in a store.',
		image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=900&h=900&q=80',
		alt: 'Friendly retail specialist smiling.',
		variant: 'portrait',
	},
	{
		id: 'video',
		eyebrow: '',
		title: 'Shop with a Specialist over video.',
		subtitle: 'Choose your next device in a guided one-way video session.',
		image: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=900&h=900&q=80',
		alt: 'Phone video call interface held in a hand.',
		variant: 'device',
	},
	{
		id: 'session',
		eyebrow: 'Today in store',
		title: 'Explore intelligence features.',
		subtitle: 'Try it for yourself in a free hands-on session.',
		image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1100&h=900&q=80',
		alt: 'People learning together in a bright retail space.',
		variant: 'photo',
	},
	{
		id: 'learn',
		eyebrow: 'Today in store',
		title: 'Join free sessions at your local store.',
		subtitle: 'Learn the latest features and go further with every device.',
		image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1100&h=900&q=80',
		alt: 'Small group collaborating around a table.',
		variant: 'photo',
	},
];

const differenceCards = [
	{
		id: 'trade-in',
		color: 'text-primary',
		icon: 'M7 7h10v10H7V7Zm-2 3H3v7a2 2 0 0 0 2 2h7v-2H5v-7Zm7-5h7v7h2V5a2 2 0 0 0-2-2h-7v2Zm-2 5h4v4h-4v-4Z',
		before: 'Trade in your current device.',
		accent: 'Get credit',
		after: 'toward a new one.',
	},
	{
		id: 'payments',
		color: 'text-success',
		icon: 'M4 7h16v10H4V7Zm0 3h16M7 14h4',
		before: 'Pay in full or',
		accent: 'pay over time.',
		after: 'Your choice.',
	},
	{
		id: 'engraving',
		color: 'text-fuchsia-500',
		icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9 10h.01M15 10h.01M8.5 14.5c1.7 1.5 5.3 1.5 7 0',
		before: 'Make them yours.',
		accent: 'Engrave emoji, names, and numbers.',
		after: 'For free.',
	},
	{
		id: 'delivery',
		color: 'text-emerald-600',
		icon: 'M3 7h11v9H3V7Zm11 3h3l3 3v3h-6v-6ZM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
		before: 'Enjoy two-hour delivery',
		accent: 'free delivery, or easy pickup.',
		after: '',
	},
	{
		id: 'app',
		color: 'text-blue-600',
		icon: 'M8 4h8a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm3 4v8M14 8v8M10 11h5',
		before: 'Get a personalized',
		accent: 'shopping experience',
		after: 'in the Store app.',
	},
];

const accessoryCards = [
	{
		id: 'bundle',
		type: 'feature',
		title: 'Here and wow.',
		subtitle: 'The accessories you love. In a fresh mix of colors.',
		image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&h=900&q=80',
		alt: 'Colorful headphones and tech accessories.',
	},
	{
		id: 'case',
		eyebrow: 'New',
		title: 'Aster Phone Silicone Case with MagSafe - Guava',
		price: 'GBP 49.00',
		image: 'https://images.unsplash.com/photo-1602524816200-77111955970f?auto=format&fit=crop&w=900&h=900&q=80',
		alt: 'Bright phone case on a neutral background.',
		swatches: ['bg-rose-400', 'bg-orange-100', 'bg-slate-300', 'bg-stone-500', 'bg-zinc-700'],
	},
	{
		id: 'strap',
		eyebrow: 'New',
		title: 'Crossbody Strap - Bright Guava',
		price: 'GBP 59.00',
		image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&h=900&q=80',
		alt: 'Bright strap accessory photographed on fabric.',
		swatches: ['bg-rose-100', 'bg-rose-400', 'bg-lime-200', 'bg-slate-300', 'bg-stone-300'],
	},
	{
		id: 'charger',
		eyebrow: '',
		title: 'Magnetic Fast Charger (1 m)',
		price: 'GBP 39.00',
		image: 'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?auto=format&fit=crop&w=900&h=900&q=80',
		alt: 'White charging cable on a clean background.',
		swatches: [],
	},
	{
		id: 'clear-case',
		eyebrow: 'New',
		title: 'Aster Phone 17e Clear Case with MagSafe',
		price: 'GBP 49.00',
		image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&h=900&q=80',
		alt: 'Clear phone case with a phone inside.',
		swatches: ['bg-rose-100', 'bg-white'],
	},
];
</script>

<template>
	<div class="store-example min-w-0 max-w-full rounded-3xl border border-border bg-secondary/70 p-4 text-canvas-fg shadow-xl shadow-black/5 sm:w-full sm:p-6 lg:p-8">
		<header class="flex flex-col gap-4 pb-8 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<p class="text-sm font-semibold text-muted-fg">Store</p>
				<h3 class="mt-2 max-w-3xl break-words text-3xl font-semibold leading-tight tracking-normal text-canvas-fg sm:text-4xl">
					Shop the devices and accessories that fit your day.
				</h3>
			</div>
			<div class="grid gap-2 text-sm text-muted-fg">
				<a href="#specialist" class="font-semibold text-primary">Ask a Specialist</a>
				<a href="#visit" class="font-semibold text-primary">Find a store</a>
			</div>
		</header>

		<DomCardRail class="store-rail" aria-label="Shop product categories" style="--dom-card-rail-gap: 1.5rem;">
			<a
				v-for="category in categoryItems"
				:key="category.id"
				href="#"
				class="store-category"
			>
				<img :src="category.image" :alt="category.alt" loading="lazy" decoding="async">
				<span>{{ category.label }}</span>
			</a>
		</DomCardRail>

		<DomCardRail class="store-rail mt-12" aria-label="Latest products" style="--dom-card-rail-gap: 1.25rem;">
			<template #header>
				<h4 class="store-section-title">Fresh arrivals. <span>See what is ready right now.</span></h4>
			</template>

			<DomCard
				v-for="card in latestCards"
				:key="card.id"
				as="article"
				padding="none"
				class="store-promo-card"
				:class="card.tone === 'dark' && 'store-promo-card--dark'"
			>
				<div class="store-promo-copy">
					<p class="store-eyebrow">{{ card.eyebrow }}</p>
					<h5>{{ card.title }}</h5>
					<p class="store-subtitle">{{ card.subtitle }}</p>
					<p class="store-price">{{ card.price }}</p>
				</div>
				<img class="store-promo-image" :src="card.image" :alt="card.alt" loading="lazy" decoding="async">
			</DomCard>
		</DomCardRail>

		<DomCardRail id="specialist" class="store-rail mt-12" aria-label="Shopping help" style="--dom-card-rail-gap: 1.25rem;">
			<template #header>
				<h4 class="store-section-title">Help on hand. <span>Choose the shopping support that suits you.</span></h4>
			</template>

			<DomCard
				v-for="card in supportCards"
				:key="card.id"
				as="article"
				padding="none"
				class="store-service-card"
				:class="`store-service-card--${card.variant}`"
				:style="{ '--store-card-image': `url(${card.image})` }"
			>
				<div class="store-service-content">
					<p class="store-eyebrow">{{ card.eyebrow }}</p>
					<h5>{{ card.title }}</h5>
					<p>{{ card.subtitle }}</p>
				</div>
				<img
					v-if="card.variant !== 'photo'"
					class="store-service-image"
					:src="card.image"
					:alt="card.alt"
					loading="lazy"
					decoding="async"
				>
			</DomCard>
		</DomCardRail>

		<DomCardRail class="store-rail mt-12" aria-label="Store difference" style="--dom-card-rail-gap: 1rem;">
			<template #header>
				<h4 class="store-section-title">The Store difference. <span>More reasons to shop with confidence.</span></h4>
			</template>

			<DomCard
				v-for="item in differenceCards"
				:key="item.id"
				as="article"
				padding="lg"
				class="store-difference-card"
			>
				<svg viewBox="0 0 24 24" class="size-9" :class="item.color" fill="none" aria-hidden="true">
					<path :d="item.icon" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
				<h5>
					{{ item.before }}
					<span :class="item.color">{{ item.accent }}</span>
					{{ item.after }}
				</h5>
			</DomCard>
		</DomCardRail>

		<DomCardRail id="visit" class="store-rail mt-12" aria-label="Accessories" style="--dom-card-rail-gap: 1.25rem;">
			<template #header>
				<h4 class="store-section-title">Accessories. <span>Essentials that pair perfectly with your favorite devices.</span></h4>
			</template>

			<DomCard
				v-for="item in accessoryCards"
				:key="item.id"
				as="article"
				padding="none"
				class="store-accessory-card"
				:class="item.type === 'feature' && 'store-accessory-card--feature'"
			>
				<div class="store-accessory-media">
					<img :src="item.image" :alt="item.alt" loading="lazy" decoding="async">
				</div>

				<div class="store-accessory-copy">
					<div v-if="item.type === 'feature'">
						<h5>{{ item.title }}</h5>
						<p>{{ item.subtitle }}</p>
					</div>
					<div v-else class="grid h-full gap-4">
						<div class="store-swatches" aria-label="Available colors">
							<span
								v-for="swatch in item.swatches"
								:key="swatch"
								class="store-swatch"
								:class="swatch"
							></span>
							<span v-if="item.swatches.length" class="text-xs text-muted-fg">+</span>
						</div>
						<div>
							<p class="store-eyebrow">{{ item.eyebrow }}</p>
							<h5>{{ item.title }}</h5>
						</div>
						<p class="self-end text-sm text-muted-fg">{{ item.price }}</p>
					</div>
				</div>
			</DomCard>
		</DomCardRail>

	</div>
</template>

<style scoped>
.store-example {
	--store-card-muted: var(--muted-fg);
}

.store-rail {
	--dom-card-rail-edge: 0.25rem;
}

.store-section-title {
	max-width: 54rem;
	color: var(--canvas-fg);
	font-size: 1.45rem;
	font-weight: 700;
	letter-spacing: 0;
	line-height: 1.15;
}

.store-section-title span {
	color: var(--muted-fg);
}

.store-category {
	display: grid;
	width: 7.5rem;
	justify-items: center;
	gap: 0.75rem;
	color: var(--canvas-fg);
	font-weight: 650;
	text-align: center;
	text-decoration: none;
}

.store-category img {
	width: 7rem;
	height: 5rem;
	border-radius: var(--radius-xl);
	object-fit: cover;
	box-shadow: var(--shadow-sm);
}

.store-promo-card {
	--store-card-muted: var(--muted-fg);
	width: min(28rem, 78vw);
	height: 30rem;
	display: grid;
	grid-template-rows: auto minmax(0, 1fr);
}

.store-promo-card--dark {
	--skin-card-bg: oklch(0.12 0 0);
	--skin-card-border: transparent;
	--skin-card-fg: oklch(0.98 0 0);
	--store-card-muted: oklch(0.84 0 0);
}

.store-promo-copy {
	position: relative;
	z-index: 1;
	padding: 2rem 2rem 0;
	color: var(--skin-card-fg, var(--canvas-fg));
}

.store-eyebrow {
	min-height: 1.1rem;
	color: var(--destructive);
	font-size: 0.72rem;
	font-weight: 800;
	letter-spacing: 0.03em;
	text-transform: uppercase;
}

.store-promo-copy h5,
.store-service-content h5,
.store-accessory-copy h5 {
	margin-top: 0.4rem;
	font-size: 1.65rem;
	font-weight: 750;
	letter-spacing: 0;
	line-height: 1.08;
}

.store-subtitle,
.store-price,
.store-service-content p,
.store-accessory-copy p {
	margin-top: 0.65rem;
	color: var(--store-card-muted, var(--muted-fg));
	font-size: 0.95rem;
	line-height: 1.35;
}

.store-price {
	font-weight: 500;
}

.store-promo-image {
	align-self: end;
	width: 100%;
	height: 19rem;
	object-fit: cover;
	object-position: center;
}

.store-service-card {
	width: min(30rem, 82vw);
	height: 28rem;
	display: grid;
	grid-template-rows: auto minmax(0, 1fr);
}

.store-service-card--photo {
	--skin-card-border: transparent;
	background-image:
		linear-gradient(180deg, color-mix(in oklab, var(--canvas) 94%, transparent), color-mix(in oklab, var(--canvas) 18%, transparent)),
		var(--store-card-image);
	background-position: center;
	background-size: cover;
}

.store-service-card--photo .store-service-content {
	max-width: 20rem;
}

.store-service-content {
	position: relative;
	z-index: 1;
	padding: 2rem 2rem 0;
}

.store-service-image {
	align-self: end;
	width: 100%;
	height: 18rem;
	object-fit: cover;
	object-position: center top;
}

.store-service-card--device .store-service-image {
	object-fit: contain;
	padding-inline: 2rem;
}

.store-difference-card {
	width: min(20rem, 76vw);
	height: 12rem;
	display: grid;
	align-content: start;
	gap: 1rem;
}

.store-difference-card h5 {
	font-size: 1.35rem;
	font-weight: 750;
	letter-spacing: 0;
	line-height: 1.13;
}

.store-accessory-card {
	width: min(20rem, 78vw);
	height: 30rem;
	display: grid;
	grid-template-rows: minmax(15rem, 1fr) 13rem;
}

.store-accessory-card--feature {
	width: min(25rem, 82vw);
}

.store-accessory-media {
	display: grid;
	place-items: end center;
	min-height: 0;
	padding: 2rem 1.5rem 0;
}

.store-accessory-media img {
	max-width: 100%;
	max-height: 17rem;
	border-radius: var(--radius-xl);
	object-fit: cover;
}

.store-accessory-card--feature .store-accessory-media img {
	width: 100%;
	height: 18rem;
}

.store-accessory-copy {
	display: grid;
	min-height: 0;
	padding: 1.35rem 1.5rem 1.5rem;
}

.store-accessory-copy h5 {
	font-size: 1rem;
	line-height: 1.18;
}

.store-accessory-card--feature .store-accessory-copy {
	align-content: start;
	order: -1;
	padding: 2rem 2rem 0;
}

.store-accessory-card--feature .store-accessory-copy h5 {
	font-size: 1.55rem;
}

.store-swatches {
	display: flex;
	min-height: 1rem;
	align-items: center;
	justify-content: center;
	gap: 0.35rem;
}

.store-swatch {
	width: 0.7rem;
	height: 0.7rem;
	border: 1px solid var(--border);
	border-radius: 999px;
	box-shadow: var(--shadow-xs);
}

@media (max-width: 640px) {
	.store-example {
		border-radius: var(--radius-2xl);
	}

	.store-promo-copy,
	.store-service-content,
	.store-accessory-copy,
	.store-accessory-card--feature .store-accessory-copy {
		padding-inline: 1.35rem;
	}

	.store-promo-card,
	.store-service-card,
	.store-accessory-card {
		height: 27rem;
	}
}

@media (min-width: 768px) {
	.store-section-title {
		font-size: 2rem;
	}
}
</style>
