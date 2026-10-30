<script setup>
import { ref } from 'vue';
import { DomBottomSheet, DomButton, DomTextareaComposer } from '@getdom/studio/vue';

const open = ref(false);
const reply = ref('');
const replies = ref([]);

/** Adds a local comment and clears the draft while leaving the sheet open. */
function addComment(value) {
	if (!value.trim()) return;
	replies.value.push(value.trim());
	reply.value = '';
}
</script>

<template>
	<div class="flex min-h-48 items-center justify-center bg-secondary/20 p-6">
		<DomButton @click="open = true">Open project notes</DomButton>
		<DomBottomSheet v-model="open" title="Project notes" :snap-points="[0, 0.4, 0.7, 0.95]" :initial-snap-point="0.7">
			<div class="space-y-5 text-sm leading-7 text-muted-fg">
				<p class="font-semibold text-canvas-fg">A calmer project overview</p>
				<p>Keep the next action visible, give recent work a little more space, and move secondary details into the project sheet.</p>
				<p>The first review is on Thursday. We’ll walk through the inbox, check how messages move into the archive, and try replying on a phone.</p>
				<p>Bring one example of a task that currently takes too many steps. We’ll use those examples to choose the next improvement.</p>
				<p>The aim is a useful first release: a clear list, a reliable reply flow, and a way to undo changes.</p>
				<div v-for="(comment, index) in replies" :key="index" class="rounded-xl bg-secondary p-4"><p class="font-medium text-canvas-fg">You</p><p class="whitespace-pre-wrap">{{ comment }}</p></div>
				<p v-if="replies.length" role="status" class="text-xs">Comment added to this preview.</p>
			</div>
			<template #footer><DomTextareaComposer v-model="reply" chrome="none" aria-label="Comment on project notes" placeholder="Add a comment…" :rows="1" :max-rows="3" submit-label="Add comment" :submit-on-enter="false" @submit="addComment" /></template>
		</DomBottomSheet>
	</div>
</template>
