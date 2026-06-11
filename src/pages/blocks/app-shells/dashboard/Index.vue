<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import ProductDashboard from './examples/ProductDashboard.vue';
import ProductDashboardSrc from './examples/ProductDashboard.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Dashboard Block"
			tagline="A product dashboard starter with a side menu, account dropdown, metrics, and card-based content."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Starter" title="Product dashboard">
				<Example
					:source="ProductDashboardSrc"
					filename="ProductDashboard.vue"
					presentation="iframe"
					frame-src="/blocks/app-shells/dashboard/preview/ProductDashboard"
					description="A larger composition showing how Card, Button, Dropdown, and NativeSelect fit together."
					default-open
				>
					<ProductDashboard />
				</Example>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
