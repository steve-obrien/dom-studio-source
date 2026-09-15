<script setup>
import { ref } from 'vue';
import DomAudioControls from '../DomAudioControls.vue';

const active = ref(false);
const muted = ref(false);
/** Receives the locally owned stream; pass it to your transport at this boundary. */
function receiveStream(stream) { active.value = Boolean(stream); }
</script>

<template>
	<div data-theme="dark" class="w-full overflow-hidden rounded-3xl border border-border bg-canvas text-canvas-fg">
		<div class="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
			<span class="text-xs font-medium tracking-wide">Voice session</span>
			<span class="flex items-center gap-2 text-xs text-muted-fg"><span class="size-1.5 rounded-full" :class="active && !muted ? 'bg-success' : 'bg-muted-fg/50'" />Local preview</span>
		</div>
		<div class="flex min-h-72 flex-col items-center justify-center gap-7 px-3 py-10 text-center sm:px-8">
			<div class="space-y-2">
				<p class="text-xl font-semibold tracking-tight">{{ active ? muted ? 'Take a moment.' : 'You have the mic.' : 'Start with your voice.' }}</p>
				<p class="text-sm text-muted-fg">{{ active ? muted ? 'Unmute whenever you’re ready.' : 'Speak and watch your input respond.' : 'One click to choose your mic and check your audio.' }}</p>
			</div>
			<DomAudioControls v-model:muted="muted" @stream="receiveStream" />
		</div>
		<p class="border-t border-border px-5 py-4 text-center text-xs text-muted-fg">Your audio stays on this device. Nothing is recorded or sent.</p>
	</div>
</template>
