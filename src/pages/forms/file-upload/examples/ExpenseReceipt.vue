<script setup>
import { ref } from 'vue';
import { DomAlert, DomFileUpload } from '../../../lib/vue';

const files = ref([
	{
		id: 'receipt-1844',
		name: 'receipt-lunch.pdf',
		size: 284000,
		type: 'application/pdf',
		url: '/files/receipt-1844',
	},
]);
const rejected = ref([]);
</script>

<template>
	<div class="w-full max-w-xl rounded-lg border border-border bg-canvas p-5 shadow-sm">
		<DomFileUpload
			v-model="files"
			label="Receipt evidence"
			description="Attach PDFs or images. The component only manages local selection."
			accept="image/*,.pdf"
			:max-files="3"
			:max-size="5 * 1024 * 1024"
			@reject="rejected = $event"
		/>

		<DomAlert
			v-if="rejected.length"
			class="mt-4"
			tone="warning"
			title="Some files were not added"
			:description="rejected.map((item) => item.message).join(' ')"
		/>
	</div>
</template>
