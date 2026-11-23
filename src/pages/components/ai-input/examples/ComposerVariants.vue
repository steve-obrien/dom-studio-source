<script setup>
import { reactive } from 'vue';
import { DomAiInput, DomDropdown } from '@getdom/studio/vue';

const medium = { value: 'medium', label: 'Medium' };
const low = { value: 'low', label: 'Low' };
const high = { value: 'high', label: 'High' };
const standard = { value: 'standard', label: 'Standard' };
const studioSpeeds = [standard, { value: 'fast', label: 'Fast' }, { value: 'ultrafast', label: 'Ultrafast' }];
const workflowOptions = [{ value: 'plan', label: 'Plan' }, { value: 'build', label: 'Build' }];
const models = [
	{
		id: 'openai:sol', provider: 'OpenAI', label: 'GPT-6.2 Sol', description: 'General-purpose coding and editing.',
		features: { modes: ['plan', 'build'], reasoningEfforts: [medium, low, high], speeds: studioSpeeds },
	},
	{
		id: 'openai:astra', provider: 'OpenAI', label: 'GPT-6.2 Astra', description: 'Longer, more involved tasks.',
		features: { modes: ['plan', 'build'], reasoningEfforts: [high, medium, { value: 'xhigh', label: 'Extra high' }], speeds: studioSpeeds },
	},
	{
		id: 'anthropic:sonnet', provider: 'Anthropic', label: 'Claude Sonnet', description: 'Planning, writing, and code review.',
		features: { modes: ['plan', 'build'], reasoningEfforts: [medium, high], speeds: [standard] },
	},
	{
		id: 'anthropic:opus', provider: 'Anthropic', label: 'Claude Opus', description: 'Deep analysis of complex tasks.',
		features: { modes: ['plan', 'build'], reasoningEfforts: [high, medium], speeds: [standard] },
	},
	{
		id: 'google:flash', provider: 'Google', label: 'Gemini Flash', description: 'Quick tasks and summaries.',
		features: { modes: ['plan'], speeds: [standard] },
	},
	{
		id: 'google:pro', provider: 'Google', label: 'Gemini Pro', description: 'Exploring large amounts of context.',
		features: { modes: ['plan', 'build'], reasoningEfforts: [low, high], speeds: [standard] },
	},
];
const examples = reactive([
	{
		id: 'auto-only',
		title: 'Auto only',
		description: 'A short prompt with file attachments. The app chooses the model.',
		placeholder: 'What would you like help with?',
		rows: 1,
		layout: 'toolbar',
		models: [],
		draft: {},
		submission: null,
	},
	{
		id: 'compact-toolbar',
		title: 'Compact toolbar',
		description: 'Set the workflow beside the attachment button. Open the model picker for reasoning effort and speed.',
		placeholder: 'Describe what you want to build…',
		rows: 2,
		layout: 'toolbar',
		models,
		draft: { mode: 'build', model: 'auto' },
		autoFeatures: { speeds: [standard] },
		submission: null,
	},
	{
		id: 'visible-workflow',
		title: 'Built-in workflow menu',
		description: 'Switch between Plan and Build beside the attachment button.',
		placeholder: 'What should we work on?',
		rows: 3,
		layout: 'workflow',
		models,
		draft: { mode: 'plan', model: 'openai:sol' },
		submission: null,
	},
]);

/**
 * Applies the workflow chosen in the app's separate toolbar control.
 * @param {object} example Reactive demo state.
 * @param {'plan' | 'build'} mode Chosen workflow mode.
 */
function setWorkflow(example, mode) {
	example.draft = { ...example.draft, mode };
}

/**
 * Records a preview of the submitted request and resets the example prompt.
 *
 * @param {object} example Reactive demo state.
 * @param {import('@getdom/studio/vue').AiInputRequest} request Submitted prompt and settings.
 * @returns {void}
 */
function previewRequest(example, request) {
	const model = example.models.find((option) => option.id === request.model);
	example.submission = {
		text: request.text,
		files: request.attachments.map((file) => file.name),
		settings: [
			model?.label ?? 'Auto',
			request.mode,
			model?.features.reasoningEfforts?.find((option) => option.value === request.reasoningEffort)?.label,
			request.speed,
		].filter(Boolean).join(' · '),
	};
	example.draft = { ...example.draft, text: '', attachments: [] };
}
</script>

<template>
	<div class="w-full max-w-3xl divide-y divide-border">
		<section v-for="example in examples" :id="example.id" :key="example.id" class="scroll-mt-24 space-y-4 py-7 first:pt-0 last:pb-0">
			<div class="space-y-1">
				<h3 class="text-base font-semibold tracking-tight">{{ example.title }}</h3>
				<p class="text-sm leading-6 text-muted-fg">{{ example.description }}</p>
			</div>
			<DomAiInput
				v-model="example.draft"
				:aria-label="`${example.title} prompt`"
				:placeholder="example.placeholder"
				:rows="example.rows"
				:layout="example.layout"
				:mode-in-picker="false"
				:models="example.models"
				:auto-features="example.autoFeatures"
				@submit="previewRequest(example, $event)"
			>
				<template v-if="example.id === 'compact-toolbar'" #tools="{ disabled }">
					<DomDropdown
						:items="workflowOptions"
						:label="example.draft.mode === 'plan' ? 'Plan' : 'Build'"
						:disabled="disabled"
						trigger-class="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted-fg outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/60"
						placement="top"
						@select="setWorkflow(example, $event)"
					/>
				</template>
			</DomAiInput>
			<div v-if="example.submission" class="space-y-1 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm" role="status">
				<p class="font-semibold">Request preview</p>
				<p v-if="example.submission.text" class="whitespace-pre-wrap wrap-anywhere">{{ example.submission.text }}</p>
				<p v-if="example.submission.files.length" class="wrap-anywhere text-muted-fg">{{ example.submission.files.join(', ') }}</p>
				<p class="capitalize text-muted-fg">{{ example.submission.settings }}</p>
			</div>
		</section>
	</div>
</template>
