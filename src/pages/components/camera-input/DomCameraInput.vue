<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import DomButton from '../button/DomButton.vue';
import MediaDeviceSelect from '../_shared/media/MediaDeviceSelect.vue';
import { useMediaInput } from '../_shared/media/useMediaInput.js';

defineOptions({
	__doc: {
		nav: { section: 'ai' },
		name: 'Camera input',
		tag: '<DomCameraInput>',
		description: 'Select a webcam and check a private local preview before joining a call. Emits a video-only MediaStream and releases the camera when stopped.',
		icon: 'M3 5h12v14H3zM15 10l6-4v12l-6-4',
		events: [
			{ name: 'stream', payload: '(stream: MediaStream | null)', description: 'Video-only local stream or null when released. Cameras are released before switching for mobile compatibility.' },
			{ name: 'update:deviceId', payload: '(deviceId: string)', description: 'Committed camera selection. Supports v-model:deviceId.' },
			{ name: 'state', payload: "(state: 'idle' | 'requesting' | 'active' | 'error')", description: 'Local camera capture state.' },
			{ name: 'error', payload: '({ name, message })', description: 'Camera access or device failure.' },
		],
	},
});
const props = defineProps({
	deviceId: { type: String, default: '', _edit: { description: 'Camera device ID, or empty for system default. Supports v-model:deviceId.' } },
	constraints: { type: Object, default: null, _edit: { description: 'Optional video MediaTrackConstraints such as facingMode or ideal width. Applied at start or selection.' } },
	mirror: { type: Boolean, default: true, _edit: { description: 'Mirror only the local preview for a front-facing camera. The emitted stream is unchanged.' } },
	label: { type: String, default: 'Camera', _edit: { description: 'Setup heading and camera picker label.' } },
});
const emit = defineEmits(['stream', 'update:deviceId', 'state', 'error']);
const { stream, devices, deviceId, deviceLabel, interrupted, pending, error, state, start, stop, select, refresh } = useMediaInput('video', props, emit);
const video = ref(null);
const previewBlocked = ref(false);
let playback = 0;
/** Describes capture independently of whether browser autoplay displayed it. */
const status = computed(() => pending.value ? 'Waiting for camera access…' : interrupted.value ? 'Camera interrupted' : stream.value ? 'Camera preview is on' : 'Camera is off');
/** Binds a MediaStream using srcObject; avoids URLs, recording, and audio playback. */
async function showPreview() {
	const version = ++playback;
	const element = video.value;
	if (!element) return;
	previewBlocked.value = false;
	element.srcObject = stream.value;
	if (!stream.value) return;
	try { await element.play(); }
	catch { if (version === playback) previewBlocked.value = true; }
}
/** Attaches each replacement stream after Vue creates its video element. */
watch([stream, video], showPreview, { flush: 'post' });
/** Clears media-element references after capture ownership releases its tracks. */
onBeforeUnmount(() => { playback++; if (video.value) video.value.srcObject = null; });
defineExpose({ start, stop, stream, state });
</script>

<template>
	<section class="w-full min-w-0 space-y-5 rounded-2xl border border-border bg-canvas p-5 text-canvas-fg" :aria-label="`${label} setup`">
		<div class="flex items-center justify-between gap-3">
			<h3 class="text-sm font-semibold">{{ label }}</h3>
			<span class="flex items-center gap-1.5 text-xs text-muted-fg"><span class="size-1.5 rounded-full" :class="stream && !interrupted ? 'bg-success' : 'bg-muted-fg/40'" />{{ stream ? 'On' : 'Off' }}</span>
		</div>
		<div class="relative aspect-video overflow-hidden rounded-xl border border-border bg-secondary">
			<video v-if="stream" ref="video" autoplay muted playsinline :aria-label="`${deviceLabel} local preview`" class="h-full w-full object-cover" :class="{ '-scale-x-100': mirror }" />
			<div v-if="!stream || previewBlocked || interrupted" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary text-muted-fg">
				<svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h12v14H3zM15 10l6-4v12l-6-4" /></svg>
				<DomButton v-if="previewBlocked" variant="secondary" size="sm" @click="showPreview">Show camera preview</DomButton>
				<p v-else class="text-sm">{{ pending ? 'Starting camera…' : interrupted ? 'Camera interrupted' : 'Your camera preview' }}</p>
			</div>
		</div>
		<MediaDeviceSelect :devices="devices" :device-id="deviceId" :label="label" :disabled="pending" @select="select" @focusin="refresh" />
		<p v-if="error" role="alert" class="text-sm leading-relaxed text-destructive">{{ error }}</p>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<DomButton v-if="!stream && !pending" size="sm" @click="start()">{{ error ? 'Try camera again' : 'Enable camera' }}</DomButton>
			<DomButton v-else variant="secondary" size="sm" @click="stop">{{ pending ? 'Cancel' : 'Stop camera' }}</DomButton>
			<p role="status" class="text-xs text-muted-fg">{{ status }}</p>
		</div>
	</section>
</template>
