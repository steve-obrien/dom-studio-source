<script setup>
import { useRoute } from 'vue-router';
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import MobileInbox from '../examples/MobileInbox.vue';
import source from '../examples/MobileInbox.vue?raw';

const route = useRoute();
</script>

<template>
	<MobileInbox v-if="route.query.preview === '1'" />
	<DomStudioLayout v-else>
		<DocPage name="Mobile inbox" eyebrow="Mobile" tag="<DomSwipeActions>" tagline="Swipe to archive, pull a message into view, and reply in a sheet that follows the available viewport.">
			<DocSection title="An inbox you can try">
				<p class="mb-5 max-w-2xl text-sm leading-7 text-muted-fg">Swipe right to mark a message read or unread. Swipe left to reveal Archive and Delete; continue the swipe to archive. Every action is also available from the row’s Actions button. Archive and Delete can be undone. Messages and replies stay in this local example.</p>
				<a href="/mobile/inbox?preview=1" class="mb-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg">Open full-screen inbox</a>
				<Example :source="source" title="Studio Mail" filename="MobileInbox.vue" presentation="mobile" device-title="Studio Mail" :frame-height="780" :preview-lines="14"><MobileInbox /></Example>
			</DocSection>
			<DocSection title="Three components, one flow">
				<div class="max-w-2xl space-y-4 text-sm leading-7 text-muted-fg">
					<p><a href="/mobile/swipe-actions" class="font-medium text-canvas-fg underline underline-offset-4">DomSwipeActions</a> handles direction, cancellation, action reveal, and optional full-swipe shortcuts. The application handles mutations and undo.</p>
					<p><a href="/mobile/bottom-sheet" class="font-medium text-canvas-fg underline underline-offset-4">DomBottomSheet</a> has three reading heights. Drag its handle, click it to cycle, or use the arrow keys while the handle is focused. The body scrolls independently and the reply composer stays at the bottom.</p>
					<p><code>DomAppShell</code> responds to keyboard-sized visual viewport changes while editing. Set <code>hide-bottom-on-keyboard</code> for navigation, or leave it off when the bottom slot holds a composer. Native hosts can pass <code>keyboard-inset</code> or use <code>keyboard-behavior="none"</code> when they already own the layout.</p>
					<p>Use the full-screen inbox on a real phone to check keyboard behaviour. An embedded iframe does not expose the top-level visual viewport. Hardware keyboard, floating keyboard, browser gestures, and native resize modes should be checked in your target webview.</p>
				</div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
