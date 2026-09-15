<script setup>
import { shallowRef } from 'vue';
import { DomAudioInput, DomAudioVisualizer } from '../../../lib/vue';

const stream = shallowRef(null);
/** Shares the existing capture stream; the second meter never opens a microphone. */
function receiveStream(value) { stream.value = value; }
</script>

<template>
	<div class="w-full max-w-md space-y-5">
		<DomAudioInput @stream="receiveStream" />
		<div class="space-y-2 rounded-2xl border border-border p-5">
			<p class="text-sm font-medium text-canvas-fg">The same stream, another view</p>
			<DomAudioVisualizer :stream="stream" :bars="40" class="h-20 text-primary" />
			<p class="text-xs leading-relaxed text-muted-fg">This standalone visualiser observes the existing stream. It does not request or own the microphone.</p>
		</div>
	</div>
</template>
