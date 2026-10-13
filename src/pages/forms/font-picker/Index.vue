<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import CodePanel from '../../_layout/docs/CodePanel.vue';
import { DomFontPicker } from '../../lib/vue';
import ChooseFont from './examples/ChooseFont.vue';
import ChooseFontSrc from './examples/ChooseFont.vue?raw';
import fontsEndpointSrc from './recipes/fonts.get.js?raw';
import freshFontPickerSrc from './recipes/FreshFontPicker.vue?raw';

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

			<DocSection id="developer-api" eyebrow="Optional integration" title="Keep the catalogue current in your app">
				<div class="space-y-4 text-sm leading-relaxed text-muted-fg">
					<p>The bundled catalogue is a release-time snapshot, not a live feed. DOM Studio can refresh that snapshot in later releases, but does not host a catalogue service or manage Google API keys. If your app needs new families between package updates, your backend can supply its own metadata through the existing <code>fonts</code> prop.</p>
					<ul class="list-disc space-y-2 pl-5">
						<li><a href="https://developers.google.com/fonts/docs/css2" class="text-canvas-fg underline underline-offset-4">Google Fonts CSS v2 API</a>: no key; already used by the picker to download preview fonts lazily.</li>
						<li><a href="https://developers.google.com/fonts/docs/developer_api" class="text-canvas-fg underline underline-offset-4">Google Fonts Developer API</a>: requires a key; supplies the current catalogue and metadata. It does not make preview loading faster.</li>
					</ul>
					<p>The recipes below are for your application, not a DOM Studio endpoint. They are displayed as source only and do not make Developer API requests on this page.</p>
				</div>
			</DocSection>

			<DocSection eyebrow="Your backend" title="1. Fetch and cache the metadata">
				<div class="space-y-4 text-sm leading-relaxed text-muted-fg">
					<p>Follow Google’s Developer API setup to obtain a key for your project. Store it as <code>GOOGLE_FONTS_API_KEY</code> in your backend’s environment or secret manager. Restrict it to the required API and your server environment where supported. Never put it in a <code>VITE_</code> variable, client bundle, API response, or logged request URL.</p>
					<p>This Node.js 22 / Express example mounts at <code>/api/fonts</code> in your own app. It caches a successful catalogue for 24 hours, shares concurrent refreshes, times out after five seconds, and backs off for five minutes after a failure. Failed refreshes retain the last successful catalogue; a cold-cache failure returns 503.</p>
				</div>
				<div class="min-w-0 overflow-hidden rounded-xl border border-border bg-canvas">
					<CodePanel :source="fontsEndpointSrc" lang="js" filename="fonts.get.js" :border-top="false" :default-open="false" :preview-lines="12" />
				</div>
				<p class="text-sm leading-relaxed text-muted-fg">The in-memory cache is only for a single long-running process and resets on restart. For serverless or multiple instances, use a shared persistent cache and refresh coordination, or a scheduled job that refreshes stored JSON. Choose a refresh interval for your app, monitor failures and catalogue age, and keep serving the last known good data. Only family/category metadata goes to the browser—not font files or the key.</p>
			</DocSection>

			<DocSection eyebrow="Your frontend" title="2. Pass the catalogue to the picker">
				<p class="text-sm leading-relaxed text-muted-fg">Fetch your endpoint when the view containing the picker mounts, or reuse your app’s cached data store. A non-empty <code>fonts</code> array replaces the built-in catalogue; an empty array uses the bundled fallback. This example keeps that fallback during loading or failure and cancels its request on unmount.</p>
				<div class="min-w-0 overflow-hidden rounded-xl border border-border bg-canvas">
					<CodePanel :source="freshFontPickerSrc" filename="FreshFontPicker.vue" :border-top="false" :default-open="false" :preview-lines="12" />
				</div>
				<div class="space-y-4 text-sm leading-relaxed text-muted-fg">
					<p>Return the complete lightweight catalogue from this endpoint. The picker searches it locally and reveals options in <code>pageSize</code> batches; this is UI pagination, not Google API pagination. The Developer API does not document cursor pagination, and the picker does not fetch remote catalogue pages. Do not call Google on every <code>query</code> event or replace <code>fonts</code> with just one server page.</p>
					<p>Supplying current metadata does not download every font: the existing component still loads only the mounted selected label and nearby visible previews through CSS v2. Your app remains responsible for loading the chosen font in content outside the picker.</p>
					<p>Prefer no runtime endpoint? Run the same metadata fetch in a build or scheduled publishing job and serve the resulting JSON as a static asset. Keep the key in that job’s environment and pass the downloaded records through <code>fonts</code> in the same way.</p>
				</div>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomFontPicker" />
				<ComponentEvents :component="DomFontPicker" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
