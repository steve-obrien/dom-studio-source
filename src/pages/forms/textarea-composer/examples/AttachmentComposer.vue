<script setup>
import { ref } from 'vue';
import { DomButton, DomIconButton, DomTextareaComposer } from '@getdom/studio/vue';

const message = ref('Compare this receipt with the reimbursement policy and flag anything that needs review.');
const attachments = ref([
	{
		id: 'receipt',
		name: 'northstar-receipt.png',
		preview: '/assets/blocks/expense-capture/receipt-northstar-coffee.png',
	},
]);
const result = ref('');

/**
 * Removes an application-owned attachment from the composer preview.
 *
 * @param {string} id Attachment identifier.
 * @returns {void}
 */
function removeAttachment(id) {
	attachments.value = attachments.value.filter((attachment) => attachment.id !== id);
}

/**
 * Adds the example attachment to demonstrate an application-owned picker.
 *
 * @returns {void}
 */
function addAttachment() {
	if (attachments.value.some((attachment) => attachment.id === 'receipt')) return;
	attachments.value.push({
		id: 'receipt',
		name: 'northstar-receipt.png',
		preview: '/assets/blocks/expense-capture/receipt-northstar-coffee.png',
	});
}

/**
 * Handles the shared composer's submit event and clears the local draft.
 *
 * @param {string} value Submitted composer text.
 * @returns {void}
 */
function sendMessage(value) {
	result.value = value || `${attachments.value.length} attachment sent`;
	message.value = '';
	attachments.value = [];
}
</script>

<template>
	<div class="w-full max-w-3xl space-y-3">
		<DomTextareaComposer
			v-model="message"
			label="Message"
			placeholder="Ask about the attached context..."
			:rows="2"
			:max-rows="7"
			:allow-empty-submit="attachments.length > 0"
			@submit="sendMessage"
		>
			<template #attachments>
				<article
					v-for="attachment in attachments"
					:key="attachment.id"
					class="group relative flex w-48 items-center gap-2 rounded-lg border border-border bg-secondary/40 p-1.5"
				>
					<img :src="attachment.preview" alt="" class="size-12 rounded-md border border-border object-cover" />
					<span class="min-w-0 flex-1 truncate text-xs font-medium text-canvas-fg">{{ attachment.name }}</span>
					<DomIconButton
						label="Remove attachment"
						size="xs"
						icon="M6 6l12 12M18 6 6 18"
						@click="removeAttachment(attachment.id)"
					/>
				</article>
			</template>

			<template #leading>
				<DomIconButton
					label="Attach context"
					size="sm"
					icon="M12 5v14M5 12h14"
					@click="addAttachment"
				/>
				<DomButton size="sm" variant="ghost">Tools</DomButton>
			</template>

			<template #actions>
				<DomButton size="sm" variant="ghost">Fast model</DomButton>
				<DomIconButton
					label="Start voice input"
					size="sm"
					icon="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-7 9a7 7 0 0 0 14 0M12 19v3M9 22h6"
				/>
			</template>
		</DomTextareaComposer>

		<p v-if="result" class="text-xs text-muted-fg" role="status">Sent: {{ result }}</p>
	</div>
</template>
