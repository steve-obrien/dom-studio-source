<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import DomSwipeActions from './DomSwipeActions.vue';
import source from './DomSwipeActions.vue?raw';
import TaskActions from './examples/TaskActions.vue';
import exampleSource from './examples/TaskActions.vue?raw';
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Swipe actions" tag="<DomSwipeActions>" :tagline="DomSwipeActions.__doc.description">
			<DocSection title="A shortcut on either side"><Example :source="exampleSource" title="Task actions" filename="TaskActions.vue" presentation="iframe" :frame-height="420"><TaskActions /></Example></DocSection>
			<DocSection title="Gesture contract">
				<div class="max-w-2xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>Put a row, button, or link in the default slot. <code>startActions</code> and <code>endActions</code> accept records with <code>value</code>, <code>label</code>, optional SVG-path <code>icon</code>, <code>variant</code> (default, success, danger), and <code>disabled</code>. Leading and trailing follow the row’s text direction.</p>
					<p>Horizontal intent captures the gesture; vertical scrolling and pinch zoom remain native. Each gesture stays on its initial side: dragging back stops at the closed position, and a new swipe can reveal the opposite actions. Releasing a partial swipe reveals buttons or closes the row. Cancellation never executes an action. Only one row in a <code>group</code> stays open at a time.</p>
					<p>Full-swipe execution requires <code>full-swipe</code> on the component and <code>fullSwipe: true</code> on that side’s first action. A deliberate outward flick can complete the action when its travel plus projected release momentum crosses the full-swipe threshold. Tiny flicks only reveal controls; pausing removes momentum and reversing reduces it. The <code>action</code> event includes the record, side, and source (<code>button</code> or <code>swipe</code>). The app owns persistence, pending state, and undo; set <code>disabled</code> while a mutation is pending.</p>
					<p>The visible Actions button exposes both sides to touch, mouse, and keyboard users. Escape closes them and restores focus. Inputs and elements marked <code>data-no-swipe</code> do not start a row gesture.</p>
					<p><a href="/mobile/inbox" class="font-medium text-canvas-fg underline underline-offset-4">See the mobile inbox</a> for archive/restore, read state, deletion with Undo, and expandable message details.</p>
				</div>
			</DocSection>
			<DocSection title="Reference"><ComponentProps :component="DomSwipeActions" :source="source" /><ComponentSlots :component="DomSwipeActions" /><ComponentEvents :component="DomSwipeActions" /><ComponentKeyboard :component="DomSwipeActions" /></DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
