<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomScrollMenu, DomScrollMenuItem } from '../../lib/vue';
import Basic from './examples/Basic.vue';
import BasicSrc from './examples/Basic.vue?raw';
import CustomMarkup from './examples/CustomMarkup.vue';
import CustomMarkupSrc from './examples/CustomMarkup.vue?raw';

const doc = DomScrollMenu.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Demo" title="Basic">
				<Example
					:source="BasicSrc"
					filename="Basic.vue"
					description="Pass each fragment href directly to DomScrollMenuItem and it renders the real anchor for you. Smooth scrolling is enabled by default."
					default-open
					:preview-lines="24"
				>
					<Basic />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Custom link markup">
				<Example
					:source="CustomMarkupSrc"
					filename="CustomMarkup.vue"
					description="Omit the href prop when you need to supply the anchor yourself. The item discovers the fragment link and exposes active state for richer content."
					:preview-lines="42"
				>
					<CustomMarkup />
				</Example>
			</DocSection>

			<DocSection title="Scroll menu reference">
				<ComponentProps :component="DomScrollMenu" />
				<ComponentEvents :component="DomScrollMenu" />
			</DocSection>

			<ComponentSlots :component="DomScrollMenu" />

			<DocSection title="Scroll menu item reference">
				<ComponentProps :component="DomScrollMenuItem" />
				<ComponentEvents :component="DomScrollMenuItem" />
			</DocSection>

			<ComponentSlots :component="DomScrollMenuItem" />
		</DocPage>
	</DomStudioLayout>
</template>
