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
import { DomDropdown } from '../../lib/vue';

// Each example is its own SFC. We import it twice: as a component for the
// live render, and as a raw string for the code panel. They cannot drift.
import Basic from './examples/Basic.vue';
import BasicSrc from './examples/Basic.vue?raw';
import Rich from './examples/Rich.vue';
import RichSrc from './examples/Rich.vue?raw';
import WorkspaceSwitcher from './examples/WorkspaceSwitcher.vue';
import WorkspaceSwitcherSrc from './examples/WorkspaceSwitcher.vue?raw';
import ApplicationEnvironmentSwitcher from './examples/ApplicationEnvironmentSwitcher.vue';
import ApplicationEnvironmentSwitcherSrc from './examples/ApplicationEnvironmentSwitcher.vue?raw';
import StatusMenu from './examples/StatusMenu.vue';
import StatusMenuSrc from './examples/StatusMenu.vue?raw';
import Actions from './examples/Actions.vue';
import ActionsSrc from './examples/Actions.vue?raw';
import ComposedMenu from './examples/ComposedMenu.vue';
import ComposedMenuSrc from './examples/ComposedMenu.vue?raw';
import TreePanel from './examples/TreePanel.vue';
import TreePanelSrc from './examples/TreePanel.vue?raw';

const doc = DomDropdown.__doc;

const playgroundItems = [
	{ label: 'First option', value: 'a' },
	{ label: 'Second option', value: 'b' },
	{ label: 'Third option', value: 'c' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomDropdown"
					:initial="{ items: playgroundItems, label: 'Choose…' }"
					title="Dropdown playground"
					description="Edit props in the inspector — open the menu to preview item labels and alignment."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Basic">
				<Example
					:source="BasicSrc"
					filename="Basic.vue"
					description="Click the trigger to open the menu. Selected value is emitted via @select."
				>
					<Basic />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Custom item markup">
				<Example
					:source="RichSrc"
					filename="Rich.vue"
					description="The #trigger and #item slots accept any markup — avatars, descriptions, badges."
				>
					<Rich />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Workspace switcher">
				<Example
					:source="WorkspaceSwitcherSrc"
					filename="WorkspaceSwitcher.vue"
					description="Use rich dropdown rows for workspace, account, team, and organization switchers."
				>
					<WorkspaceSwitcher />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Application and environment switcher">
				<Example
					:source="ApplicationEnvironmentSwitcherSrc"
					filename="ApplicationEnvironmentSwitcher.vue"
					description="Compose a two-column application and environment picker with a custom dropdown panel, two radio menus, avatars, and action buttons."
				>
					<ApplicationEnvironmentSwitcher />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Status menu">
				<Example
					:source="StatusMenuSrc"
					filename="StatusMenu.vue"
					description="Dropdown menus are best for actions. Use rich rows, shortcuts, selected state, and severity tone when the menu changes workflow state."
				>
					<StatusMenu />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Actions menu — icon + label">
				<Example
					:source="ActionsSrc"
					filename="Actions.vue"
					description="Items with separator: true draw a divider. tone: 'danger' colours destructive rows red."
				>
					<Actions />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Composed menu">
				<Example
					:source="ComposedMenuSrc"
					filename="ComposedMenu.vue"
					description="Use the default slot for a composed DomMenu panel. MenuItem keeps selection and keyboard behaviour while #accessory and MenuLabel handle rich row content."
				>
					<ComposedMenu />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Tree view panel">
				<Example
					:source="TreePanelSrc"
					filename="TreePanel.vue"
					description="The #panel slot can host composite controls, so the tree keeps its own focus and arrow-key behaviour inside a scroll-locking dropdown."
				>
					<TreePanel />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomDropdown" />
			</DocSection>

			<ComponentSlots :component="DomDropdown" />
			<ComponentEvents :component="DomDropdown" />
			<ComponentKeyboard :component="DomDropdown" />
		</DocPage>
	</DomStudioLayout>
</template>
