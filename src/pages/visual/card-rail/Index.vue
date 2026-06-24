<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomCardRail } from '../../lib/vue';

import AppleStoreCards from './examples/AppleStoreCards.vue';
import AppleStoreCardsSrc from './examples/AppleStoreCards.vue?raw';

const doc = DomCardRail.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Visual primitive">
			<DocSection eyebrow="Storefront" title="Apple Store-inspired card rails">
				<Example
					:source="AppleStoreCardsSrc"
					filename="AppleStoreCards.vue"
					description="Compose ordinary DomCard content inside DomCardRail when a page needs horizontally browsable product, promo, image, or icon cards."
					default-open
					:preview-lines="24"
				>
					<AppleStoreCards />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomCardRail" />
			</DocSection>

			<ComponentSlots :component="DomCardRail" />
		</DocPage>
	</DomStudioLayout>
</template>
