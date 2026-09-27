<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomFontPicker } from '../../lib/vue';
import ChooseFont from './examples/ChooseFont.vue';
import ChooseFontSrc from './examples/ChooseFont.vue?raw';

const doc = DomFontPicker.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Form primitive">
			<DocSection eyebrow="Playground" title="Search and preview Google Fonts">
				<Playground
					:inspect="DomFontPicker"
					:initial="{ label: 'Font family', modelValue: 'Lato', placeholder: 'Search Google Fonts', pageSize: 24 }"
					title="Font picker playground"
					description="Open to browse around the selected font, then use the separate search field. Only the mounted selected label and visible rows request previews."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Choose a font family">
				<Example
					:source="ChooseFontSrc"
					filename="ChooseFont.vue"
					description="The selected value is an ordinary family name; the application decides how and where to use it."
				>
					<ChooseFont />
				</Example>
			</DocSection>

			<DocSection eyebrow="Loading model" title="Preview fonts stay local to the picker">
				<div class="grid gap-4 text-sm leading-relaxed text-muted-fg md:grid-cols-3">
					<div class="rounded-2xl border border-border bg-secondary/40 p-5">
						<h3 class="font-semibold text-canvas-fg">No font bundle</h3>
						<p class="mt-2">The built-in snapshot contains 1,946 family names and categories (27 September 2026), but no font files. Importing the control does not start a Google Fonts request.</p>
					</div>
					<div class="rounded-2xl border border-border bg-secondary/40 p-5">
						<h3 class="font-semibold text-canvas-fg">Incremental batches</h3>
						<p class="mt-2">Select appends pageSize rows near its end. Only intersecting preview rows, a small overscan, and the selected label request CSS v2 fonts with exact text subsetting. Opening near a distant selection does not download the intervening fonts.</p>
					</div>
					<div class="rounded-2xl border border-border bg-secondary/40 p-5">
						<h3 class="font-semibold text-canvas-fg">Explicit ownership</h3>
						<p class="mt-2">The stylesheet node is removed when the picker unmounts. Applications own persistent loading for content that uses the chosen font elsewhere.</p>
					</div>
				</div>
			</DocSection>

			<DocSection title="Google API keys">
				<p class="text-sm leading-relaxed text-muted-fg">The Google Fonts CSS API needs no key. The Developer API uses a key to retrieve catalogue metadata, not to make previews faster. For a fresh catalogue, fetch and cache it on your server (or at build time), keep the key there, and pass family/category records through fonts. Google’s catalogue endpoint does not supply this control’s cursor pagination; paginate your cached metadata if needed.</p>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomFontPicker" />
				<ComponentEvents :component="DomFontPicker" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
