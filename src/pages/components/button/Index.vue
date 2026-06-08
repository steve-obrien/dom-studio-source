<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomButton } from '../../lib/vue';

const doc = DomButton.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomButton"
					title="Button playground"
					description="Edit any prop on the right — the rendered button and the synthesised source update together. No example SFC needed; the playground auto-builds its data from DomButton's defineProps."
				>
					Button
				</Playground>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomButton" />
			</DocSection>

			<ComponentSlots :component="DomButton" />
		</DocPage>
	</DomStudioLayout>
</template>
