<script setup>
import { DomJsonViewer } from '../../../lib/vue';

const webhookPayload = `{
	"event": "checkout.completed",
	"livemode": false,
	"created": "2026-07-05T09:42:13.000Z",
	"customer": {
		"id": "cus_1842",
		"email": "studio@example.com"
	},
	"items": [
		{
			"sku": "dom-source-access",
			"quantity": 1,
			"amount": 49900
		}
	],
	"metadata": {
		"workspace": "getdom.studio",
		"source": "docs-demo"
	}
}`;
</script>

<template>
	<div class="w-full max-w-3xl">
		<DomJsonViewer
			:value="webhookPayload"
			title="Webhook payload"
			description="String values are parsed and reformatted before rendering."
			filename="checkout.completed.json"
			mode="code"
			:preview-lines="14"
		/>
	</div>
</template>
