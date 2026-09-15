<script setup>
import { computed } from 'vue';
import DomButton from '../button/DomButton.vue';
import DomIconButton from '../icon-button/DomIconButton.vue';
import DomAudioVisualizer from '../../visual/audio-visualizer/DomAudioVisualizer.vue';
import MediaDeviceSelect from '../_shared/media/MediaDeviceSelect.vue';
import { useMediaInput } from '../_shared/media/useMediaInput.js';

defineOptions({
	__doc: {
		nav: { section: 'ai' },
		name: 'Audio input',
		tag: '<DomAudioInput>',
		description: 'Microphone setup with device selection, a live input meter, mute, and explicit start/stop. Emits a local MediaStream for your meeting or AI application.',
		icon: 'M12 15a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v7a3 3 0 0 0 3 3ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8',
		events: [
			{ name: 'stream', payload: '(stream: MediaStream | null)', description: 'Emits the initial or replacement stream; null means capture stopped. This component owns and releases its tracks.' },
			{ name: 'update:deviceId', payload: '(deviceId: string)', description: 'Committed microphone selection. Supports v-model:deviceId.' },
			{ name: 'update:muted', payload: '(muted: boolean)', description: 'Track enabled state changed. Supports v-model:muted.' },
			{ name: 'state', payload: "(state: 'idle' | 'requesting' | 'active' | 'error')", description: 'Local device lifecycle. Active does not imply a network connection.' },
			{ name: 'error', payload: '({ name, message })', description: 'Actionable capture failure. A failed microphone switch keeps the previous stream.' },
		],
	},
});
const props = defineProps({
	deviceId: { type: String, default: '', _edit: { description: 'Microphone device ID, or empty for the system default. Supports v-model:deviceId.' } },
	muted: { type: Boolean, default: false, _edit: { description: 'Mute current and future tracks without releasing the microphone. Supports v-model:muted.' } },
	constraints: { type: Object, default: null, _edit: { description: 'Optional audio MediaTrackConstraints, applied at start or selection. deviceId is controlled separately.' } },
	label: { type: String, default: 'Microphone', _edit: { description: 'Setup heading and device picker label.' } },
});
const emit = defineEmits(['stream', 'update:deviceId', 'update:muted', 'state', 'error']);
const { stream, devices, deviceId, muted, interrupted, pending, error, state, start, stop, select, refresh, toggleMuted } = useMediaInput('audio', props, emit);
/** Explains the true input state without confusing a quiet microphone with failure. */
const status = computed(() => pending.value ? 'Waiting for microphone access…' : interrupted.value ? 'Microphone interrupted' : !stream.value ? 'Microphone is off' : muted.value ? 'Microphone muted' : 'Speak to check your input');
defineExpose({ start, stop, stream, state });
</script>

<template>
	<section class="w-full min-w-0 space-y-5 rounded-2xl border border-border bg-canvas p-5 text-canvas-fg" :aria-label="`${label} setup`">
		<div class="flex items-center justify-between gap-3">
			<h3 class="text-sm font-semibold">{{ label }}</h3>
			<span class="flex items-center gap-1.5 text-xs text-muted-fg"><span class="size-1.5 rounded-full" :class="stream && !muted && !interrupted ? 'bg-success' : 'bg-muted-fg/40'" />{{ stream ? 'On' : 'Off' }}</span>
		</div>
		<MediaDeviceSelect :devices="devices" :device-id="deviceId" :label="label" :disabled="pending" @select="select" @focusin="refresh" />
		<div class="rounded-xl bg-secondary/60 px-4 py-3">
			<DomAudioVisualizer :stream="stream" :muted="muted || interrupted" class="text-primary" />
			<p role="status" class="mt-2 text-center text-xs text-muted-fg">{{ status }}</p>
		</div>
		<p v-if="error" role="alert" class="text-sm leading-relaxed text-destructive">{{ error }}</p>
		<div class="flex flex-wrap items-center gap-2">
			<DomButton v-if="!stream && !pending" size="sm" @click="start()">{{ error ? 'Try microphone again' : 'Enable microphone' }}</DomButton>
			<DomButton v-if="pending || stream" variant="secondary" size="sm" @click="stop">{{ pending ? 'Cancel' : 'Stop microphone' }}</DomButton>
			<DomIconButton v-if="stream" :label="muted ? 'Unmute microphone' : 'Mute microphone'" :aria-pressed="muted" :active="muted" :variant="muted ? 'danger' : 'ghost'" @click="toggleMuted">
				<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" /><path v-if="muted" d="m3 3 18 18" /></svg>
			</DomIconButton>
		</div>
	</section>
</template>
