<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import DomAudioVisualizer from './DomAudioVisualizer.vue';
import SharedStream from './examples/SharedStream.vue';
import SharedStreamSource from './examples/SharedStream.vue?raw';
import MediaInputGuide from '../../components/_shared/media/MediaInputGuide.vue';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Audio visualizer" :tagline="DomAudioVisualizer.__doc.description" tag="<DomAudioVisualizer>">
			<DocSection eyebrow="Live example" title="Give any audio stream a visible signal"><Example :source="SharedStreamSource" filename="SharedStream.vue" :preview-lines="10"><SharedStream /></Example></DocSection>
			<DocSection title="Measured input, quiet when quiet"><p class="text-sm leading-relaxed text-muted-fg">The bars show recent RMS input levels from Web Audio, with a display curve that makes quiet audio easier to see. The <code>level</code> event emits the original amplitude from 0 to 1. No animation is fabricated when the microphone is silent, muted, or stopped. Reduced-motion preferences slow the visual update rate. This indicates audio activity, not speech detection or calibrated loudness.</p></DocSection>
			<MediaInputGuide />
			<DocSection title="Reference"><ComponentProps :component="DomAudioVisualizer" /><ComponentEvents :component="DomAudioVisualizer" /></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
