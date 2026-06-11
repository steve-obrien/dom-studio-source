<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import SubscriptionSettings from './examples/SubscriptionSettings.vue';
import SubscriptionSettingsSrc from './examples/SubscriptionSettings.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Billing Block"
			tagline="A complete SaaS subscription settings page for upgrade paths, usage visibility, payment method management, and invoice history."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Starter" title="Subscription settings">
				<Example
					:source="SubscriptionSettingsSrc"
					filename="SubscriptionSettings.vue"
					presentation="iframe"
					frame-src="/blocks/monetization/billing/preview/SubscriptionSettings"
					description="Copy this into an account settings area, then wire the plan, invoice, usage, and payment actions to your billing provider."
					default-open
				>
					<SubscriptionSettings />
				</Example>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
