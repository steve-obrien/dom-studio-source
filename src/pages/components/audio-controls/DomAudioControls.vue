<script setup>
import { computed, nextTick, ref, useId } from 'vue';
import DomButton from '../button/DomButton.vue';
import DomIconButton from '../icon-button/DomIconButton.vue';
import DomPopover from '../popover/DomPopover.vue';
import DomAudioVisualizer from '../../visual/audio-visualizer/DomAudioVisualizer.vue';
import MediaDeviceSelect from '../_shared/media/MediaDeviceSelect.vue';
import { useMediaInput } from '../_shared/media/useMediaInput.js';

defineOptions({
	__doc: {
		nav: { section: 'ai' },
		name: 'Audio controls',
		tag: '<DomAudioControls>',
		description: 'Click to talk becomes a compact microphone control: stop, live waveform, mute, and input selection. Ready for voice AI, calls, and collaboration.',
		icon: 'M4 9v6M8 5v14M12 8v8M16 3v18M20 9v6',
		events: [
			{ name: 'stream', payload: '(stream: MediaStream | null)', description: 'Initial/replacement microphone stream, or null on stop. This component releases its owned tracks.' },
			{ name: 'update:deviceId', payload: '(deviceId: string)', description: 'Committed input selection, with v-model:deviceId support.' },
			{ name: 'update:muted', payload: '(muted: boolean)', description: 'Microphone mute state, with v-model:muted support.' },
			{ name: 'state', payload: "(state: 'idle' | 'requesting' | 'active' | 'error')", description: 'Local capture lifecycle, independent of your remote connection.' },
			{ name: 'error', payload: '({ name, message })', description: 'Permission, missing device, or capture failure.' },
		],
		keyboard: [
			{ keys: 'Tab', action: 'Move between stop, mute, and microphone settings.' },
			{ keys: 'Enter / Space', action: 'Activate the focused control.' },
			{ keys: 'Escape', action: 'Dismiss microphone settings and return to the trigger.' },
		],
	},
});
const props = defineProps({
	label: { type: String, default: 'Click to talk', _edit: { description: 'Button label before microphone capture starts.' } },
	deviceId: { type: String, default: '', _edit: { description: 'Input device ID, or empty for system default. Supports v-model:deviceId.' } },
	muted: { type: Boolean, default: false, _edit: { description: 'Mute the capture track while keeping its device open. Supports v-model:muted.' } },
	constraints: { type: Object, default: null, _edit: { description: 'Optional audio MediaTrackConstraints applied at start/selection. deviceId is controlled separately.' } },
});
const emit = defineEmits(['stream', 'update:deviceId', 'update:muted', 'state', 'error']);
const { stream, devices, deviceId, deviceLabel, muted, interrupted, pending, error, state, start, stop, select, refresh, toggleMuted } = useMediaInput('audio', props, emit);
const root = ref(null);
const settings = ref(null);
const settingsOpen = ref(false);
const triggerId = useId();
/** Announces lifecycle and mute changes without announcing each waveform sample. */
const status = computed(() => pending.value ? 'Waiting for microphone access' : interrupted.value ? 'Microphone interrupted' : !stream.value ? 'Microphone off' : muted.value ? 'Microphone muted' : `Microphone on: ${deviceLabel.value}`);
/** Starts capture and moves keyboard focus to the resulting control group. */
async function begin() {
	const active = await start();
	if (active) { await nextTick(); root.value?.querySelector('[data-stop]')?.focus(); }
}
/** Stops capture and restores focus to the click-to-talk button. */
async function end() {
	stop();
	settings.value?.close();
	await nextTick();
	root.value?.querySelector('[data-start]')?.focus();
}
/** Refreshes names after permission and whenever the settings panel opens. */
function openSettings() { settingsOpen.value = true; refresh(); }
/** Commits the chosen microphone then dismisses its settings panel on success. */
async function selectInput(value) { await select(value); if (!error.value) settings.value?.close(); }
defineExpose({ start, stop, stream, state });
</script>

<template>
	<div ref="root" class="inline-flex max-w-full flex-col items-center gap-3">
		<DomButton v-if="!stream && !pending" data-start size="lg" @click="begin">
			<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3" /></svg>
			{{ error ? 'Try again' : label }}
		</DomButton>
		<div v-else role="group" aria-label="Microphone controls" class="flex max-w-full items-center gap-1 rounded-full border border-border bg-secondary p-1.5 shadow-lg">
			<DomIconButton data-stop label="Stop microphone" variant="danger" size="lg" class="bg-destructive/15" icon="M6 6l12 12M18 6 6 18" @click="end" />
			<div class="flex h-12 w-32 min-w-12 items-center justify-center rounded-2xl bg-canvas px-2 sm:w-40">
				<span v-if="pending" role="status" class="truncate text-xs text-muted-fg">Connecting…</span>
				<DomAudioVisualizer v-else :stream="stream" :muted="muted || interrupted" class="w-full" :class="muted ? 'text-muted-fg/40' : 'text-canvas-fg'" />
			</div>
			<DomIconButton :label="muted ? 'Unmute microphone' : 'Mute microphone'" :aria-pressed="muted" :disabled="!stream" :active="muted" :variant="muted ? 'danger' : 'ghost'" size="lg" @click="toggleMuted">
				<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" /><path v-if="muted" d="m3 3 18 18" /></svg>
			</DomIconButton>
			<DomIconButton :id="triggerId" label="Select microphone" :aria-expanded="settingsOpen" aria-haspopup="dialog" :disabled="pending" size="lg" icon="m6 9 6 6 6-6" />
			<DomPopover ref="settings" :trigger-id="triggerId" position="bottom-end" :arrow="false" width="w-72 max-w-[calc(100vw-2rem)]" @open="openSettings" @close="settingsOpen = false">
				<div role="dialog" aria-label="Microphone settings" class="space-y-3">
					<p class="text-sm font-semibold text-canvas-fg">Audio input</p>
					<MediaDeviceSelect :devices="devices" :device-id="deviceId" :disabled="pending" @select="selectInput" />
					<p class="text-xs leading-relaxed text-muted-fg">Choose the microphone you want to use.</p>
				</div>
			</DomPopover>
		</div>
		<p role="status" class="sr-only">{{ status }}</p>
		<p v-if="error" role="alert" class="max-w-sm text-center text-sm leading-relaxed text-destructive">{{ error }}</p>
	</div>
</template>
