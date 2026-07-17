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
			tagline="A responsive revenue dashboard with persistent navigation, compact metrics, reporting controls, and a mobile navigation fallback."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Starter" title="Product dashboard">
				<Example
					:source="ProductDashboardSrc"
					filename="ProductDashboard.vue"
					presentation="iframe"
					frame-src="/blocks/app-shells/dashboard/preview/ProductDashboard"
					description="Resize the isolated app viewport to verify its desktop sidebar, compact metric layout, and mobile navigation."
					:default-open="false"
					:preview-lines="0"
				>
					<ProductDashboard />
				</Example>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
