<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import { DomSelect } from '../../lib/vue';

import RichWorkspace from './examples/RichWorkspace.vue';
import RichWorkspaceSrc from './examples/RichWorkspace.vue?raw';
import PlanSelect from './examples/PlanSelect.vue';
import PlanSelectSrc from './examples/PlanSelect.vue?raw';
import OptionalAssignment from './examples/OptionalAssignment.vue';
import OptionalAssignmentSrc from './examples/OptionalAssignment.vue?raw';
import GroupedContentTypes from './examples/GroupedContentTypes.vue';
import GroupedContentTypesSrc from './examples/GroupedContentTypes.vue?raw';
import ContactDirectory from './examples/ContactDirectory.vue';
import ContactDirectorySrc from './examples/ContactDirectory.vue?raw';

const doc = DomSelect.__doc;
const options = [
	{ label: 'Starter', value: 'starter', description: 'For small projects.' },
	{ label: 'Pro', value: 'pro', description: 'For growing teams.' },
	{ label: 'Enterprise', value: 'enterprise', description: 'For regulated work.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomSelect"
					:initial="{ label: 'Plan', modelValue: 'pro', options }"
					title="Select playground"
					description="Use DomSelect instead of DomNativeSelect when options need custom rows, metadata, status, or previews."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Workspace switcher">
				<Example
					:source="RichWorkspaceSrc"
					filename="RichWorkspace.vue"
					description="The searchable panel opens to the full option list, then filters rich rows as the user types while v-model stores a simple value."
				>
					<RichWorkspace />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Plan picker">
				<Example
					:source="PlanSelectSrc"
					filename="PlanSelect.vue"
					description="Use a rich select for plan, workspace, role, provider, template, and project pickers instead of a native select."
				>
					<PlanSelect />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Grouped content types">
				<Example
					:source="GroupedContentTypesSrc"
					filename="GroupedContentTypes.vue"
					description="Set option.group to add labelled, non-selectable sections with sticky headings. Each description stays hidden in a hover-and-focus popover, while a checkmark distinguishes the committed choice from the active row."
				>
					<GroupedContentTypes />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Contact directory">
				<Example
					:source="ContactDirectorySrc"
					filename="ContactDirectory.vue"
					description="A 52-contact directory exercises sticky headings from A through Z. Scroll the open list to watch each alphabetical group replace the previous heading."
				>
					<ContactDirectory />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Optional value">
				<Example
					:source="OptionalAssignmentSrc"
					filename="OptionalAssignment.vue"
					description="Include an option with value '' when the field should support an explicit unset state."
				>
					<OptionalAssignment />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomSelect" />
			</DocSection>

			<ComponentSlots :component="DomSelect" />
			<ComponentEvents :component="DomSelect" />
			<ComponentKeyboard :component="DomSelect" />
		</DocPage>
	</DomStudioLayout>
</template>
