<script setup>
import DomAudioInput from '../DomAudioInput.vue';
</script>

<template>
	<div class="w-full max-w-md space-y-4">
		<div class="space-y-1">
			<h3 class="text-lg font-semibold tracking-tight text-canvas-fg">Sound good before you join.</h3>
			<p class="text-sm leading-relaxed text-muted-fg">Choose your microphone, then say a few words to check the input.</p>
		</div>
		<DomAudioInput />
		<p class="text-xs leading-relaxed text-muted-fg">This is a local microphone check. Audio is not recorded or sent.</p>
	</div>
</template>
