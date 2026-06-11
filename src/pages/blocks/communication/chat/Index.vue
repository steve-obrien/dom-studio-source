<script setup>
import DomStudioLayout from '../../../_layout/DomStudioLayout.vue';
import DocPage from '../../../_layout/DocPage.vue';
import DocSection from '../../../_layout/DocSection.vue';
import Example from '../../../_layout/docs/Example.vue';
import AssistantChat from './examples/AssistantChat.vue';
import AssistantChatSrc from './examples/AssistantChat.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage
			name="Chat Block"
			tagline="A ChatGPT-style application shell with a thread sidebar, message stream, and composer."
			tag="Application UI"
			eyebrow="Blocks"
		>
			<DocSection eyebrow="Starter" title="Assistant chat">
				<Example
					:source="AssistantChatSrc"
					filename="AssistantChat.vue"
					presentation="iframe"
					frame-src="/blocks/communication/chat/preview/AssistantChat"
					description="A compact chat shell that uses cards for messages and keeps the controls native-feeling."
					default-open
				>
					<AssistantChat />
				</Example>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
