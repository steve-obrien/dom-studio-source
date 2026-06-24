<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomCard } from '../../lib/vue';

import Basic from './examples/Basic.vue';
import BasicSrc from './examples/Basic.vue?raw';
import Glass from './examples/Glass.vue';
import GlassSrc from './examples/Glass.vue?raw';
import MediaAsset from './examples/MediaAsset.vue';
import MediaAssetSrc from './examples/MediaAsset.vue?raw';
import AppleStoreCards from '../card-rail/examples/AppleStoreCards.vue';
import AppleStoreCardsSrc from '../card-rail/examples/AppleStoreCards.vue?raw';

const doc = DomCard.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Visual primitive">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomCard"
					:initial="{ padding: 'md', interactive: false }"
					title="Card playground"
					description="Cards are visual-only: skin-card provides the material recipe and spacing, while your markup decides the content."
				>
					<div class="space-y-2">
						<p class="text-lg font-semibold tracking-tight">Skin card</p>
						<p class="max-w-sm text-sm leading-6 text-muted-fg">
							This primitive uses skin-card, so borders, shadows, gradients, and glass effects come from theme tokens.
						</p>
					</div>
				</Playground>
			</DocSection>

			<DocSection eyebrow="Demo" title="Basic content card">
				<Example
					:source="BasicSrc"
					filename="Basic.vue"
					description="Use DomCard for grouped content that needs a consistent skin recipe."
				>
					<Basic />
				</Example>
			</DocSection>

			<DocSection eyebrow="Variant" title="Aspect-ratio media cards">
				<Example
					:source="MediaAssetSrc"
					filename="MediaAsset.vue"
					description="Use padding none when the card image owns the top edge, then keep the media area stable with aspect-ratio utilities."
				>
					<MediaAsset />
				</Example>
			</DocSection>

			<DocSection eyebrow="Composition" title="Storefront card rails">
				<Example
					:source="AppleStoreCardsSrc"
					filename="AppleStoreCards.vue"
					source-path="src/pages/visual/card-rail/examples/AppleStoreCards.vue"
					description="Keep DomCard as a flexible frame: compose product, promo, background-image, and icon cards inside DomCardRail when the page needs horizontal browsing."
					default-open
					:preview-lines="24"
				>
					<AppleStoreCards />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Token-driven glass">
				<Example
					:source="GlassSrc"
					filename="Glass.vue"
					description="Glass is a skin recipe, so it can be applied by changing CSS variables rather than component props."
				>
					<Glass />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomCard" />
			</DocSection>

			<ComponentSlots :component="DomCard" />
		</DocPage>
	</DomStudioLayout>
</template>
