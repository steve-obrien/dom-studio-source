<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import ComponentGuide from '../../_layout/docs/ComponentGuide.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import Playground from '../../_layout/docs/Playground.vue';
import DomSpinner from './DomSpinner.vue';
import DomSpinnerSrc from './DomSpinner.vue?raw';
import guide from './DomSpinner.md?guide';
import SpinnerVariants from './examples/SpinnerVariants.vue';
import SpinnerVariantsSrc from './examples/SpinnerVariants.vue?raw';
import PreviewLoading from './examples/PreviewLoading.vue';
import PreviewLoadingSrc from './examples/PreviewLoading.vue?raw';

const doc = DomSpinner.__doc;
const examples = {
	SpinnerVariants: { component: SpinnerVariants, source: SpinnerVariantsSrc },
	PreviewLoading: { component: PreviewLoading, source: PreviewLoadingSrc },
};
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<ComponentGuide :guide="guide" :examples="examples" />

			<DocSection title="Playground">
				<Playground :inspect="DomSpinner" :initial="doc.playground.initial" title="Spinner playground" />
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomSpinner" :source="DomSpinnerSrc" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
