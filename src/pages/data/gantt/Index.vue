<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import { DomGantt } from '../../lib/vue';
import PlanningWorkspace from './examples/PlanningWorkspace.vue';
import PlanningWorkspaceSource from './examples/PlanningWorkspace.vue?raw';

const usage = `const people = [{ id: 'maya', name: 'Maya Chen' }];
const bookings = [
\t{ id: 'booking-1', ownerId: 'maya', title: 'Website design', startDate: '2026-09-14', duration: 5 },
\t{ id: 'booking-2', ownerId: 'maya', title: 'Review', startDate: '2026-09-21T10:00', endDate: '2026-09-21T12:00' },
];

<DomGantt
\t:rows="people"
\t:items="bookings"
\titem-row-key="ownerId"
\tstart-date="2026-09-07"
\t:days="84"
\t:working-hours="[6, 18]"
\tplan-mode
\tdraggable-items
\tresizable-items
\tallow-row-change
\t@row-create="addPerson"
\t@time-range-select="openBookingForm"
\t@item-click="editBooking"
\t@item-move="saveBookingChange"
\t@item-resize="saveBookingChange"
/>`;
</script>

<template>
	<DomStudioLayout>
		<DocPage name="Gantt" tagline="People, projects, and roadmaps. One timeline, from hours to months." tag="<DomGantt>">
			<DocSection eyebrow="Interactive examples" title="Plan work across time">
				<Example :source="PlanningWorkspaceSource" filename="PlanningWorkspace.vue" :preview-lines="0" description="Try team resources, a project Gantt, a roadmap, meeting rooms, or equipment hire. Draw a booking, drag it through time, and resize its dotted right edge. Resources can change rows; named features stay on theirs.">
					<PlanningWorkspace />
				</Example>
			</DocSection>
			<DocSection eyebrow="Data contract" title="Your records, another view">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p><code>rows</code> supplies the people or features down the left. <code>items</code> supplies scheduled work; <code>itemRowKey</code> connects each item to a row. For a roadmap, create one row per feature and give its item the same row id. A resource planner can have many bookings per person. Overlaps stack automatically.</p>
					<p>Every item needs a start plus an exclusive end or positive duration. <code>durationUnit</code> defaults to whole calendar days; use hours or minutes for precise work. Explicit ends take precedence. Date-only strings are local midnight. Dates and ISO timestamps display in the browser’s local time. Invalid or reversed spans are omitted; rows without dates remain available for planning.</p>
					<p>Field mappings accept logical field names or resolver functions, sharing the <RouterLink class="text-primary hover:underline" to="/data/data-grid">data grid</RouterLink> and <RouterLink class="text-primary hover:underline" to="/data/activity-timeline">activity timeline</RouterLink> conventions. The component does not fetch or mutate records. Handle <code>row-create</code>, <code>time-range-select</code>, and <code>item-click</code> in your application, using your own forms, store, and persistence.</p>
				</div>
				<CodeBlock :code="usage" lang="vue" />
			</DocSection>
			<DocSection eyebrow="Time & interaction" title="Zoom without losing your place">
				<div class="space-y-4 text-sm leading-7 text-muted-fg">
					<p><strong class="text-canvas-fg">Weeks</strong> shows daily cells; <strong class="text-canvas-fg">Months</strong> compresses days for a broader overview; <strong class="text-canvas-fg">Days</strong> shows individual hours. Scroll horizontally or use the previous/next controls. Zoom and visibility changes preserve the date at the left edge. The Today action and exposed <code>scrollToDate(date)</code> method navigate inside the supplied <code>startDate</code> / <code>days</code> window.</p>
					<p><code>:working-hours="[6, 18]"</code> describes 06:00–18:00. Other hours and configured <code>weekendDays</code> are muted but valid. Hide them independently, then expand them from the toolbar. Hidden time compresses the axis; it does not shorten stored durations. A Friday-to-Monday selection still spans the weekend in real time. A current-time marker is shown only when that instant is within a displayed cell.</p>
					<p>Plan mode supports pointer dragging in either direction, with edge scrolling. Week and month zoom snap to dates; hourly views snap to <code>selectionStep</code> minutes. Touch keeps native scrolling; each row’s + button requests a form with a suggested span. Arrow keys, Shift + arrows, and Enter provide keyboard range selection. Escape cancels.</p>
					<p>Enable <code>draggableItems</code> for horizontal movement and <code>resizableItems</code> for the dotted right-edge grip. Enable <code>allowRowChange</code> only when rows represent resources, such as people; leave it off when each row is a named feature. These options are independent of creation mode. The examples bind movement and resizing to their Plan mode toggle.</p>
					<p><code>item-move</code> and <code>item-resize</code> emit the original item, source and target rows, previous dates, and proposed dates. Apply the change in your own store. Pointer previews do not mutate records; Escape or a drop outside the rows cancels. A move preserves local wall-clock endpoints in week/month zoom and elapsed duration in hourly zoom. A resize keeps the start fixed, with a minimum of one visible selection step. Hidden time remains part of the interval.</p>
					<p>The meeting-room example starts at hourly zoom with 15-minute snapping and 08:00–18:00 working days. Equipment hire shows reservations across days and weekends, with service periods occupying the same resources. Both examples reject overlapping bookings when creating, moving, resizing, or editing. These checks live in the example application; a production booking service should enforce its availability rules when saving.</p>
					<p>On a focused item, Alt + left/right moves through time; Alt + up/down changes resource rows when enabled. On the resize grip, left/right adjusts the end. Touch users can resize with the explicit grip or tap the item to edit dates in the example form. Grips appear at the true end only, so scrolling into the middle of a long item does not expose a misleading resize handle.</p>
					<p>Like <RouterLink class="text-primary hover:underline" to="/data/week-planner">DomWeekPlanner</RouterLink>, a selected range is intent: no item is created until your application accepts it. The example uses <code>DomDialog</code> to name, edit, or cancel work. This component covers scheduling; dependency rules, automatic resource allocation, and critical-path calculations belong to the application.</p>
				</div>
			</DocSection>
			<DocSection eyebrow="Reference" title="Props, events, and slots">
				<div class="space-y-8"><ComponentProps :component="DomGantt" /><ComponentEvents :component="DomGantt" /><ComponentSlots :component="DomGantt" /><ComponentKeyboard :component="DomGantt" /></div>
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
