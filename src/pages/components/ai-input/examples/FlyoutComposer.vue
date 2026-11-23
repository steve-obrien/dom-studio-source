<script setup>
import { ref } from 'vue';
import { DomAiInput } from '@getdom/studio/vue';

const reasoningEfforts = [
	{ value: 'medium', label: 'Medium' },
	{ value: 'low', label: 'Low' },
	{ value: 'high', label: 'High' },
	{ value: 'max', label: 'Maximum' },
];
const models = [
	{ id: 'anthropic:opus', label: 'Claude Opus', provider: 'Anthropic', features: { reasoningEfforts } },
	{ id: 'anthropic:sonnet', label: 'Claude Sonnet', provider: 'Anthropic', features: { reasoningEfforts: reasoningEfforts.slice(0, 3) } },
	{ id: 'anthropic:haiku', label: 'Claude Haiku', provider: 'Anthropic' },
	{ id: 'openai:sol', label: 'GPT-6.2 Sol', provider: 'OpenAI', features: { reasoningEfforts: reasoningEfforts.slice(0, 3) } },
];
const draft = ref({ text: 'Compare the trade-offs in these approaches.', model: 'anthropic:opus' });
const request = ref(null);

/**
 * Displays the provider choice and reasoning effort from the submitted draft.
 * @param {import('@getdom/studio/vue').AiInputRequest} value Submitted demo request.
 */
function send(value) {
	request.value = value;
	draft.value = { ...draft.value, text: '', attachments: [] };
}
</script>

<template>
	<div class="w-full max-w-3xl space-y-3">
		<DomAiInput
			v-model="draft"
			:models="models"
			:mode-in-picker="false"
			model-picker="flyout"
			aria-label="Flyout composer prompt"
			placeholder="What would you like to explore?"
			@submit="send"
		/>
		<p v-if="request" role="status" class="wrap-anywhere text-sm text-muted-fg">
			Submitted to {{ models.find((model) => model.id === request.model)?.label || 'Auto' }}<span v-if="request.reasoningEffort"> · {{ request.reasoningEffort }} effort</span>
		</p>
	</div>
</template>
