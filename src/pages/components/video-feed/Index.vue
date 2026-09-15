<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomVideoFeed from './DomVideoFeed.vue';
import OpenMovieFeed from './examples/OpenMovieFeed.vue';
import OpenMovieFeedSource from './examples/OpenMovieFeed.vue?raw';

const doc = DomVideoFeed.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Live example" title="One video. Then the next.">
				<Example :source="OpenMovieFeedSource" filename="OpenMovieFeed.vue" :preview-lines="12">
					<OpenMovieFeed />
				</Example>
			</DocSection>
			<DocSection eyebrow="Behaviour" title="Native scrolling, considered playback">
				<div class="grid gap-5 text-sm leading-relaxed text-muted-fg sm:grid-cols-2">
					<div class="space-y-2">
						<h3 class="font-semibold text-canvas-fg">Touch, mouse, and keyboard</h3>
						<p>Swipe on a phone, scroll with a wheel or trackpad, or use the desktop arrow buttons. Each item snaps into place. Tab into the feed to use its keyboard shortcuts; scrolling beyond either end returns to the surrounding page.</p>
						<p>The translucent progress bar uses <code>DomRangeInput</code>. Its handle appears on hover, keyboard focus, or touch dragging. Playback progress follows the media clock between browser media events.</p>
					</div>
					<div class="space-y-2">
						<h3 class="font-semibold text-canvas-fg">Only the visible video plays</h3>
						<p>Leaving a video pauses it immediately. Visited videos stay on their last frame and resume from that position when you return. New players load as you approach them. Playback also pauses when less than half the feed is visible or the tab is hidden. Autoplay starts muted and respects reduced motion and data-saving preferences.</p>
					</div>
					<div class="space-y-2">
						<h3 class="font-semibold text-canvas-fg">Fits a page or an app</h3>
						<p>The default height is <code>100dvh</code>. Set <code>height</code> for an embedded feed, or use <code>100%</code> inside a sized parent. Use <code>fit="contain"</code> to show uncropped landscape sources. Caption and action slots keep your product’s content and behaviour in your application.</p>
					</div>
					<div class="space-y-2">
						<h3 class="font-semibold text-canvas-fg">Bring your own media</h3>
						<p>Supply stable IDs and browser-playable video URLs, optional posters, and WebVTT caption tracks. Cross-origin caption sources need CORS headers. Use <code>v-model:index</code> and the <code>change</code> event for navigation and pagination. Exposed methods: <code>goTo(index)</code>, <code>next()</code>, and <code>previous()</code>.</p>
					</div>
				</div>
			</DocSection>
			<DocSection eyebrow="Open content" title="Demo films and credits">
				<div class="space-y-3 text-sm leading-relaxed text-muted-fg">
					<p>These demos use <a class="font-medium text-canvas-fg underline underline-offset-4" href="https://peach.blender.org/about/" target="_blank" rel="noopener noreferrer">Big Buck Bunny, © 2008 Blender Foundation</a> and the <a class="font-medium text-canvas-fg underline underline-offset-4" href="https://durian.blender.org/sharing/" target="_blank" rel="noopener noreferrer">Sintel trailer, © 2010 Blender Foundation</a>, licensed under <a class="font-medium text-canvas-fg underline underline-offset-4" href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">Creative Commons Attribution 3.0</a>.</p>
					<p>The local demo assets are short, portrait-cropped, re-encoded excerpts with their original sound. Posters are frames from the same excerpts. Copy the files in <code>public/media/video-feed</code> with this example, preserve attribution, or replace the URLs with your own videos. The media licence is separate from the DOM Studio code licence.</p>
					<a href="/media/video-feed/CREDITS.md" class="inline-block font-medium text-canvas-fg underline underline-offset-4">Source downloads, timestamps, and attribution notes</a>
				</div>
			</DocSection>
			<DocSection title="Reference"><ComponentProps :component="DomVideoFeed" /><ComponentEvents :component="DomVideoFeed" /></DocSection>
			<ComponentSlots :component="DomVideoFeed" />
			<ComponentKeyboard :component="DomVideoFeed" />
		</DocPage>
	</DomStudioLayout>
</template>
