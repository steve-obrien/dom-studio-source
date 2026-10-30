<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import DomCameraInput from './DomCameraInput.vue';
import MeetingSetup from './examples/MeetingSetup.vue';
import MeetingSetupSource from './examples/MeetingSetup.vue?raw';
import MediaInputGuide from '../_shared/media/MediaInputGuide.vue';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Camera input" :tagline="DomCameraInput.__doc.description" tag="<DomCameraInput>">
			<DocSection eyebrow="Live example" title="Your pre-meeting check"><Example :source="MeetingSetupSource" filename="MeetingSetup.vue" :preview-lines="10"><MeetingSetup /></Example></DocSection>
			<DocSection title="A preview that stays local"><p class="text-sm leading-relaxed text-muted-fg">The camera requests video only. A mirrored, muted, inline preview works beside an independently controlled microphone. Set <code>:mirror="false"</code> for a rear-facing camera. Mirroring changes the preview only; the emitted stream keeps the camera’s original image. If autoplay is blocked, a Show camera preview button lets the viewer start playback.</p></DocSection>
			<MediaInputGuide />
			<DocSection title="Reference"><ComponentProps :component="DomCameraInput" /><ComponentEvents :component="DomCameraInput" /></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
