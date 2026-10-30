<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import { DomNotificationInbox } from '../../lib/vue';
import FrameworkInbox from './examples/FrameworkInbox.vue';
import FrameworkInboxSrc from './examples/FrameworkInbox.vue?raw';

const doc = DomNotificationInbox.__doc;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Demo" title="Durable inbox with live toasts">
				<Example
					:source="FrameworkInboxSrc"
					filename="FrameworkInbox.vue"
					description="The inbox consumes db3.ai-style durable items and emits explicit read, unread, archive, refresh, pagination, and action intents. Simulate a live arrival to see the same record appear as a transient toast without replaying inbox history."
				>
					<FrameworkInbox />
				</Example>
			</DocSection>

			<DocSection eyebrow="Contract" title="Presentation stays separate from persistence">
				<div class="grid gap-4 text-sm leading-6 text-muted-fg md:grid-cols-3">
					<div class="border-t border-border pt-4"><h3 class="font-semibold text-canvas-fg">Framework-owned records</h3><p class="mt-1">Pass the safe recipient-facing item returned by <code>app().inApp.inbox()</code>. Title and body render as plain text.</p></div>
					<div class="border-t border-border pt-4"><h3 class="font-semibold text-canvas-fg">Application-owned transport</h3><p class="mt-1">HTTP, authorization, WebSocket invalidation, pagination cursors, retries, and optimistic policy remain outside the component.</p></div>
					<div class="border-t border-border pt-4"><h3 class="font-semibold text-canvas-fg">Independent recipient state</h3><p class="mt-1">Read, banner dismissal, and archive stay separate. The inbox only emits transitions the current framework API supports.</p></div>
				</div>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomNotificationInbox" />
				<ComponentSlots :component="DomNotificationInbox" />
				<ComponentEvents :component="DomNotificationInbox" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
