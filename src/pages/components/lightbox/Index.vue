<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import { DomLightbox } from '../../lib/vue';

import ImageGallery from './examples/ImageGallery.vue';
import ImageGallerySrc from './examples/ImageGallery.vue?raw';

const doc = DomLightbox.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Demo" title="Gallery lightbox">
				<Example
					:source="ImageGallerySrc"
					filename="ImageGallery.vue"
					description="A shared lightbox controlled from a thumbnail grid. The image clone flies from the clicked thumbnail into a stable stage, then returns to the thumbnail's current bounds on close."
				>
					<ImageGallery />
				</Example>
			</DocSection>

			<DocSection eyebrow="Design note" title="Built for media first, reusable for detail views">
				<p class="max-w-3xl text-sm leading-6 text-muted-fg">
					DomLightbox keeps the visual effect separate from dialog layout. The moving thumbnail is a temporary clone; the centered stage is stable and slot-driven.
					That gives image galleries the expected lightbox feel now, while leaving a path for kanban cards, calendar events, and form/detail previews to use the same overlay shell later.
				</p>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomLightbox" />
			</DocSection>

			<ComponentSlots :component="DomLightbox" />
			<ComponentEvents :component="DomLightbox" />
			<ComponentKeyboard :component="DomLightbox" />
		</DocPage>
	</DomStudioLayout>
</template>
