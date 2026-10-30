<script setup>
import { DomAudioInput, DomCameraInput } from '../../../lib/vue';
</script>

<template>
	<div class="w-full space-y-5">
		<div class="space-y-1">
			<h3 class="text-xl font-semibold tracking-tight text-canvas-fg">Before you join</h3>
			<p class="text-sm leading-relaxed text-muted-fg">Check your camera and microphone. Turn on either independently.</p>
		</div>
		<div class="grid items-start gap-4 xl:grid-cols-2">
			<DomCameraInput :constraints="{ width: { ideal: 1280 }, facingMode: 'user' }" />
			<DomAudioInput />
		</div>
		<p class="text-xs text-muted-fg">Your preview stays on this device. Nothing is recorded or sent.</p>
	</div>
</template>
