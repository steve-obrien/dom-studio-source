<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomAudioControls from './DomAudioControls.vue';
import VoiceSession from './examples/VoiceSession.vue';
import VoiceSessionSource from './examples/VoiceSession.vue?raw';
import MediaInputGuide from '../_shared/media/MediaInputGuide.vue';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Audio controls" :tagline="DomAudioControls.__doc.description" tag="<DomAudioControls>">
			<DocSection eyebrow="Live example" title="From one click to a live input">
				<Example :source="VoiceSessionSource" filename="VoiceSession.vue" :preview-lines="10"><VoiceSession /></Example>
			</DocSection>
			<DocSection title="A small control for real conversations">
				<div class="grid gap-6 text-sm leading-relaxed text-muted-fg sm:grid-cols-2">
					<div class="space-y-2"><h3 class="font-semibold text-canvas-fg">Click to talk</h3><p>The button asks for microphone access. Once active, it becomes a compact group with Stop, the waveform, Mute, and microphone selection. The waveform stays flat when the input is quiet.</p></div>
					<div class="space-y-2"><h3 class="font-semibold text-canvas-fg">Connect it to your app</h3><p>Listen for <code>@stream</code> to receive a <code>MediaStream</code>. A new stream means the input changed; <code>null</code> means it stopped. Your app owns transport, AI processing, recording, and remote connection status.</p></div>
				</div>
			</DocSection>
			<MediaInputGuide />
			<DocSection title="Reference"><ComponentProps :component="DomAudioControls" /><ComponentEvents :component="DomAudioControls" /></DocSection>
			<ComponentKeyboard :component="DomAudioControls" />
		</DocPage>
	</DomStudioLayout>
</template>
