<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { DomAiInput, DomButton, DomIconButton } from '@getdom/studio/vue';

const transcriptChunks = ['Draft a quick plan ', 'for the next ', 'set of release notes.'];
const replyChunks = [
	'Start with a short summary of what changed. ',
	'Group the new features and fixes, then call out any upgrade steps. ',
	'Finish with a link to the full changelog.',
];
const microphoneIcon = 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3';
const draft = ref({ text: '' });
const phase = ref('idle');
const transcript = ref('');
const submittedPrompt = ref('');
const reply = ref('');
const announcement = ref('');
const playing = ref(false);
const playbackError = ref('');
const micLabel = computed(() => phase.value === 'dictating' ? 'Finish sample dictation' : 'Start sample dictation');
let scheduledChunk;
let utterance;

/**
 * Emits each scripted chunk once at the given cadence, then completes the sample.
 *
 * @param {string[]} chunks Nonempty, ordered sample fragments.
 * @param {import('vue').Ref<string>} output Text displayed as the sample arrives.
 * @param {number} interval Milliseconds between fragments.
 * @param {() => void} finish Callback when the last fragment has arrived.
 * @returns {void}
 */
function streamSample(chunks, output, interval, finish) {
	let index = 0;

	/** Appends one fragment and schedules its successor if one remains. */
	function deliver() {
		output.value += chunks[index++];
		if (index < chunks.length) {
			scheduledChunk = setTimeout(deliver, interval);
		} else {
			scheduledChunk = undefined;
			finish();
		}
	}

	scheduledChunk = setTimeout(deliver, interval);
}

/**
 * Finalises any received sample text without overwriting edits made during dictation.
 *
 * @returns {void}
 */
function finishDictation() {
	clearTimeout(scheduledChunk);
	scheduledChunk = undefined;
	if (transcript.value.trim()) {
		const text = [draft.value.text.trimEnd(), transcript.value.trim()].filter(Boolean).join('\n\n');
		draft.value = { ...draft.value, text };
		announcement.value = 'Sample transcript added to the prompt.';
	} else {
		announcement.value = 'Sample dictation ended.';
	}
	phase.value = 'idle';
}

/**
 * Starts sample dictation, or commits the portion heard when the visitor stops it.
 *
 * @returns {void}
 */
function toggleDictation() {
	if (phase.value === 'dictating') {
		finishDictation();
		return;
	}
	if (phase.value === 'responding') return;
	transcript.value = '';
	phase.value = 'dictating';
	announcement.value = 'Simulating dictation.';
	streamSample(transcriptChunks, transcript, 500, finishDictation);
}

/**
 * Accepts the edited prompt and begins streaming the sample assistant reply.
 *
 * @param {import('@getdom/studio/vue').AiInputRequest} request Submitted composer value.
 * @returns {void}
 */
function send(request) {
	stopPlayback();
	playbackError.value = '';
	submittedPrompt.value = request.text || request.attachments.map(({ name }) => name).join(', ');
	draft.value = { text: '' };
	reply.value = '';
	phase.value = 'responding';
	announcement.value = 'Streaming sample reply.';
	streamSample(replyChunks, reply, 400, finishReply);
}

/** Announces that the complete reply is available to read and play. */
function finishReply() {
	phase.value = 'idle';
	announcement.value = 'Sample reply ready.';
}

/** Stops this demo's reply playback and ignores any late speech events. */
function stopPlayback() {
	if (!utterance) return;
	utterance = undefined;
	playing.value = false;
	window.speechSynthesis.cancel();
}

/** Finishes the current utterance without altering the reply text. */
function finishPlayback(event) {
	if (event.currentTarget !== utterance) return;
	utterance = undefined;
	playing.value = false;
	if (event.type === 'error') playbackError.value = 'Playback failed. You can still read the reply.';
}

/** Reads the canned reply aloud with a local English voice when available. */
function togglePlayback() {
	if (playing.value) {
		stopPlayback();
		return;
	}
	const speech = window.speechSynthesis;
	const voice = speech?.getVoices().find((option) => option.localService && /^en(?:-|$)/i.test(option.lang));
	if (!voice || !window.SpeechSynthesisUtterance) {
		playbackError.value = 'A local English voice is unavailable in this browser.';
		return;
	}
	playbackError.value = '';
	utterance = new SpeechSynthesisUtterance(reply.value);
	utterance.voice = voice;
	utterance.lang = voice.lang;
	utterance.onend = finishPlayback;
	utterance.onerror = finishPlayback;
	playing.value = true;
	speech.speak(utterance);
}

/** Prompts the browser to load its voice list before the visitor can play a reply. */
function preparePlayback() {
	window.speechSynthesis?.getVoices();
}

/** Releases scheduled sample events and any running playback on navigation. */
function dispose() {
	clearTimeout(scheduledChunk);
	stopPlayback();
}

onMounted(preparePlayback);
onBeforeUnmount(dispose);
</script>

<template>
	<div class="w-full max-w-3xl space-y-3">
		<DomAiInput
			v-model="draft"
			aria-label="Sample voice prompt"
			placeholder="Try the microphone to fill in a sample prompt…"
			:submit-disabled="phase === 'dictating'"
			:submitting="phase === 'responding'"
			@submit="send"
		>
			<template #actions="{ disabled }">
				<DomIconButton
					:label="micLabel"
					:title="micLabel"
					:icon="phase === 'dictating' ? 'M7 7h10v10H7z' : microphoneIcon"
					:variant="phase === 'dictating' ? 'danger' : 'ghost'"
					:disabled="disabled"
					@click="toggleDictation"
				/>
			</template>
		</DomAiInput>

		<p role="status" class="sr-only">{{ announcement }}</p>
		<p v-if="phase === 'dictating'" class="wrap-anywhere text-sm text-muted-fg">
			{{ transcript || 'Simulating speech…' }}
		</p>

		<div v-if="submittedPrompt" class="space-y-3 rounded-xl border border-border bg-canvas p-4">
			<div>
				<p class="text-xs font-semibold text-muted-fg">You</p>
				<p class="mt-1 whitespace-pre-wrap wrap-anywhere text-sm">{{ submittedPrompt }}</p>
			</div>
			<div class="space-y-2 border-t border-border pt-3">
				<p class="text-xs font-semibold text-muted-fg">Sample assistant reply</p>
				<p class="text-sm leading-6">{{ reply || 'Waiting for the first words…' }}</p>
				<div v-if="phase !== 'responding'" class="flex flex-wrap items-center gap-x-3 gap-y-2">
					<DomButton size="sm" variant="secondary" @click="togglePlayback">
						{{ playing ? 'Stop playback' : 'Play sample reply' }}
					</DomButton>
					<p v-if="playbackError" role="status" class="text-xs text-muted-fg">{{ playbackError }}</p>
				</div>
			</div>
		</div>
	</div>
</template>
