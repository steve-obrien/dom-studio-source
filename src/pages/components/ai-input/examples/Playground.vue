<script setup>
import { reactive, ref } from 'vue';
import { DomAiInput } from '@getdom/studio/vue';

const data = reactive({
	modelValue: {
		text: 'Summarise the work left for launch.\n\n- Flag any dependencies.\n\n[] Review the draft\n[x] Confirm the launch date',
		mode: 'plan',
	},
	models: [
		{
			id: 'example:general',
			label: 'General assistant',
			provider: 'Example models',
			features: {
				modes: ['plan', 'build'],
				reasoningEfforts: [{ value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }],
				speeds: [{ value: 'standard', label: 'Standard' }, { value: 'fast', label: 'Fast' }],
			},
		},
	],
	layout: 'workflow',
	modeInPicker: false,
	modelPicker: 'stack',
	modelPlacement: 'leading',
	submitOnEnter: true,
	markdown: true,
	placeholder: 'Ask AI…',
	ariaLabel: 'Playground prompt',
	rows: 2,
	maxRows: 8,
	resolvedModelLabel: '',
	disabled: false,
	submitting: false,
	submitDisabled: false,
});
const lastRequest = ref(null);

defineExpose({ data });

/**
 * Displays the most recent request and clears the accepted demo draft.
 *
 * @param {import('@getdom/studio/vue').AiInputRequest} request Submitted prompt, files, and settings.
 * @returns {void}
 */
function recordRequest(request) {
	lastRequest.value = {
		...request,
		attachments: request.attachments.map((file) => file.name),
	};
	data.modelValue = { ...data.modelValue, text: '', attachments: [] };
}
</script>

<template>
	<div class="w-full min-w-0 max-w-2xl space-y-4">
		<DomAiInput v-bind="data" v-model="data.modelValue" @submit="recordRequest" />
		<section v-if="lastRequest" class="rounded-xl border border-border bg-canvas p-3" role="status">
			<p class="text-xs font-semibold text-muted-fg">Last submitted request</p>
			<pre class="mt-1.5 max-h-48 overflow-auto text-xs leading-5">{{ JSON.stringify(lastRequest, null, 2) }}</pre>
		</section>
	</div>
</template>
