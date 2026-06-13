<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import { DomPopover, DomToggle } from '../../lib/vue';

import Quick from './examples/Quick.vue';
import QuickSrc from './examples/Quick.vue?raw';
import HoverCard from './examples/HoverCard.vue';
import HoverCardSrc from './examples/HoverCard.vue?raw';
import Settings from './examples/Settings.vue';
import SettingsSrc from './examples/Settings.vue?raw';
import Actions from './examples/Actions.vue';
import ActionsSrc from './examples/Actions.vue?raw';
import LargeMenu from './examples/LargeMenu.vue';
import LargeMenuSrc from './examples/LargeMenu.vue?raw';
import ExternalTriggerConfirm from './examples/ExternalTriggerConfirm.vue';
import ExternalTriggerConfirmSrc from './examples/ExternalTriggerConfirm.vue?raw';

const doc = DomPopover.__doc;
const slotApiExample = `<DomPopover :trigger-id="triggerId(row)" v-slot="{ close }">
\t<DomButton @click="close">Cancel</DomButton>
</DomPopover>`;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomPopover"
					:initial="{ label: 'Quick facts' }"
					title="Popover playground"
					description="Edit props in the inspector — the live panel and source/data tabs stay in sync."
				>
					<div class="flex flex-col gap-2">
						<p class="text-sm text-muted-fg2">Popover body content.</p>
						<DomToggle
							label="Lock Scroll"
							v-model="lockScroll"
						/>
						<DomToggle
							label="Flip"
							v-model="flip"
						/>
					</div>
				</Playground>
			</DocSection>

			<DocSection eyebrow="Demo" title="Quick info">
				<Example
					:source="QuickSrc"
					filename="Quick.vue"
					description="The simplest case — a button that opens a panel with text content."
				>
					<Quick />
				</Example>	
			</DocSection>

			<DocSection eyebrow="Demo" title="Open on hover">
				<Example
					:source="HoverCardSrc"
					filename="HoverCard.vue"
					description="Set trigger=&quot;hover&quot; for richer tooltip-like panels that open on pointer enter or focus."
				>
					<HoverCard />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Settings panel">
				<Example
					:source="SettingsSrc"
					filename="Settings.vue"
					description="Popover bodies can host any controls — including the form inputs from the library."
				>
					<Settings />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Actions menu">
				<Example
					:source="ActionsSrc"
					filename="Actions.vue"
					description="Use DomMenu inside a popover when the content is an action list. The menu adds roving focus, arrow keys, and selection events."
				>
					<Actions />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Scrollable menu with scroll lock">
				<Example
					:source="LargeMenuSrc"
					filename="LargeMenu.vue"
					description="Lock browser scrolling while a long menu is open, and put the scrolling on the popover content rather than the page."
				>
					<LargeMenu />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="External trigger confirmation">
				<Example
					:source="ExternalTriggerConfirmSrc"
					filename="ExternalTriggerConfirm.vue"
					description="Attach a popover to a button outside the component with triggerId. The default slot receives open, close, and toggle helpers, so row actions can close themselves without storing refs."
				>
					<ExternalTriggerConfirm />
				</Example>
			</DocSection>

			<DocSection eyebrow="API" title="Closing from content">
				<div class="rounded-2xl border border-border bg-canvas p-5 text-sm text-muted-fg">
					<p>
						The default slot is scoped with <code class="text-canvas-fg">open</code>, <code class="text-canvas-fg">close</code>, and <code class="text-canvas-fg">toggle</code>.
						This is useful for confirmation popovers, menus, and external triggers because the content can control its own popover.
					</p>
					<div class="mt-4">
						<CodeBlock :code="slotApiExample" lang="vue" :default-open="true" />
					</div>
				</div>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomPopover" />
			</DocSection>

			<ComponentSlots :component="DomPopover" />
			<ComponentKeyboard :component="DomPopover" />
		</DocPage>
	</DomStudioLayout>
</template>
