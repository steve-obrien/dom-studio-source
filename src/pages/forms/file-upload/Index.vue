<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomFileUpload } from '../../lib/vue';

import ExpenseReceipt from './examples/ExpenseReceipt.vue';
import ExpenseReceiptSrc from './examples/ExpenseReceipt.vue?raw';

const doc = DomFileUpload.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomFileUpload"
					:initial="{ label: 'Files', description: 'Select local files; upload them from the parent.', accept: 'image/*,.pdf', maxFiles: 3 }"
					title="File upload playground"
					description="The component owns selection UI and validation only. Your app owns upload, progress, and persistence."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Expense receipt">
				<Example
					:source="ExpenseReceiptSrc"
					filename="ExpenseReceipt.vue"
					description="Mix existing uploaded file metadata with new local File objects, then let the parent handle upload work."
				>
					<ExpenseReceipt />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomFileUpload" />
			</DocSection>

			<ComponentEvents :component="DomFileUpload" />
		</DocPage>
	</DomStudioLayout>
</template>
