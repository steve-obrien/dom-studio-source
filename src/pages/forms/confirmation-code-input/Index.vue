<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import { DomConfirmationCodeInput } from '../../lib/vue';

import EmailConfirmation from './examples/EmailConfirmation.vue';
import EmailConfirmationSrc from './examples/EmailConfirmation.vue?raw';

const doc = DomConfirmationCodeInput.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomConfirmationCodeInput"
					:initial="{
						label: 'Confirmation code',
						description: 'Enter the six-character code sent to your email.',
						modelValue: '',
						length: 6,
						separatorAfter: 3,
						characterSet: 'alphanumeric',
						uppercase: true,
					}"
					title="Confirmation code input playground"
					description="Use numeric mode for digit-only codes, or keep the default alphanumeric mode for letters and numbers."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Email confirmation">
				<Example
					:source="EmailConfirmationSrc"
					filename="EmailConfirmation.vue"
					description="Typing advances automatically. Paste and one-time-code autofill distribute a complete code across all six boxes."
					default-open
				>
					<EmailConfirmation />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomConfirmationCodeInput" />
				<ComponentEvents :component="DomConfirmationCodeInput" />
				<ComponentKeyboard :component="DomConfirmationCodeInput" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
