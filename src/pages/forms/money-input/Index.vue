<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomMoneyInput } from '../../lib/vue';

import InvoiceAmount from './examples/InvoiceAmount.vue';
import InvoiceAmountSrc from './examples/InvoiceAmount.vue?raw';

const doc = DomMoneyInput.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomMoneyInput"
					:initial="{ label: 'Price', modelValue: '149.00', currency: 'GBP', suffix: '/ mo' }"
					title="Money input playground"
					description="Use the currency chrome for display, then transform the decimal value in your form or backend layer."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Invoice amount">
				<Example
					:source="InvoiceAmountSrc"
					filename="InvoiceAmount.vue"
					description="Keep calculations in the parent so currency parsing and billing policy stay application-owned."
				>
					<InvoiceAmount />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomMoneyInput" />
			</DocSection>

			<ComponentEvents :component="DomMoneyInput" />
		</DocPage>
	</DomStudioLayout>
</template>
