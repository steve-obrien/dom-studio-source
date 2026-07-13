<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomInputGroup } from '../../lib/vue';

import ConfiguredCredentials from './examples/ConfiguredCredentials.vue';
import ConfiguredCredentialsSrc from './examples/ConfiguredCredentials.vue?raw';
import ConfiguredPaymentCard from './examples/ConfiguredPaymentCard.vue';
import ConfiguredPaymentCardSrc from './examples/ConfiguredPaymentCard.vue?raw';
import TemplateCredentials from './examples/TemplateCredentials.vue';
import TemplateCredentialsSrc from './examples/TemplateCredentials.vue?raw';
import TemplatePaymentCard from './examples/TemplatePaymentCard.vue';
import TemplatePaymentCardSrc from './examples/TemplatePaymentCard.vue?raw';

const doc = DomInputGroup.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Composition" title="Keep separate fields inside one visual control">
				<div class="space-y-4">
					<p class="max-w-3xl text-sm leading-6 text-muted-fg">
						The group only owns presentation. Whether controls come from a form definition or direct template
						markup, they still register with DomForm, so names, values, validators, and the emitted model shape
						stay unchanged. Set each field's <code class="font-mono text-canvas-fg">chrome</code> to
						<code class="font-mono text-canvas-fg">false</code>. Supporting UI such as
						<code class="font-mono text-canvas-fg">DomPasswordStrength</code> belongs in the group's
						<code class="font-mono text-canvas-fg">feedback</code> slot. Its
						<code class="font-mono text-canvas-fg">descriptionMode</code> can be set to
						<code class="font-mono text-canvas-fg">tooltip</code> to keep the group compact.
					</p>
					<Example
						:source="ConfiguredCredentialsSrc"
						filename="ConfiguredCredentials.vue"
						description="Form definition: email and password are declared as configuration children, including the named feedback slot."
					>
						<ConfiguredCredentials />
					</Example>
					<Example
						:source="TemplateCredentialsSrc"
						filename="TemplateCredentials.vue"
						description="Template markup: the same controls are ordinary Vue children, and the strength meter uses #feedback."
						default-open
					>
						<TemplateCredentials />
					</Example>
				</div>
			</DocSection>

			<DocSection eyebrow="Layout" title="Split a grouped row into columns">
				<div class="space-y-4">
					<p class="max-w-3xl text-sm leading-6 text-muted-fg">
						Declarative children can include layout elements as well as fields. This card example keeps the
						long card number on its own row, then uses a two-column child with a visible divider between expiry
						and CVC. Each value still registers independently and any validation messages render below the
						complete control.
					</p>
					<Example
						:source="ConfiguredPaymentCardSrc"
						filename="ConfiguredPaymentCard.vue"
						description="Form definition: a declarative div creates the two-column expiry and CVC row."
					>
						<ConfiguredPaymentCard />
					</Example>
					<Example
						:source="TemplatePaymentCardSrc"
						filename="TemplatePaymentCard.vue"
						description="Template markup: an ordinary grid div creates the same second row while all three inputs remain independent form fields."
						default-open
					>
						<TemplatePaymentCard />
					</Example>
				</div>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomInputGroup" />
			</DocSection>

			<ComponentSlots :component="DomInputGroup" />
		</DocPage>
	</DomStudioLayout>
</template>
