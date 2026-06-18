<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomProfileMenu } from '../../lib/vue';

import Basic from './examples/Basic.vue';
import BasicSrc from './examples/Basic.vue?raw';
import AppHeader from './examples/AppHeader.vue';
import AppHeaderSrc from './examples/AppHeader.vue?raw';
import CustomItems from './examples/CustomItems.vue';
import CustomItemsSrc from './examples/CustomItems.vue?raw';
import ComponentItems from './examples/ComponentItems.vue';
import ComponentItemsSrc from './examples/ComponentItems.vue?raw';

const doc = DomProfileMenu.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomProfileMenu"
					:initial="doc.playground.initial"
					title="Profile menu playground"
					description="Edit the identity props and menu rows, then open the menu to test keyboard navigation and item selection."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Signed-in app trigger">
				<Example
					:source="BasicSrc"
					filename="Basic.vue"
					description="The account trigger renders avatar, email, and chevron. The default menu is composed from MenuItem, MenuLabel, MenuSeparator, and DomThemeSwitcher as a profile row accessory."
				>
					<Basic />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Application header">
				<Example
					:source="AppHeaderSrc"
					filename="AppHeader.vue"
					description="Use show-name when the app chrome has room for a two-line identity trigger."
				>
					<AppHeader />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Items data">
				<Example
					:source="CustomItemsSrc"
					filename="CustomItems.vue"
					description="Pass items for the same profile/onboarding/theme/logout shape: label rows, separators, hrefs, submenus, tone, and accessorySlot."
				>
					<CustomItems />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Component rows">
				<Example
					:source="ComponentItemsSrc"
					filename="ComponentItems.vue"
					description="Use the item slot to resolve item.component or item.componentName, then render a custom Vue component inside the keyboard-managed menu row."
				>
					<ComponentItems />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomProfileMenu" />
			</DocSection>

			<ComponentSlots :component="DomProfileMenu" />
			<ComponentEvents :component="DomProfileMenu" />
		</DocPage>
	</DomStudioLayout>
</template>
