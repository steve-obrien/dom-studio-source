<script setup>
import { DomAlert, DomButton } from '../../../lib/vue';
</script>

<template>
	<div class="grid gap-4">
		<DomAlert
			tone="success"
			variant="toast"
			title="Import complete"
			description="1,248 customer records were matched and the review queue has been refreshed."
		>
			<template #actions>
				<DomButton variant="secondary" size="sm">View records</DomButton>
				<DomButton variant="ghost" size="sm">Download report</DomButton>
			</template>
		</DomAlert>

		<DomAlert
			tone="warning"
			variant="toast"
			title="Sync paused"
			description="Reconnect the analytics account before the nightly enrichment job starts."
		/>

		<DomAlert
			tone="danger"
			variant="solid"
			title="Billing hold"
			description="Exports are paused until a billing owner updates the payment method."
		/>
	</div>
</template>
