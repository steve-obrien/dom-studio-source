<script setup>
import DocSection from '../../../_layout/DocSection.vue';
</script>

<template>
	<DocSection eyebrow="Media input" title="Built to work together">
		<div class="grid gap-3 sm:grid-cols-2">
			<RouterLink to="/components/audio-controls" class="rounded-xl border border-border p-4 transition hover:bg-secondary"><p class="text-sm font-semibold text-canvas-fg">Audio controls</p><p class="mt-1 text-sm text-muted-fg">Click to talk, waveform, mute, and input settings.</p></RouterLink>
			<RouterLink to="/components/audio-input" class="rounded-xl border border-border p-4 transition hover:bg-secondary"><p class="text-sm font-semibold text-canvas-fg">Audio input</p><p class="mt-1 text-sm text-muted-fg">A standalone microphone setup and sound check.</p></RouterLink>
			<RouterLink to="/visual/audio-visualizer" class="rounded-xl border border-border p-4 transition hover:bg-secondary"><p class="text-sm font-semibold text-canvas-fg">Audio visualizer</p><p class="mt-1 text-sm text-muted-fg">Show the live level of an existing audio stream.</p></RouterLink>
			<RouterLink to="/components/camera-input" class="rounded-xl border border-border p-4 transition hover:bg-secondary"><p class="text-sm font-semibold text-canvas-fg">Camera input</p><p class="mt-1 text-sm text-muted-fg">Choose a webcam and check a local preview.</p></RouterLink>
		</div>
		<div class="mt-6 space-y-3 text-sm leading-relaxed text-muted-fg">
			<p><strong class="text-canvas-fg">Capture ownership.</strong> Audio input, Audio controls, and Camera input each own one capture session. Use one microphone capture component per session, then pass its stream to any extra visualisers. Stop, unmount, and page exit release owned tracks. Mute disables audio tracks but retains the microphone until Stop.</p>
			<p><strong class="text-canvas-fg">Device changes.</strong> Microphones switch only after the replacement opens successfully; failure keeps the previous stream. Cameras release the previous device first so phones can change cameras. Replace the input in your transport whenever <code>@stream</code> fires. Device removal or revoked access produces an error with an explicit retry.</p>
			<p><strong class="text-canvas-fg">Browser access.</strong> Open on HTTPS or localhost. Capture starts after a user action; device names may stay hidden until permission is granted. Embedded pages also need microphone/camera permission in the iframe and the parent’s Permissions Policy. <a href="https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4">Browser media permissions</a>.</p>
			<p><strong class="text-canvas-fg">Programmatic control.</strong> Capture components expose <code>start(): Promise&lt;MediaStream | null&gt;</code>, <code>stop()</code>, <code>stream</code>, and <code>state</code> through a template ref. Call <code>start()</code> from a user gesture. Constraints apply on the next start or device switch. These components do not establish an AI or meeting connection.</p>
		</div>
	</DocSection>
</template>
