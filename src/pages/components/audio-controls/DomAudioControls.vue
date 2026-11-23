<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue';
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
	compact: { type: Boolean, default: false, _edit: { description: 'Use an icon trigger and a smaller toolbar-sized set of live controls.' } },
	disabled: { type: Boolean, default: false, _edit: { description: 'Prevent microphone capture and release any active or pending input.' } },
	deviceId: { type: String, default: '', _edit: { description: 'Input device ID, or empty for system default. Supports v-model:deviceId.' } },
	muted: { type: Boolean, default: false, _edit: { description: 'Mute the capture track while keeping its device open. Supports v-model:muted.' } },
	constraints: { type: Object, default: null, _edit: { description: 'Optional audio MediaTrackConstraints applied at start/selection. deviceId is controlled separately.' } },
});
const emit = defineEmits(['stream', 'update:deviceId', 'update:muted', 'state', 'error']);
const { stream, devices, deviceId, deviceLabel, muted, interrupted, pending, error, state, start: capture, stop, select, refresh, toggleMuted } = useMediaInput('audio', props, emit);
const root = ref(null);
const settings = ref(null);
const settingsOpen = ref(false);
const triggerId = useId();
const microphoneIcon = 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3';
/** Announces lifecycle and mute changes without announcing each waveform sample. */
const status = computed(() => pending.value ? 'Waiting for microphone access' : interrupted.value ? 'Microphone interrupted' : !stream.value ? 'Microphone off' : muted.value ? 'Microphone muted' : `Microphone on: ${deviceLabel.value}`);

/** Releases capture and closes input settings if the host disables this control. */
watch(() => props.disabled, (disabled) => {
	if (!disabled) return;
	settings.value?.close();
	stop();
});

/**
 * Opens the requested microphone when the control is enabled.
 *
 * @param {string} [selected] Input device ID, defaulting to the current selection.
 * @returns {Promise<MediaStream | null>} Committed stream, or null if unavailable.
 */
async function start(selected) {
	return props.disabled ? null : capture(selected);
}

/**
 * Starts capture from the trigger, moves focus to Stop, and restores focus to
 * Retry after a failed request if the user has stayed with the controls.
 *
 * @returns {Promise<void>}
 */
async function begin() {
	const result = start();
	await nextTick();
	root.value?.querySelector('[data-stop]')?.focus();

	if (await result || !error.value) return;
	await nextTick();
	const element = root.value;
	if (element && element.ownerDocument.activeElement === element.ownerDocument.body) {
		element.querySelector('[data-start]')?.focus();
	}
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
	<div ref="root" class="inline-flex min-w-0 max-w-full flex-col items-center" :class="compact ? 'gap-1' : 'gap-3'">
		<DomIconButton
			v-if="compact && !stream && !pending"
			data-start
			:label="error ? 'Retry microphone' : label"
			:title="error ? 'Retry microphone' : label"
			:icon="microphoneIcon"
			:disabled="disabled"
			@click="begin"
		/>
		<DomButton v-else-if="!stream && !pending" data-start size="lg" :disabled="disabled" @click="begin">
			<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path :d="microphoneIcon" /></svg>
			{{ error ? 'Try again' : label }}
		</DomButton>
		<div v-else role="group" aria-label="Microphone controls" class="flex max-w-full items-center rounded-full border border-border bg-secondary" :class="compact ? 'gap-0.5 p-0.5' : 'gap-1 p-1.5 shadow-lg'">
			<DomIconButton data-stop label="Stop microphone" variant="danger" :size="compact ? 'sm' : 'lg'" class="bg-destructive/15" icon="M6 6l12 12M18 6 6 18" @click="end" />
			<div class="flex items-center justify-center bg-canvas px-2" :class="compact ? 'h-8 w-20 min-w-0 rounded-full sm:w-28' : 'h-12 w-32 min-w-12 rounded-2xl sm:w-40'">
				<span v-if="pending" role="status" class="truncate text-xs text-muted-fg">Connecting…</span>
				<DomAudioVisualizer v-else :stream="stream" :muted="muted || interrupted" :bars="compact ? 17 : 25" class="w-full" :class="[compact && 'h-8!', muted ? 'text-muted-fg/40' : 'text-canvas-fg']" />
			</div>
			<DomIconButton :label="muted ? 'Unmute microphone' : 'Mute microphone'" :aria-pressed="muted" :disabled="disabled || !stream" :active="muted" :variant="muted ? 'danger' : 'ghost'" :size="compact ? 'sm' : 'lg'" @click="toggleMuted">
				<svg :class="compact ? 'size-4' : 'size-5'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path :d="`${microphoneIcon}M8 22h8`" /><path v-if="muted" d="m3 3 18 18" /></svg>
			</DomIconButton>
			<DomIconButton :id="triggerId" label="Select microphone" :aria-expanded="settingsOpen" aria-haspopup="dialog" :disabled="disabled || pending" :size="compact ? 'sm' : 'lg'" icon="m6 9 6 6 6-6" />
			<DomPopover ref="settings" :trigger-id="triggerId" :position="compact ? 'top-end' : 'bottom-end'" :arrow="false" width="w-72 max-w-[calc(100vw-2rem)]" @open="openSettings" @close="settingsOpen = false">
				<div role="dialog" aria-label="Microphone settings" class="space-y-3">
					<p class="text-sm font-semibold text-canvas-fg">Audio input</p>
					<MediaDeviceSelect :devices="devices" :device-id="deviceId" :disabled="pending" @select="selectInput" />
					<p class="text-xs leading-relaxed text-muted-fg">Choose the microphone you want to use.</p>
				</div>
			</DomPopover>
		</div>
		<p role="status" class="sr-only">{{ status }}</p>
		<p v-if="error" role="alert" class="text-center leading-relaxed text-destructive" :class="compact ? 'max-w-44 text-xs' : 'max-w-sm text-sm'">{{ error }}</p>
	</div>
</template>
