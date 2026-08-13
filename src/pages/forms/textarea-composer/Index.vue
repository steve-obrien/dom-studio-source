<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomTextareaComposer } from '../../lib/vue';

import AttachmentComposer from './examples/AttachmentComposer.vue';
import AttachmentComposerSrc from './examples/AttachmentComposer.vue?raw';

const doc = DomTextareaComposer.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try the composer live">
				<Playground
					:inspect="DomTextareaComposer"
					:initial="{
						label: 'Message',
						placeholder: 'Write a message...',
						modelValue: '',
						rows: 2,
						maxRows: 8,
					}"
					title="Textarea composer playground"
					description="The text area grows until maxRows, while the submit action remains inside the shared input frame."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Composer with attachments and controls">
				<Example
					:source="AttachmentComposerSrc"
					filename="AttachmentComposer.vue"
					description="Slots accept application-owned attachment previews, tools, model controls, voice actions, and custom submit UI without imposing an upload data model."
					default-open
				>
					<AttachmentComposer />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomTextareaComposer" />
				<ComponentEvents :component="DomTextareaComposer" />
				<ComponentKeyboard :component="DomTextareaComposer" />
			</DocSection>

			<ComponentSlots :component="DomTextareaComposer" />
		</DocPage>
	</DomStudioLayout>
</template>
