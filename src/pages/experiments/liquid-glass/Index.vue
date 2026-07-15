<script setup>
import { onMounted, ref } from 'vue';
import DomLiquidGlassSurface from './DomLiquidGlassSurface.vue';
import LiquidGlassDragHandle from './LiquidGlassDragHandle.vue';
import { vDraggableSurface } from './draggableSurface.js';
import { supportsLiquidGlassRefraction } from './liquidGlass.js';

const isEnhanced = ref(false);
const photoExamples = [
	{
		id: 'mountain-lake',
		eyebrow: 'Travel card',
		title: 'A quieter route through the Alps.',
		body: 'Photographic detail makes the refractive rim and the stable reading area much easier to compare.',
		meta: ['9°C', '12 km trail'],
		image: 'https://images.unsplash.com/photo-1760290564278-d2cc74d5dfc5?auto=format&fit=crop&w=1600&q=82',
		alt: 'Mountain lake reflecting alpine peaks and autumn trees.',
		credit: 'Christopher Politano',
		source: 'https://unsplash.com/photos/mountain-lake-with-reflections-and-autumn-trees-rmYtd5qCAso?utm_source=getdom_studio&utm_medium=referral',
		position: '50% 50%',
		panelClass: 'bottom-12 left-5',
	},
	{
		id: 'ocean',
		eyebrow: 'Activity panel',
		title: 'Conditions are clean at Burleigh Heads.',
		body: 'Move the panel over foam, deep water, sand, and people to see the filter respond to rapid texture changes.',
		meta: ['1.4 m swell', 'Offshore wind'],
		image: 'https://images.unsplash.com/photo-1587434142939-335f5b445907?auto=format&fit=crop&w=1600&q=82',
		alt: 'Aerial view of surfers and ocean waves beside a sandy coast.',
		credit: 'Manny Moreno',
		source: 'https://unsplash.com/photos/aerial-view-of-ocean-waves-XAW5JcAsC4o?utm_source=getdom_studio&utm_medium=referral',
		position: '50% 50%',
		panelClass: 'right-5 top-5',
	},
	{
		id: 'architecture',
		eyebrow: 'Location preview',
		title: 'Geometry behind geometry.',
		body: 'Hard edges, repeated windows, and saturated colour reveal displacement more clearly than a soft gradient.',
		meta: ['Brutalist', 'Public space'],
		image: 'https://images.unsplash.com/photo-1761414500964-5602621f9277?auto=format&fit=crop&w=1600&q=82',
		alt: 'Modern building facade with colourful windows and open concrete structure.',
		credit: 'Gérard GRIFFAY',
		source: 'https://unsplash.com/photos/modern-building-facade-with-colorful-windows-and-open-structure-fR_60OAmNXg?utm_source=getdom_studio&utm_medium=referral',
		position: '50% 46%',
		panelClass: 'left-5 top-[28%]',
	},
];

/**
 * Report the rendering path selected for this browser in the demo header.
 *
 * @returns {void}
 */
function detectRefractionSupport() {
	isEnhanced.value = supportsLiquidGlassRefraction();
}

onMounted(detectRefractionSupport);
</script>

<template>
	<main class="min-h-screen bg-canvas p-[clamp(1.5rem,4vw,4rem)] text-canvas-fg">
		<header class="mx-auto flex w-[min(100%,76rem)] items-start justify-between gap-8 max-md:flex-col">
			<div>
				<p class="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">
					Experimental component · Phase 1
				</p>
				<h1 class="m-0 text-[clamp(2.35rem,5vw,5rem)] font-[760] leading-[0.96] tracking-[-0.055em]">
					Liquid glass surface
				</h1>
				<p class="mt-5 max-w-3xl text-[clamp(1rem,1.6vw,1.2rem)] leading-relaxed text-muted-fg">
					Testing a refractive surface that bends and softens the backdrop to create a liquid-glass effect.
					<template v-if="isEnhanced">
						This browser is using the enhanced SVG displacement filter.
					</template>
					<template v-else>
						This browser is using the CSS blur, saturation, and translucent-surface fallback instead.
					</template>
				</p>
			</div>

			<div class="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-muted px-3 py-2 text-xs font-semibold text-muted-fg">
				<span
					class="size-2 rounded-full bg-zinc-400 shadow-[0_0_0_3px_rgb(161_161_170/0.15)]"
					:class="isEnhanced ? 'bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/0.16)]' : ''"
					aria-hidden="true"
				/>
				{{ isEnhanced ? 'SVG refraction active' : 'CSS fallback active' }}
			</div>
		</header>

		<section
			class="hero-stage relative mx-auto mt-[clamp(2rem,5vw,4rem)] grid min-h-[38rem] w-[min(100%,76rem)] place-items-center overflow-hidden rounded-[clamp(1.5rem,4vw,3.5rem)] border border-white/70 max-md:min-h-[32rem]"
			aria-labelledby="surface-test-title"
		>
			<div class="absolute left-[8%] top-[5%] size-48 rounded-full bg-gradient-to-br from-rose-400 to-orange-500 saturate-[1.16]" />
			<div class="absolute bottom-[7%] right-[8%] size-64 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 saturate-[1.16]" />
			<div class="absolute right-[23%] top-[14%] size-24 rounded-full bg-gradient-to-br from-yellow-200 to-green-500 saturate-[1.16]" />
			<div
				class="pointer-events-none absolute inset-0 flex flex-col justify-between p-12 text-[clamp(2.5rem,8vw,7rem)] font-black uppercase leading-[0.8] tracking-[-0.07em] text-slate-900/20 max-md:p-8"
				aria-hidden="true"
			>
				<span>Refraction</span>
				<span class="self-end">Surface</span>
				<span>Chromatic edge</span>
			</div>

			<DomLiquidGlassSurface
				v-draggable-surface
				class="draggable-surface z-[2] min-h-[17rem] w-[min(82%,43rem)] min-w-[min(18rem,82%)] max-w-[92%] max-h-[32rem] resize [--dom-liquid-glass-radius:2rem]"
			>
				<div class="flex min-h-[17rem] flex-col justify-center p-[clamp(1.5rem,4vw,3rem)]">
					<LiquidGlassDragHandle
						class="absolute right-4 top-4"
						label="Move resizable liquid glass surface"
					/>
					<p class="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">Resizable surface</p>
					<h2 id="surface-test-title" class="m-0 max-w-lg text-[clamp(1.8rem,4vw,3.3rem)] font-[735] leading-[1.06] tracking-[-0.035em]">
						Content stays sharp while the backdrop bends.
					</h2>
					<p class="mt-4 max-w-xl leading-relaxed text-canvas-fg/75">
						Use the dotted handle to move the surface across the backdrop, then drag the lower-right
						corner to confirm that the displacement map follows its actual dimensions.
					</p>
					<div class="mt-6 flex flex-wrap gap-2" aria-label="Surface characteristics">
						<span class="rounded-full border border-canvas-fg/20 bg-canvas/25 px-2.5 py-1.5 text-xs font-semibold">Local SVG filter</span>
						<span class="rounded-full border border-canvas-fg/20 bg-canvas/25 px-2.5 py-1.5 text-xs font-semibold">Resize-aware</span>
						<span class="rounded-full border border-canvas-fg/20 bg-canvas/25 px-2.5 py-1.5 text-xs font-semibold">Fallback-safe</span>
					</div>
				</div>
			</DomLiquidGlassSurface>
		</section>

		<section class="mx-auto mt-5 grid w-[min(100%,76rem)] grid-cols-1 gap-5 md:grid-cols-2" aria-label="Overlay component examples">
			<article class="overflow-hidden rounded-3xl border border-border bg-muted">
				<div class="px-6 pb-5 pt-6">
					<p class="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">Popover scale</p>
					<h2 class="m-0 text-2xl font-[735] leading-tight tracking-[-0.035em]">Compact floating surfaces</h2>
					<p class="mt-2.5 text-sm leading-relaxed text-muted-fg">
						Drag the menu across the stage to test dense rows, small radii, and text contrast.
					</p>
				</div>

				<div class="menu-stage relative grid min-h-[25rem] place-items-center overflow-hidden p-8">
					<DomLiquidGlassSurface
						v-draggable-surface
						class="draggable-surface w-[min(100%,19rem)] p-2 [--dom-liquid-glass-radius:1.15rem]"
					>
						<div class="flex w-full items-center justify-between px-3 pb-2 pt-2 text-xs font-bold text-canvas-fg/65">
							<span>View options</span>
							<div class="flex items-center gap-2">
								<kbd class="font-[inherit]">⌘ K</kbd>
								<LiquidGlassDragHandle label="Move liquid glass menu" />
							</div>
						</div>
						<button type="button" class="flex w-full items-center justify-between rounded-xl border-0 bg-transparent p-3 text-left text-sm font-medium text-inherit hover:bg-canvas/30 focus-visible:bg-canvas/30 focus-visible:outline-none">
							<span>Show details</span>
							<span class="text-xs text-canvas-fg/50" aria-hidden="true">⌘ D</span>
						</button>
						<button type="button" class="flex w-full items-center justify-between rounded-xl border-0 bg-transparent p-3 text-left text-sm font-medium text-inherit hover:bg-canvas/30 focus-visible:bg-canvas/30 focus-visible:outline-none">
							<span>Duplicate view</span>
							<span class="text-xs text-canvas-fg/50" aria-hidden="true">⌘ ⇧ D</span>
						</button>
						<button type="button" class="flex w-full items-center justify-between rounded-xl border-0 bg-transparent p-3 text-left text-sm font-medium text-inherit hover:bg-canvas/30 focus-visible:bg-canvas/30 focus-visible:outline-none">
							<span>Share surface</span>
							<span class="text-xs text-canvas-fg/50" aria-hidden="true">⌘ S</span>
						</button>
					</DomLiquidGlassSurface>
				</div>
			</article>

			<article class="overflow-hidden rounded-3xl border border-border bg-muted">
				<div class="px-6 pb-5 pt-6">
					<p class="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">Dialog scale</p>
					<h2 class="m-0 text-2xl font-[735] leading-tight tracking-[-0.035em]">Large overlay surfaces</h2>
					<p class="mt-2.5 text-sm leading-relaxed text-muted-fg">
						Move the dialog across the colour field to check shadows, copy, controls, and fallback legibility.
					</p>
				</div>

				<div class="dialog-stage relative grid min-h-[25rem] place-items-center overflow-hidden p-8">
					<DomLiquidGlassSurface
						v-draggable-surface
						class="draggable-surface w-[min(100%,25rem)] p-6 [--dom-liquid-glass-radius:1.5rem]"
					>
						<LiquidGlassDragHandle class="absolute right-4 top-4" label="Move liquid glass dialog" />
						<p class="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">Confirm change</p>
						<h3 class="m-0 text-2xl font-[735] leading-tight tracking-[-0.035em]">Publish the new theme?</h3>
						<p class="mt-2.5 text-sm leading-relaxed text-canvas-fg/70">
							This will make the selected appearance available to everyone in the workspace.
						</p>
						<div class="mt-5 flex justify-end gap-2.5">
							<button type="button" class="rounded-xl border border-canvas-fg/20 bg-canvas/25 px-3.5 py-2.5 text-sm font-semibold text-inherit">
								Cancel
							</button>
							<button type="button" class="rounded-xl border border-transparent bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-fg">
								Publish theme
							</button>
						</div>
					</DomLiquidGlassSurface>
				</div>
			</article>
		</section>

		<section class="mx-auto mt-[clamp(3.5rem,7vw,6rem)] w-[min(100%,76rem)]" aria-labelledby="photo-example-title">
			<header class="mb-5 grid items-end gap-3 md:grid-cols-[minmax(0,0.85fr)_minmax(18rem,1fr)] md:gap-8">
				<div>
					<p class="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">Photographic backdrops</p>
					<h2 id="photo-example-title" class="m-0 text-[clamp(1.75rem,3vw,2.8rem)] font-[735] leading-[1.04] tracking-[-0.04em]">
						Real detail is the harder test.
					</h2>
				</div>
				<p class="m-0 max-w-xl text-sm leading-relaxed text-muted-fg">
					Drag each panel over high-contrast edges, fine textures, and changing colour to compare
					the enhanced refraction with the CSS-only fallback.
				</p>
			</header>

			<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,21rem),1fr))] gap-5">
				<article
					v-for="example in photoExamples"
					:key="example.id"
					class="relative min-h-[32rem] overflow-hidden rounded-[1.75rem] border border-border bg-slate-600 shadow-2xl md:min-h-[36rem]"
				>
					<img
						:src="example.image"
						:alt="example.alt"
						:style="{ objectPosition: example.position }"
						class="absolute inset-0 size-full object-cover"
						loading="lazy"
						decoding="async"
					/>
					<div class="photo-shade pointer-events-none absolute inset-0" aria-hidden="true" />

					<a
						:href="example.source"
						target="_blank"
						rel="noreferrer"
						class="absolute bottom-3 right-3 z-[2] max-w-[calc(100%_-_1.5rem)] rounded-full bg-slate-950/35 px-2.5 py-1.5 text-right text-[0.65rem] font-semibold text-white/85 no-underline backdrop-blur-lg hover:bg-slate-950/55 hover:text-white focus-visible:bg-slate-950/55 focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
					>
						Photo by {{ example.credit }} on Unsplash
					</a>

					<DomLiquidGlassSurface
						v-draggable-surface
						class="draggable-surface absolute z-[3] w-[calc(100%_-_2.5rem)] max-w-[22rem] p-[1.35rem] text-canvas-fg [--dom-liquid-glass-radius:1.4rem]"
						:class="example.panelClass"
					>
						<LiquidGlassDragHandle
							class="absolute right-4 top-4"
							:label="`Move ${example.eyebrow.toLowerCase()}`"
						/>
						<p class="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">{{ example.eyebrow }}</p>
						<h3 class="m-0 max-w-[calc(100%_-_2rem)] text-2xl font-[745] leading-[1.08] tracking-[-0.035em]">
							{{ example.title }}
						</h3>
						<p class="mt-3 text-sm leading-relaxed text-canvas-fg/70">{{ example.body }}</p>
						<div class="mt-4 flex flex-wrap gap-2">
							<span
								v-for="item in example.meta"
								:key="item"
								class="rounded-full border border-canvas-fg/20 bg-canvas/25 px-2.5 py-1.5 text-xs font-semibold"
							>
								{{ item }}
							</span>
						</div>
					</DomLiquidGlassSurface>
				</article>
			</div>
		</section>

		<section class="mx-auto mt-16 flex w-[min(100%,76rem)] items-start justify-between gap-8 border-t border-border py-8 max-md:flex-col">
			<div>
				<p class="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">Phase 1 boundary</p>
				<h2 class="m-0 text-2xl font-[735] leading-tight tracking-[-0.035em]">Deliberately independent</h2>
			</div>
			<ul class="m-0 max-w-2xl list-disc space-y-2 pl-5 leading-relaxed text-muted-fg">
				<li>No public package export or global stylesheet.</li>
				<li>No changes to dropdown, dialog, card, or theme APIs.</li>
				<li>Unsupported engines and reduced-transparency preferences receive an opaque-enough CSS fallback.</li>
				<li>Deleting this experiment directory removes the implementation completely.</li>
			</ul>
		</section>
	</main>
</template>

<style scoped>
.hero-stage {
	background:
		linear-gradient(125deg, rgb(255 255 255 / 0.36), transparent 45%),
		linear-gradient(135deg, #c7d2fe 0%, #a7f3d0 44%, #fde68a 72%, #f9a8d4 100%);
	box-shadow: 0 26px 80px rgb(48 51 84 / 0.16);
}

.hero-stage::before {
	position: absolute;
	inset: 0;
	content: '';
	background-image:
		linear-gradient(rgb(255 255 255 / 0.24) 1px, transparent 1px),
		linear-gradient(90deg, rgb(255 255 255 / 0.24) 1px, transparent 1px);
	background-size: 38px 38px;
	mask-image: linear-gradient(to bottom, black, transparent 92%);
}

.menu-stage {
	background:
		radial-gradient(circle at 74% 20%, #fb7185 0 13%, transparent 14%),
		linear-gradient(145deg, #fcd34d, #a7f3d0 42%, #93c5fd);
}

.dialog-stage {
	background:
		radial-gradient(circle at 20% 75%, #c4b5fd 0 18%, transparent 19%),
		linear-gradient(145deg, #67e8f9, #c4b5fd 48%, #f9a8d4);
}

.photo-shade {
	background:
		linear-gradient(to bottom, rgb(15 23 42 / 0.08), transparent 32%),
		linear-gradient(to top, rgb(15 23 42 / 0.38), transparent 38%);
}

.draggable-surface {
	transform: translate3d(
		var(--liquid-glass-drag-x, 0),
		var(--liquid-glass-drag-y, 0),
		0
	);
	will-change: transform;
}

.draggable-surface[data-dragging='true'] {
	z-index: 5;
}

[data-dragging='true'] [data-drag-handle] {
	cursor: grabbing;
}
</style>
