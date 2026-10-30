<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

defineOptions({
	__doc: {
		nav: { section: 'ai' },
		name: 'Audio visualizer',
		tag: '<DomAudioVisualizer>',
		description: 'A live waveform of input levels from a MediaStream. Shows real audio activity without recording, playing, or transmitting the stream.',
		icon: 'M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4',
		events: [
			{ name: 'level', payload: '(level: number)', description: 'Measured RMS amplitude from 0 to 1, emitted at most ten times per second. This is input activity, not speech detection.' },
			{ name: 'error', payload: '({ name, message })', description: 'Web Audio could not analyse the stream. Capture remains owned by the caller.' },
		],
	},
});
const props = defineProps({
	stream: { type: Object, default: null, _edit: { description: 'Application-owned MediaStream. The visualizer never stops its tracks.' } },
	muted: { type: Boolean, default: false, _edit: { description: 'Show a flat baseline while the input is muted.' } },
	bars: { type: Number, default: 25, _edit: { description: 'Number of rounded bars, clamped to 8–64.' } },
	label: { type: String, default: 'Microphone input level', _edit: { description: 'Accessible name for the live input meter.' } },
});
const emit = defineEmits(['level', 'error']);
const levels = ref([]);
const level = ref(0);
const unavailable = ref(false);
let mounted = false;
let context;
let source;
let analyser;
let samples;
let frame = 0;
let lastSample = 0;
let lastEmit = 0;
let motionQuery;
let cleanupTracks = () => {};
/** Bounds SVG complexity even when a consumer supplies an invalid bar count. */
const count = computed(() => Number.isFinite(props.bars) ? Math.max(8, Math.min(64, Math.round(props.bars))) : 25);
/** Keeps the resting waveform visible while reserving height for real input. */
const heights = computed(() => Array.from({ length: count.value }, barHeight));
/** Maps sampled RMS to a readable display height without changing the source. */
function barHeight(_, index) { return 3 + Math.min(1, Math.sqrt(levels.value[index] || 0) * 2.5) * 37; }
/** Clears stale input activity whenever capture pauses or the source changes. */
function reset() { levels.value = Array(count.value).fill(0); level.value = 0; emit('level', 0); }
/** Closes only analysis resources; stream ownership stays with the caller. */
function cleanup() {
	cancelAnimationFrame(frame);
	cleanupTracks();
	cleanupTracks = () => {};
	source?.disconnect();
	analyser?.disconnect();
	if (context && context.state !== 'closed') context.close().catch(ignoreClosedContext);
	context = source = analyser = samples = null;
	reset();
}
/** Ignores a context that the browser has already closed during navigation. */
function ignoreClosedContext() {}
/** Emits a stable failure without interrupting an application-owned media stream. */
function failed(cause) {
	unavailable.value = true;
	emit('error', { name: cause?.name || 'Error', message: 'Audio visualisation is unavailable in this browser.' });
}
/** Builds a silent analysis graph for the new stream after browser mount. */
function connect() {
	if (!mounted) return;
	cleanup();
	unavailable.value = false;
	const tracks = props.stream?.getAudioTracks() || [];
	if (!tracks.some(isLive)) return;
	try {
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();
		analyser = context.createAnalyser();
		analyser.fftSize = 1024;
		samples = new Float32Array(analyser.fftSize);
		source = context.createMediaStreamSource(props.stream);
		source.connect(analyser);
		// AnalyserNode works without a speaker destination: no microphone feedback.
		for (const track of tracks) track.addEventListener('ended', connect);
		/** Removes source lifecycle listeners when the analyser is replaced. */
		cleanupTracks = () => { for (const track of tracks) track.removeEventListener('ended', connect); };
		resume();
		frame = requestAnimationFrame(sample);
	} catch (cause) { cleanup(); failed(cause); }
}
/** Tests source liveness without relying on a browser-specific MediaStream class. */
function isLive(track) { return track.readyState === 'live'; }
/** Resumes Web Audio from the next explicit interaction if autoplay suspended it. */
function resume() {
	const current = context;
	if (current?.state !== 'suspended') return;
	/** Ignores a suspended context replaced or disposed while resume was pending. */
	current.resume().catch((cause) => { if (mounted && current === context) failed(cause); });
}
/** Samples actual input energy; reduced motion uses a slower, non-animated meter. */
function sample(time) {
	if (!analyser) return;
	frame = requestAnimationFrame(sample);
	const cadence = motionQuery?.matches ? 250 : 40;
	if (time - lastSample < cadence) return;
	lastSample = time;
	const active = !props.muted && !document.hidden && props.stream?.getAudioTracks().some(isEnabled);
	let rms = 0;
	if (active) {
		analyser.getFloatTimeDomainData(samples);
		let sum = 0;
		for (const value of samples) sum += value * value;
		rms = Math.min(1, Math.sqrt(sum / samples.length));
	}
	level.value = rms;
	levels.value = active ? [...levels.value.slice(-(count.value - 1)), rms] : Array(count.value).fill(0);
	if (time - lastEmit >= 100) { lastEmit = time; emit('level', rms); }
}
/** Excludes disabled, interrupted and ended sources from the activity display. */
function isEnabled(track) { return isLive(track) && track.enabled && !track.muted; }
/** Connects only in the browser so SSR never requests media or creates audio nodes. */
onMounted(() => {
	mounted = true;
	motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	document.addEventListener('pointerdown', resume);
	document.addEventListener('keydown', resume);
	connect();
});
/** Rebuilds analysis when a parent replaces its stream. */
watch(() => props.stream, connect);
/** Removes old waveform history immediately when muted or resized. */
watch([() => props.muted, count], reset);
/** Releases the audio context and event/animation work without stopping input tracks. */
onBeforeUnmount(() => {
	mounted = false;
	cleanup();
	document.removeEventListener('pointerdown', resume);
	document.removeEventListener('keydown', resume);
});
</script>

<template>
	<div role="meter" :aria-label="unavailable ? 'Audio visualisation unavailable' : label" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(level * 100)" :aria-valuetext="unavailable ? 'Unavailable' : muted ? 'Muted' : !stream ? 'Input inactive' : level > 0.005 ? 'Audio received' : 'Quiet'" class="h-12 min-w-0 text-current" :data-audio-level="level.toFixed(4)">
		<svg class="h-full w-full" viewBox="0 0 200 48" preserveAspectRatio="none" aria-hidden="true">
			<line v-for="(height, index) in heights" :key="index" :x1="4 + index * 192 / (count - 1)" :x2="4 + index * 192 / (count - 1)" :y1="24 - height / 2" :y2="24 + height / 2" stroke="currentColor" :stroke-width="Math.min(3.5, 110 / count)" stroke-linecap="round" />
		</svg>
	</div>
</template>
