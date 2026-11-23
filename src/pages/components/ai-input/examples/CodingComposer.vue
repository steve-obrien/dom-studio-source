<script setup>
import { computed, ref } from 'vue';
import { DomAiInput, DomAudioControls, DomDropdown } from '@getdom/studio/vue';

const efforts = [{ value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'low', label: 'Low' }];
const models = [
	{ id: 'openai:sol', label: 'GPT-6.2 Sol', provider: 'OpenAI', features: { reasoningEfforts: efforts } },
	{ id: 'openai:astra', label: 'GPT-6.2 Astra', provider: 'OpenAI', features: { reasoningEfforts: [{ value: 'high', label: 'High' }, ...efforts.filter((option) => option.value !== 'high')] } },
];
const workflow = [{ value: 'build', label: 'Build' }, { value: 'plan', label: 'Plan' }];
const approvalOptions = [{ value: 'review', label: 'Review changes' }, { value: 'auto', label: 'Auto-approve changes' }];
const settingsButtonClass = 'inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted-fg outline-none hover:bg-secondary hover:text-canvas-fg focus-visible:ring-2 focus-visible:ring-ring/60';
const draft = ref({ text: '', model: 'openai:sol', reasoningEffort: 'high', mode: 'build' });
const approvals = ref('review');
const request = ref(null);
const approvalLabel = computed(() => approvalOptions.find((option) => option.value === approvals.value).label);

/**
 * Applies the workflow requested by the application toolbar.
 * @param {'plan' | 'build'} mode Selected workflow.
 */
function setWorkflow(mode) {
	draft.value = { ...draft.value, mode };
}

/**
 * Snapshots the draft and app-owned approval policy for the demo.
 * @param {import('@getdom/studio/vue').AiInputRequest} value Submitted composer request.
 */
function send(value) {
	request.value = { ...value, approvals: approvals.value, attachments: value.attachments.map(({ name }) => name) };
	draft.value = { ...draft.value, text: '', attachments: [] };
}
</script>

<template>
	<div class="w-full max-w-3xl space-y-2">
		<DomDropdown
			:items="workflow"
			:label="`Workflow · ${draft.mode === 'plan' ? 'Plan' : 'Build'}`"
			:trigger-class="settingsButtonClass"
			@select="setWorkflow"
		/>
		<DomAiInput
			v-model="draft"
			:models="models"
			:mode-in-picker="false"
			model-picker="flyout"
			model-placement="trailing"
			markdown
			aria-label="Coding composer prompt"
			placeholder="Describe the change you want to make…"
			@submit="send"
		>
			<template #tools="{ disabled }">
				<DomDropdown :items="approvalOptions" :label="approvalLabel" :disabled="disabled" :trigger-class="settingsButtonClass" placement="top" @select="approvals = $event" />
			</template>
			<template #actions="{ disabled }">
				<DomAudioControls compact label="Start microphone" :disabled="disabled" />
			</template>
		</DomAiInput>
		<div v-if="request" role="status" class="rounded-lg border border-border bg-canvas p-3">
			<p class="text-xs font-semibold text-muted-fg">Submitted request</p>
			<pre class="mt-1 max-h-36 overflow-auto text-xs leading-5">{{ JSON.stringify(request, null, 2) }}</pre>
		</div>
	</div>
</template>
