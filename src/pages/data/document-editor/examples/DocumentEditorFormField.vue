<script setup>
import { computed, ref } from 'vue';
import DomButton from '../../../components/button/DomButton.vue';
import DomTextInput from '../../../forms/text-input/DomTextInput.vue';
import DomJsonViewer from '../../../dev/json-viewer/DomJsonViewer.vue';
import { createDefaultDocumentContent } from '../DomDocumentEditor.vue';
import DomWysiwyg from '../../../forms/wysiwyg/DomWysiwyg.vue';
const form = ref(createInitialForm());
const submittedPayload = ref(null);
const currentPayload = computed(resolveCurrentPayload);

/**
 * Creates the initial form object used by the v-model example.
 *
 * @returns {{ title: string, body: Record<string, unknown> }} Form state.
 */
function createInitialForm() {
	return {
		title: 'July launch note',
		body: createDefaultDocumentContent(),
	};
}

/**
 * Resolves the payload shape that would be sent by a normal form submit.
 *
 * @returns {{ title: string, body: Record<string, unknown> }} Current form payload.
 */
function resolveCurrentPayload() {
	return {
		title: form.value.title,
		body: form.value.body,
	};
}

/**
 * Stores a cloned submission payload for display beside the form.
 *
 * @returns {void}
 */
function submitForm() {
	submittedPayload.value = cloneJson(resolveCurrentPayload());
}

/**
 * Resets the title and editor body to their initial values.
 *
 * @returns {void}
 */
function resetForm() {
	form.value = createInitialForm();
	submittedPayload.value = null;
}

/**
 * Deep-clones JSON-compatible form data.
 *
 * @param {unknown} value Value to clone.
 * @returns {unknown} Cloned value.
 */
function cloneJson(value) {
	return JSON.parse(JSON.stringify(value));
}
</script>

<template>
	<form class="grid w-full min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]" @submit.prevent="submitForm">
		<div class="min-w-0 space-y-4">
			<DomTextInput
				v-model="form.title"
				label="Title"
				name="title"
				autocomplete="off"
			/>

			<DomWysiwyg
				v-model="form.body"
				label="Body"
				name="body"
				status="Draft"
				placeholder="Write the body copy..."
				min-height="18rem"
			/>

			<div class="flex flex-wrap items-center justify-end gap-2">
				<DomButton type="button" variant="secondary" @click="resetForm">Reset</DomButton>
				<DomButton type="submit" variant="primary">Submit form</DomButton>
			</div>
		</div>

		<div class="min-w-0 space-y-4">
			<DomJsonViewer
				title="Current v-model"
				:value="currentPayload"
				:expanded-depth="2"
				:preview-lines="16"
				density="compact"
			/>
			<DomJsonViewer
				title="Submitted payload"
				:value="submittedPayload || {}"
				:expanded-depth="2"
				:preview-lines="12"
				density="compact"
				empty-text="Submit the form to see the payload."
			/>
		</div>
	</form>
</template>
