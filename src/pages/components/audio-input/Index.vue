<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import DomAudioInput from './DomAudioInput.vue';
import MicrophoneSetup from './examples/MicrophoneSetup.vue';
import MicrophoneSetupSource from './examples/MicrophoneSetup.vue?raw';
import MediaInputGuide from '../_shared/media/MediaInputGuide.vue';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Audio input" :tagline="DomAudioInput.__doc.description" tag="<DomAudioInput>">
			<DocSection eyebrow="Live example" title="Choose a mic. Check your sound."><Example :source="MicrophoneSetupSource" filename="MicrophoneSetup.vue"><MicrophoneSetup /></Example></DocSection>
			<MediaInputGuide />
			<DocSection title="Reference"><ComponentProps :component="DomAudioInput" /><ComponentEvents :component="DomAudioInput" /></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
