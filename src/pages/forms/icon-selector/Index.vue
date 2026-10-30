<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomIconSelector } from '../../lib/vue';

import IconPathPicker from './examples/IconPathPicker.vue';
import IconPathPickerSrc from './examples/IconPathPicker.vue?raw';
import EmojiPicker from './examples/EmojiPicker.vue';
import EmojiPickerSrc from './examples/EmojiPicker.vue?raw';
import CustomSymbolSet from './examples/CustomSymbolSet.vue';
import CustomSymbolSetSrc from './examples/CustomSymbolSet.vue?raw';

const doc = DomIconSelector.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag" eyebrow="Form primitive">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomIconSelector"
					:initial="{ label: 'Icon', modelValue: 'M12 5v14M5 12h14', kind: 'icons', placeholder: 'Search icons' }"
					title="Icon selector playground"
					description="Search the DOM Studio icon inventory and commit SVG path data through v-model."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="SVG path picker">
				<Example
					:source="IconPathPickerSrc"
					filename="IconPathPicker.vue"
					description="Use the default icons collection when a component prop expects 24x24 SVG path data."
				>
					<IconPathPicker />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Emoji picker">
				<Example
					:source="EmojiPickerSrc"
					filename="EmojiPicker.vue"
					description="Switch kind to emoji for reaction pickers, labels, and other compact symbol fields."
				>
					<EmojiPicker />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Custom symbols">
				<Example
					:source="CustomSymbolSetSrc"
					filename="CustomSymbolSet.vue"
					description="Use kind custom with items when an app has its own symbol ids, status taxonomy, or third-party icon rows."
				>
					<CustomSymbolSet />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomIconSelector" />
				<ComponentSlots :component="DomIconSelector" />
				<ComponentEvents :component="DomIconSelector" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
