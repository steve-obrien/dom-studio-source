<script setup>
import DomStudioLayout from '../../_layout/DomStudioLayout.vue';
import CodeBlock from '../../_layout/CodeBlock.vue';
import DocPage from '../../_layout/DocPage.vue';
import DocSection from '../../_layout/DocSection.vue';
import Example from '../../_layout/docs/Example.vue';
import Playground from '../../_layout/docs/Playground.vue';
import ComponentProps from '../../_layout/docs/ComponentProps.vue';
import ComponentEvents from '../../_layout/docs/ComponentEvents.vue';
import ComponentSlots from '../../_layout/docs/ComponentSlots.vue';
import ComponentKeyboard from '../../_layout/docs/ComponentKeyboard.vue';
import { DomWeekPlanner } from '../../lib/vue';
import DomWeekPlannerSrc from './DomWeekPlanner.vue?raw';
import DragToCreatePlanner from './examples/DragToCreatePlanner.vue';
import DragToCreatePlannerSrc from './examples/DragToCreatePlanner.vue?raw';
import TeamWeekPlanner from './examples/TeamWeekPlanner.vue';
import TeamWeekPlannerSrc from './examples/TeamWeekPlanner.vue?raw';

const doc = DomWeekPlanner.__doc;

const sharedDataCode = `const records = [
\t{
\t\tid: 'evt_1042',
\t\tdate: '2026-06-08',
\t\ttitle: 'Install window',
\t\tstartTime: '09:00',
\t\tendTime: '11:00',
\t\tstatus: 'confirmed',
\t\ttone: 'primary',
\t\tresourceId: 'field-ops',
\t\tmeta: {
\t\t\tcustomerId: 'cus_8821',
\t\t\tlocation: 'Dock 4',
\t\t},
\t},
];

/**
 * Lists calendar records for a local date key.
 *
 * @param {string} date YYYY-MM-DD date key.
 * @returns {Array<Record<string, unknown>>} Matching calendar records.
 */
function recordsFor(date) {
\treturn records.filter((record) => record.date === date);
}`;

const viewSwitchCode = `<DomMonthCalendar
\t:start-date="rangeStart"
\t:months="2"
>
\t<template #default="{ cell }">
\t\t<MonthCard
\t\t\tv-for="record in recordsFor(cell.value)"
\t\t\t:key="record.id"
\t\t\t:record="record"
\t\t/>
\t</template>
</DomMonthCalendar>

<DomWeekPlanner
\t:start-date="rangeStart"
\t:weeks="3"
\tstart-time="07:00"
\tend-time="20:00"
>
\t<template #default="{ cell, rangeStyle }">
\t\t<TimedCard
\t\t\tv-for="record in recordsFor(cell.value)"
\t\t\t:key="record.id"
\t\t\t:record="record"
\t\t\t:style="rangeStyle(record)"
\t\t/>
\t</template>
</DomWeekPlanner>`;

const dropCode = `<DomWeekPlanner
\t:start-date="rangeStart"
\tdrag-and-drop
\t@day-drop="moveRecord"
>
\t<template #default="{ cell, dragAttrs, rangeStyle }">
\t\t<AppointmentCard
\t\t\tv-for="record in recordsFor(cell.value)"
\t\t\t:key="record.id"
\t\t\tv-bind="dragAttrs(record, { sourceTime: record.startTime })"
\t\t\t:record="record"
\t\t\t:style="rangeStyle(record)"
\t\t/>
\t</template>
</DomWeekPlanner>

/**
 * Persists one app-owned record after a planner drop.
 *
 * @param {object} payload Planner day-drop payload.
 * @returns {void}
 */
function moveRecord({ data, targetValue, targetTime }) {
\t// Persist the record in the application layer.
\tupdateCalendarRecord(data.id, {
\t\tdate: targetValue,
\t\tstartTime: targetTime,
\t});
}`;
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Configure the time grid">
				<Playground
					:inspect="DomWeekPlanner"
					:initial="{
						startDate: '2026-06-08',
						weeks: 3,
						startTime: '07:00',
						endTime: '19:00',
						timeStep: 60,
						selectionStep: 5,
						slotHeight: 56,
						dayWidth: 192,
						viewportHeight: 640,
						showWeekNumbers: true,
						showAllDayRow: true,
						showCurrentTime: true,
					}"
					title="Week planner playground"
					description="Change the scrollport height, time range, row size, fixed day width, and number of horizontally scrolling weeks."
				/>
			</DocSection>

			<DocSection eyebrow="Demo" title="Team week planner">
				<Example
					:source="TeamWeekPlannerSrc"
					filename="TeamWeekPlanner.vue"
					description="Open on three fixed-width weeks, switch to a virtualized full year, and use Today to return to the live current-time line. Timed records use the month-calendar record shape and can be moved to a precise day and time."
					:preview-lines="0"
				>
					<TeamWeekPlanner />
				</Example>
			</DocSection>

			<DocSection eyebrow="Creation" title="Drag to create an event">
				<Example
					:source="DragToCreatePlannerSrc"
					filename="DragToCreatePlanner.vue"
					description="Drag vertically across an empty day lane with five-minute precision, enter an event name in the dialog, then add it to local Vue state without coupling the planner to a server."
					:preview-lines="0"
				>
					<DragToCreatePlanner />
				</Example>
			</DocSection>

			<DocSection eyebrow="Architecture" title="One calendar data contract, two views">
				<div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]">
					<div class="space-y-4 text-sm leading-7 text-muted-fg">
						<p>
							<code class="text-canvas-fg">DomWeekPlanner</code> is a different visual representation of the
							<RouterLink class="font-semibold text-primary hover:underline" to="/data/month-calendar">month calendar</RouterLink>
							contract. Both components are transport-free, identify a day with <code class="text-canvas-fg">cell.value</code>, and let the application own fetching, grouping, optimistic state, and persistence.
						</p>
						<p>
							The same record can appear as compact day content in a month grid or as a precisely positioned appointment in the week planner. Keep <code class="text-canvas-fg">date</code> as a local date string, then add <code class="text-canvas-fg">startTime</code> and <code class="text-canvas-fg">endTime</code> when a record needs timed placement.
						</p>
						<p>
							<code class="text-canvas-fg">rangeStyle(record)</code> translates those local times into vertical position and height. It clips records to the visible time range without changing their data, so the API remains suitable for month, week, multi-week, all-day, and server-loaded views.
						</p>
						<p>
							Enable <code class="text-canvas-fg">rangeSelection</code> to let mouse and pen users drag across a time lane. The resulting <code class="text-canvas-fg">time-range-select</code> payload contains the local date plus snapped start and end times; <code class="text-canvas-fg">selectionStep</code> controls pointer precision independently of the visible <code class="text-canvas-fg">timeStep</code> rows. The application decides whether to store the range locally, open an editor, or persist it to an endpoint.
						</p>
						<p>
							Every day column keeps the configured <code class="text-canvas-fg">dayWidth</code>. Increasing <code class="text-canvas-fg">weeks</code> adds more columns to the same horizontal scrollport instead of compressing the visible lanes.
						</p>
						<p>
							The explicit <code class="text-canvas-fg">viewportHeight</code> keeps vertical time navigation inside the planner, even when a documentation frame or application shell would otherwise grow to the full grid height. The sticky day and all-day rows remain visible while both axes scroll.
						</p>
						<p>
							For full-year or longer ranges, enable <code class="text-canvas-fg">virtualWeeks</code>. The planner uses the same fixed-item render-window calculation as the data grid, mounts only intersecting weeks plus <code class="text-canvas-fg">virtualWeekBuffer</code>, and emits <code class="text-canvas-fg">render-window-change</code> with the mounted date range for lazy API loading.
						</p>
					</div>

					<div class="rounded-xl border border-border bg-secondary/25 p-4">
						<p class="text-sm font-semibold text-canvas-fg">Shared read endpoint</p>
						<p class="mt-2 text-sm leading-6 text-muted-fg">
							Request the exact inclusive visible range from the same endpoint used by the month view:
						</p>
						<code class="mt-3 block overflow-x-auto rounded-md bg-canvas px-3 py-2 text-xs text-canvas-fg">
							GET /api/calendar-records?start=2026-06-08&amp;end=2026-06-28&amp;timezone=Europe/London
						</code>
					</div>
				</div>

				<div class="mt-5 grid gap-4 xl:grid-cols-2">
					<div class="min-w-0">
						<p class="mb-2 text-sm font-semibold text-canvas-fg">Shared record shape</p>
						<CodeBlock :code="sharedDataCode" lang="js" />
					</div>
					<div class="min-w-0">
						<p class="mb-2 text-sm font-semibold text-canvas-fg">Switch visual representations</p>
						<CodeBlock :code="viewSwitchCode" lang="vue" />
					</div>
				</div>
			</DocSection>

			<DocSection eyebrow="Interaction" title="Precise app-owned rescheduling">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The default slot exposes the same <code class="text-canvas-fg">dragAttrs(data)</code> pattern as the month calendar. Both components use the same native transfer type, so an application can carry a record between visual representations without translating its identity.
					</p>
					<p>
						<code class="text-canvas-fg">day-drop</code> keeps the existing source and target date fields, then adds <code class="text-canvas-fg">sourceTime</code>, <code class="text-canvas-fg">targetTime</code>, and minute values. Timed drops snap to <code class="text-canvas-fg">timeStep</code>; drops in the all-day row return an empty target time.
					</p>
				</div>

				<div class="mt-5 min-w-0">
					<CodeBlock :code="dropCode" lang="vue" />
				</div>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomWeekPlanner" :source="DomWeekPlannerSrc" />
				<ComponentEvents :component="DomWeekPlanner" :source="DomWeekPlannerSrc" />
				<ComponentSlots :component="DomWeekPlanner" :source="DomWeekPlannerSrc" />
				<ComponentKeyboard :component="DomWeekPlanner" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
