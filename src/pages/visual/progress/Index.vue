<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import { DomProgress, DomRadialProgress } from '../../lib/vue';

import ProgressStates from './examples/ProgressStates.vue';
import ProgressStatesSrc from './examples/ProgressStates.vue?raw';
import RadialMeters from './examples/RadialMeters.vue';
import RadialMetersSrc from './examples/RadialMeters.vue?raw';
import UploadOverlay from './examples/UploadOverlay.vue';
import UploadOverlaySrc from './examples/UploadOverlay.vue?raw';

const doc = DomProgress.__doc;
const radialDoc = DomRadialProgress.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" tag="<DomProgress> + <DomRadialProgress>" eyebrow="Visual primitive">
			<DocSection eyebrow="Playground" title="Linear progress">
				<Playground
					:inspect="DomProgress"
					:initial="{ value: 68, showValue: true, tone: 'primary', size: 'md' }"
					title="Progress playground"
					description="Use the linear meter for page-level loading, imports, uploads, and background work with enough horizontal space for a label."
				/>
			</DocSection>

			<DocSection eyebrow="Playground" title="Radial progress">
				<Playground
					:inspect="DomRadialProgress"
					:initial="{ value: 64, showValue: true, tone: 'success', size: 'md' }"
					title="Radial progress playground"
					:description="radialDoc.description"
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Status progress bars">
				<Example
					:source="ProgressStatesSrc"
					filename="ProgressStates.vue"
					description="Use DomProgress for clear task progress, including indeterminate work that has started but has not reported a value yet."
				>
					<ProgressStates />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Radial meters">
				<Example
					:source="RadialMetersSrc"
					filename="RadialMeters.vue"
					description="Use DomRadialProgress when the progress state needs to sit inside a thumbnail, list row, toolbar, or compact status area."
				>
					<RadialMeters />
				</Example>
			</DocSection>

			<DocSection eyebrow="Composition" title="Upload overlays">
				<Example
					:source="UploadOverlaySrc"
					filename="UploadOverlay.vue"
					description="Radial progress works well over media previews because it keeps the upload state readable without resizing the item layout."
				>
					<UploadOverlay />
				</Example>
			</DocSection>

			<DocSection title="Linear reference">
				<ComponentProps :component="DomProgress" />
			</DocSection>

			<DocSection title="Radial reference">
				<ComponentProps :component="DomRadialProgress" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
