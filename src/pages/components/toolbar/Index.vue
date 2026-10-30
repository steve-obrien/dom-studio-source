<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import { DomToolbar } from '../../lib/vue';

import EditorToolbar from './examples/EditorToolbar.vue';
import EditorToolbarSrc from './examples/EditorToolbar.vue?raw';
import FormattingToolbar from './examples/FormattingToolbar.vue';
import FormattingToolbarSrc from './examples/FormattingToolbar.vue?raw';
import InsetComposerToolbar from './examples/InsetComposerToolbar.vue';
import InsetComposerToolbarSrc from './examples/InsetComposerToolbar.vue?raw';

const doc = DomToolbar.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomToolbar"
					:initial="{ label: 'Toolbar', orientation: 'horizontal', align: 'start', wrap: true }"
					title="Toolbar playground"
					description="Use DomToolbar to group icon buttons, dropdowns, toggles, filters, and overflow menus."
				>
					<button class="rounded-xl px-3 py-2 text-sm font-medium text-canvas-fg transition hover:bg-secondary">One</button>
					<button class="rounded-xl px-3 py-2 text-sm font-medium text-canvas-fg transition hover:bg-secondary">Two</button>
				</Playground>
			</DocSection>

			<DocSection eyebrow="Demo" title="Editor toolbar">
				<Example
					:source="EditorToolbarSrc"
					filename="EditorToolbar.vue"
					description="Pair DomToolbar with DomIconButton, DomTooltip, and DomDropdown for compact app chrome."
				>
					<EditorToolbar />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Inset composer toolbar">
				<Example
					:source="InsetComposerToolbarSrc"
					filename="InsetComposerToolbar.vue"
					description="Place a compact formatting toolbar inside the lower edge of a composer or textarea shell."
				>
					<InsetComposerToolbar />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Formatting toolbar">
				<Example
					:source="FormattingToolbarSrc"
					filename="FormattingToolbar.vue"
					description="Show classic WYSIWYG formatting controls with active button states."
				>
					<FormattingToolbar />
				</Example>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomToolbar" />
			</DocSection>

			<ComponentSlots :component="DomToolbar" />
		</DocPage>
	</DomStudioLayout>
</template>
