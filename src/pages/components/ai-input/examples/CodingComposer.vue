<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
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
const microphone = ref(null);
const recording = ref(false);
const submitting = ref(false);
const recordingError = ref('');
const audioUrls = ref([]);
const approvalLabel = computed(() => approvalOptions.find((option) => option.value === approvals.value).label);
let recorder;
let segments = [];
let disposed = false;

/**
 * Applies the workflow requested by the application toolbar.
 * @param {'plan' | 'build'} mode Selected workflow.
 */
function setWorkflow(mode) {
	draft.value = { ...draft.value, mode };
}

/**
 * Finalises the current audio segment before its microphone track is released.
 */
function finishSegment() {
	if (recorder?.state === 'recording') recorder.stop();
	recorder = undefined;
}

/**
 * Starts recording the active microphone. Changing devices preserves earlier
 * segments. Stopping from the microphone controls discards the unsent audio.
 *
 * @param {MediaStream | null} stream Current microphone stream.
 */
function onMicrophoneStream(stream) {
	finishSegment();
	if (!stream) {
		recording.value = false;
		segments = [];
		return;
	}

	try {
		const segment = new MediaRecorder(stream);
		let blob;
		const result = new Promise((resolve) => {
			/** Stores the completed audio emitted before the stop event. */
			segment.ondataavailable = (event) => { blob = event.data; };
			/** Resolves only after the browser has delivered the audio. */
			segment.onstop = () => resolve(blob?.size ? blob : null);
			/** Ends a failed capture without enabling an empty submission. */
			segment.onerror = () => {
				resolve(null);
				if (recorder !== segment) return;
				recordingError.value = 'Audio recording failed. Start the microphone to try again.';
				microphone.value?.stop();
			};
		});
		segment.start();
		recorder = segment;
		segments.push(result);
		recordingError.value = '';
		recording.value = true;
	} catch {
		recordingError.value = 'This browser could not start an audio recording.';
		microphone.value?.stop();
	}
}

/** Releases audio previews when the next request is accepted or the demo leaves. */
function clearAudioPreviews() {
	for (const url of audioUrls.value) URL.revokeObjectURL(url);
	audioUrls.value = [];
}

/**
 * Sends the composer draft and any recorded audio to the local request preview.
 *
 * @param {import('@getdom/studio/vue').AiInputRequest} value Submitted composer request.
 */
async function send(value) {
	if (submitting.value) return;
	const pendingAudio = segments;
	const approval = approvals.value;
	submitting.value = true;
	try {
		finishSegment();
		microphone.value?.stop();
		const audio = (await Promise.all(pendingAudio)).filter(Boolean);
		if (disposed) return;
		if (pendingAudio.length && !audio.length) {
			recordingError.value = 'No audio was captured. Start the microphone and try again.';
			return;
		}

		clearAudioPreviews();
		audioUrls.value = audio.map((clip) => URL.createObjectURL(clip));
		request.value = {
			...value,
			approvals: approval,
			attachments: value.attachments.map(({ name }) => name),
			...(audio.length ? { audio: audio.map(({ type, size }) => ({ type, bytes: size })) } : {}),
		};
		recordingError.value = '';
		draft.value = { ...draft.value, text: '', attachments: [] };
	} finally {
		submitting.value = false;
	}
}

/** Cleans up active recording, microphone tracks, and local playback URLs. */
function dispose() {
	disposed = true;
	finishSegment();
	microphone.value?.stop();
	clearAudioPreviews();
}

onBeforeUnmount(dispose);
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
			:allow-empty-submit="recording"
			:submitting="submitting"
			aria-label="Coding composer prompt"
			placeholder="Describe the change you want to make…"
			@submit="send"
		>
			<template #tools="{ disabled }">
				<DomDropdown :items="approvalOptions" :label="approvalLabel" :disabled="disabled" :trigger-class="settingsButtonClass" placement="top" @select="approvals = $event" />
			</template>
			<template #actions="{ disabled }">
				<DomAudioControls ref="microphone" compact label="Start microphone" :disabled="disabled" @stream="onMicrophoneStream" />
			</template>
		</DomAiInput>
		<p v-if="recordingError" role="alert" class="text-sm text-destructive">{{ recordingError }}</p>
		<div v-if="request" class="space-y-2 rounded-lg border border-border bg-canvas p-3">
			<p role="status" class="text-xs font-semibold text-muted-fg">{{ audioUrls.length ? 'Voice prompt sent to the local demo' : 'Submitted request' }}</p>
			<audio
				v-for="(url, index) in audioUrls"
				:key="url"
				:src="url"
				:aria-label="`Sent audio ${index + 1}`"
				class="block w-full max-w-sm"
				controls
			/>
			<pre class="mt-1 max-h-36 overflow-auto text-xs leading-5">{{ JSON.stringify(request, null, 2) }}</pre>
		</div>
	</div>
</template>
