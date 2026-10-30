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
import { DomMonthCalendar } from '../../lib/vue';
import DomMonthCalendarSrc from './DomMonthCalendar.vue?raw';
import ContainerResponsiveCalendar from './examples/ContainerResponsiveCalendar.vue';
import ContainerResponsiveCalendarSrc from './examples/ContainerResponsiveCalendar.vue?raw';
import ContinuousOperationsCalendar from './examples/ContinuousOperationsCalendar.vue';
import ContinuousOperationsCalendarSrc from './examples/ContinuousOperationsCalendar.vue?raw';
import ContentPlanner from './examples/ContentPlanner.vue';
import ContentPlannerSrc from './examples/ContentPlanner.vue?raw';
import CustomisableDaysExample from './examples/customisable-days/CustomisableDaysExample.vue';
import ServerLoadedNavigation from './examples/ServerLoadedNavigation.vue';
import ServerLoadedNavigationSrc from './examples/ServerLoadedNavigation.vue?raw';
import StickyDayHeaders from './examples/StickyDayHeaders.vue';
import StickyDayHeadersSrc from './examples/StickyDayHeaders.vue?raw';

import FlushCalendar from './examples/FlushCalendar.vue';
import FlushCalendarSrc from './examples/FlushCalendar.vue?raw';

const doc = DomMonthCalendar.__doc;

const calendarApiCode = `GET /api/calendar-records?start=2026-06-01&end=2026-06-30&timezone=Europe/London&resource=field-ops

// Response
{
\trange: {
\t\tstart: '2026-06-01',
\t\tend: '2026-06-30',
\t\ttimezone: 'Europe/London',
\t\tresource: 'field-ops',
\t},
\tdata: [
\t\t{
\t\t\tid: 'evt_1042',
\t\t\tdate: '2026-06-11',
\t\t\ttitle: 'Install window',
\t\t\tstartTime: '09:00',
\t\t\tendTime: '11:00',
\t\t\tstatus: 'confirmed',
\t\t\ttone: 'primary',
\t\t\tresourceId: 'field-ops',
\t\t\tmeta: {
\t\t\t\tcustomerId: 'cus_8821',
\t\t\t\tlocation: 'Dock 4',
\t\t\t},
\t\t},
\t],
\tbyDate: {
\t\t'2026-06-11': ['evt_1042'],
\t},
\tmeta: {
\t\trequestedAt: '2026-06-18T09:30:00.000Z',
\t\tetag: 'calendar-records:field-ops:2026-06',
\t\ttotal: 1,
\t},
}`;

const calendarMutationCode = `POST /api/calendar-records

// Create or update an item
{
\tid: 'evt_1042',
\tdate: '2026-06-12',
\ttitle: 'Install window',
\tstartTime: '10:00',
\tendTime: '12:00',
\tstatus: 'confirmed',
\tresourceId: 'field-ops',
\tclientMutationId: 'calendar-edit-8f83',
}

// Response
{
\tdata: {
\t\tid: 'evt_1042',
\t\tdate: '2026-06-12',
\t\ttitle: 'Install window',
\t\tstartTime: '10:00',
\t\tendTime: '12:00',
\t\tstatus: 'confirmed',
\t\tresourceId: 'field-ops',
\t\tupdatedAt: '2026-06-18T09:31:00.000Z',
\t},
\tmeta: {
\t\tclientMutationId: 'calendar-edit-8f83',
\t\tinvalidatedRange: {
\t\t\tstart: '2026-06-01',
\t\t\tend: '2026-06-30',
\t\t},
\t},
}`;

const calendarRouteCode = `// server/api/calendar-records.get.js
export async function get(req, res) {
\tconst range = normalizeCalendarRange(req.query);
\tif (!range) {
\t\tres.status(400);
\t\treturn { error: 'Use YYYY-MM-DD start and end query parameters.' };
\t}

\tconst records = await listCalendarRecords({
\t\tstart: range.start,
\t\tend: range.end,
\t\ttimezone: range.timezone,
\t\tresource: req.query.resource || '',
\t});

\treturn {
\t\trange,
\t\tdata: records,
\t\tbyDate: groupRecordIdsByDate(records),
\t\tmeta: {
\t\t\trequestedAt: new Date().toISOString(),
\t\t\ttotal: records.length,
\t\t},
\t};
}`;

const apiParameters = [
	{ name: 'start', required: 'Required', description: 'Inclusive visible-range start as YYYY-MM-DD. Send the first rendered cell, not only the first day of the month, when adjacent days matter.' },
	{ name: 'end', required: 'Required', description: 'Inclusive visible-range end as YYYY-MM-DD. The server can clamp maximum span, commonly 93 days for a three-month calendar.' },
	{ name: 'timezone', required: 'Recommended', description: 'IANA timezone used to interpret all-day records and local times. Keep dates as date strings to avoid UTC midnight drift.' },
	{ name: 'resource', required: 'Optional', description: 'Calendar owner, room, team, user, project, or schedule key. Use repeated params or comma-separated values for multi-resource views.' },
	{ name: 'cursor', required: 'Optional', description: 'Only needed when a day can contain more records than the first response should render.' },
];
</script>

<template>
	<DomStudioLayout>
		<DocPage :name="doc.name" :tagline="doc.description" :tag="doc.tag">
			<DocSection eyebrow="Playground" title="Try every prop live">
				<Playground
					:inspect="DomMonthCalendar"
					:initial="{
						months: 2,
						showWeekNumbers: true,
						mutedDayClass: 'bg-secondary text-muted-fg',
						adjacentDayClass: 'bg-secondary/40 text-muted-fg/70',
					}"
					title="Month calendar playground"
					description="Edit the range, display, and day styling props to preview a stacked month grid."
				/>
			</DocSection>

			<DocSection eyebrow="Embedded layout" title="Flush inside a parent frame">
				<p class="mb-5 max-w-3xl text-sm leading-7 text-muted-fg">
					Use <code>layout="flush"</code> to share a parent frame’s left and right borders. Match its content padding with <code>gutter-class="px-4 sm:px-6"</code>, and set <code>:bottom-border="false"</code> when the frame also supplies the bottom edge. Place the calendar outside the parent’s padded content wrapper so its grid reaches the frame edges. The top border and internal day dividers remain.
				</p>
				<p class="mb-5 max-w-3xl text-sm leading-7 text-muted-fg">
					On wide calendars the gutter applies to the first and last grid columns; when week numbers or the continuous month rail are visible, the rail occupies the first column. In the compact day list every day uses both gutters. Event wrappers align with that padding; any padding inside your slotted event remains application-owned.
				</p>
				<Example :source="FlushCalendarSrc" filename="FlushCalendar.vue" description="A calendar sharing its frame’s borders and responsive content padding.">
					<FlushCalendar />
				</Example>
			</DocSection>

			<DocSection eyebrow="Display options" title="Sticky weekday headers and today’s date">
				<div class="mb-5 max-w-3xl space-y-3 text-sm leading-7 text-muted-fg">
					<p>
						Enable <code class="text-canvas-fg">stickyDayHeaders</code> to pin the weekday row while scrolling. Combine it with <code class="text-canvas-fg">stickyMonthHeaders</code> to keep the month title above it. Continuous calendars keep their existing sticky weekday default; pass <code class="text-canvas-fg">:sticky-day-headers="false"</code> to turn it off.
					</p>
					<p>
						Set <code class="text-canvas-fg">:show-day-names="false"</code> to hide weekday names inside cells while keeping the date number and accessible date label. This also hides names in the mobile day list, where the weekday header row is not displayed.
					</p>
					<p>
						Use <code class="text-canvas-fg">today-indicator="both"</code> to show the cell outline and circular date highlight together. Choose <code class="text-canvas-fg">circle</code> for just the date circle, <code class="text-canvas-fg">cell</code> for the default cell outline, or <code class="text-canvas-fg">none</code> to remove the visual highlight. Date numbers keep the same spacing in every mode and align with week numbers in the desktop grid. The circle uses the theme’s primary colour; <code class="text-canvas-fg">todayDateClass</code> can replace its background and text colours in either <code class="text-canvas-fg">circle</code> or <code class="text-canvas-fg">both</code> mode.
					</p>
				</div>
				<Example
					:source="StickyDayHeadersSrc"
					filename="StickyDayHeaders.vue"
					description="Try sticky headers, inline weekday names, and an Apple Calendar-style date circle in separated and continuous layouts."
				>
					<StickyDayHeaders />
				</Example>
			</DocSection>

			<DocSection eyebrow="Responsive layout" title="Respond to the calendar container">
				<div class="mb-5 max-w-3xl space-y-3 text-sm leading-7 text-muted-fg">
					<p>
						<code class="text-canvas-fg">DomMonthCalendar</code> is an inline-size container with a sensible responsive default. Below Tailwind's <code class="text-canvas-fg">lg</code> threshold it renders a one-column day list; at <code class="text-canvas-fg">lg</code> and above it renders the seven-column month grid. Opening a parent sidebar can therefore switch the same instance automatically without viewport listeners or parent configuration.
					</p>
					<p>
						An app-level <code class="text-canvas-fg">@theme { --breakpoint-lg: 68rem; }</code> override changes both Tailwind's <code class="text-canvas-fg">lg:</code> utilities and the calendar's container threshold. The calendar still measures its own available width, not the viewport.
					</p>
					<p>
						Import <code class="text-canvas-fg">@getdom/studio/style.css</code> from the same Tailwind stylesheet, before the app's <code class="text-canvas-fg">@theme</code> block, so Tailwind compiles the package query and the override together.
					</p>
				</div>
				<Example
					:source="ContainerResponsiveCalendarSrc"
					filename="ContainerResponsiveCalendar.vue"
					description="Open the example sidebar to reduce the content area's width. The calendar uses its lg container query to switch between seven columns and one column."
				>
					<ContainerResponsiveCalendar />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Continuous calendar">
				<Example
					:source="ContinuousOperationsCalendarSrc"
					filename="ContinuousOperationsCalendar.vue"
					description="Render one uninterrupted date stream across several months, with draggable milestones, compact month labels in the left rail, and sticky weekday headers while the range scrolls."
				>
					<ContinuousOperationsCalendar />
				</Example>
			</DocSection>

			<CustomisableDaysExample />

			<DocSection eyebrow="Demo" title="Server-loaded navigation">
				<Example
					:source="ServerLoadedNavigationSrc"
					filename="ServerLoadedNavigation.vue"
					description="Navigate month by month while a simulated server request reloads records, then drag one record to a new day without changing existing records on that day."
				>
					<ServerLoadedNavigation />
				</Example>
			</DocSection>

			<DocSection eyebrow="Demo" title="Content planner">
				<Example
					:source="ContentPlannerSrc"
					filename="ContentPlanner.vue"
					description="Render article planning cards through the default day slot, then use day-drop payloads to move or swap planned content between days."
				>
					<ContentPlanner />
				</Example>
			</DocSection>

			<DocSection eyebrow="Architecture" title="Server calendar API">
				<div class="max-w-3xl space-y-4 text-sm leading-7 text-muted-fg">
					<p>
						The month calendar is transport-free: it renders date cells and exposes slots. The application owns fetching, loading, empty, and mutation states, then looks up records for each
						<code class="text-canvas-fg">cell.value</code>. For backend work, make the endpoint range-based so one contract supports single-month, multi-month, fixed-week, and adjacent-day displays.
					</p>
					<p>
						Set <code class="text-canvas-fg">continuous</code> when the calendar should read as one uninterrupted date stream. That mode removes repeated previous/next-month filler days between months and exposes month labels through the week rail, so the server should fetch the exact visible date range rather than assuming each visual row belongs to one month block.
					</p>
					<p>
						Use date-only strings for all-day placement, and include local times only when the record needs them. That keeps API authors out of timezone edge cases while still allowing the UI to render appointments, availability, content plans, rota assignments, or booking inventory.
					</p>
					<p>
						For drag and drop, keep the mutation policy in the app layer. The day slot exposes <code class="text-canvas-fg">dragAttrs(data)</code> for draggable records, and <code class="text-canvas-fg">day-drop</code> emits the source day, target day, transfer data, and native event so a planner can swap records while a server-backed schedule can update only the dragged record.
					</p>
				</div>

				<div class="mt-5 overflow-hidden rounded-lg border border-border">
					<div class="grid bg-secondary/40 text-xs font-semibold uppercase tracking-wide text-muted-fg md:grid-cols-[9rem_7rem_1fr]">
						<div class="px-3 py-2">Param</div>
						<div class="px-3 py-2">Use</div>
						<div class="px-3 py-2">Notes</div>
					</div>
					<div
						v-for="param in apiParameters"
						:key="param.name"
						class="grid border-t border-border text-sm leading-6 md:grid-cols-[9rem_7rem_1fr]"
					>
						<div class="px-3 py-3 font-mono text-xs text-canvas-fg">{{ param.name }}</div>
						<div class="px-3 py-3 text-muted-fg">{{ param.required }}</div>
						<div class="px-3 py-3 text-muted-fg">{{ param.description }}</div>
					</div>
				</div>

				<div class="mt-5 grid gap-4 xl:grid-cols-2">
					<div class="min-w-0">
						<p class="mb-2 text-sm font-semibold text-canvas-fg">Read endpoint</p>
						<CodeBlock :code="calendarApiCode" lang="js" />
					</div>
					<div class="min-w-0">
						<p class="mb-2 text-sm font-semibold text-canvas-fg">Mutation endpoint</p>
						<CodeBlock :code="calendarMutationCode" lang="js" />
					</div>
				</div>

				<div class="mt-5 min-w-0">
					<p class="mb-2 text-sm font-semibold text-canvas-fg">Now route sketch</p>
					<CodeBlock :code="calendarRouteCode" lang="js" />
				</div>
			</DocSection>

			<DocSection title="Reference">
				<ComponentProps :component="DomMonthCalendar" :source="DomMonthCalendarSrc" />
				<ComponentEvents :component="DomMonthCalendar" :source="DomMonthCalendarSrc" />
				<ComponentSlots :component="DomMonthCalendar" :source="DomMonthCalendarSrc" />
				<ComponentKeyboard :component="DomMonthCalendar" />
			</DocSection>
		</DocPage>
	</DomStudioLayout>
</template>
