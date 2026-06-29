<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomAlert } from '../../lib/vue';

import AlertVariants from './examples/AlertVariants.vue';
import AlertVariantsSrc from './examples/AlertVariants.vue?raw';
import ToastLikeAlerts from './examples/ToastLikeAlerts.vue';
import ToastLikeAlertsSrc from './examples/ToastLikeAlerts.vue?raw';
import CustomIcons from './examples/CustomIcons.vue';
import CustomIconsSrc from './examples/CustomIcons.vue?raw';
import CloudSyncIconSrc from './examples/CloudSyncIcon.vue?raw';

const doc = DomAlert.__doc;
const customIconSource = [
	'// CustomIcons.vue',
	CustomIconsSrc,
	'// CloudSyncIcon.vue',
	CloudSyncIconSrc,
].join('\n\n');
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Visual primitive">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomAlert"
					:initial="{ tone: 'info', variant: 'soft', title: 'Information available', description: 'Review the latest status details before continuing.' }"
					title="Alert playground"
					description="Use alerts for persistent inline feedback. Tone controls meaning; variant controls visual weight."
				/>
			</DocSection>

			<DocSection eyebrow="Variants" title="Status tones">
				<Example
					:source="AlertVariantsSrc"
					filename="AlertVariants.vue"
					description="Use info, success, warning, danger, and neutral/default tones for persistent notices that match the toast notification vocabulary."
				>
					<AlertVariants />
				</Example>
			</DocSection>

			<DocSection eyebrow="Variant" title="Toast-like alerts">
				<Example
					:source="ToastLikeAlertsSrc"
					filename="ToastLikeAlerts.vue"
					description="Use the toast variant for inline messages that should feel close to transient notifications, or solid for high-priority notices."
				>
					<ToastLikeAlerts />
				</Example>
			</DocSection>

			<DocSection eyebrow="Icons" title="Custom icon sources">
				<Example
					:source="customIconSource"
					filename="CustomIcons.vue + CloudSyncIcon.vue"
					description="Pass SVG path data directly, pass an imported Vue icon component, or set icon to false for text-only alerts."
				>
					<CustomIcons />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomAlert" />
			</DocSection>

			<ComponentSlots :component="DomAlert" />
		</DocPage>
	</DomStudioLayout>
</template>
