<script setup>
import { computed, onMounted, ref, useId } from 'vue';
import { DomButton, DomDialog, DomGantt, DomNativeSelect, DomTextInput } from '../../../lib/vue';

defineProps({
	/** Groups the controls, timeline and footer inside a surrounding card's shared frame. */
	embedded: { type: Boolean, default: false },
});

const scenario = ref('resources');
const startDate = ref('2026-09-07');
const zoom = ref('weeks');
const planMode = ref(true);
const dialogOpen = ref(false);
const draft = ref(null);
const error = ref('');
const bookingError = ref('');
const notice = ref('Drag a booking to move it. Drag its dotted right edge to change its duration.');
const formId = useId();
let nextId = 1;
const examples = ref(seedExamples());
const active = computed(getActiveExample);
const rowOptions = computed(getRowOptions);
const scenarioOptions = [
	{ value: 'resources', label: 'Team resources' },
	{ value: 'project', label: 'Project Gantt' },
	{ value: 'roadmap', label: 'Roadmap' },
	{ value: 'rooms', label: 'Meeting rooms' },
	{ value: 'equipment', label: 'Equipment hire' },
];
const toneOptions = [{ value: 'primary', label: 'Default' }, { value: 'success', label: 'Green' }, { value: 'warning', label: 'Amber' }, { value: 'secondary', label: 'Neutral' }];
onMounted(useCurrentWeek);

/** Returns the selected application-owned collection. @returns {object} Example data. */
function getActiveExample() { return examples.value[scenario.value]; }

/** Lists resources available in the booking editor, including newly added rows. @returns {Array<object>} Select options. */
function getRowOptions() { return active.value.rows.map((row) => ({ value: row.id, label: row.name })); }

/** Builds an ISO local date/time at an offset from the shared anchor. @param {number} offset Calendar days. @param {number} hour Local hour. @param {number} minute Local minute. @returns {string} Local date/time. */
function at(offset, hour = 0, minute = 0) {
	const date = new Date(`${startDate.value}T00:00:00`);
	date.setDate(date.getDate() + offset);
	date.setHours(hour, minute, 0, 0);
	return localInput(date);
}

/** Formats dates for a native local date/time input without UTC shifts. @param {Date} date Instant. @returns {string} YYYY-MM-DDTHH:mm. */
function localInput(date) {
	/** Pads one date/time field to two characters. @param {number} number Field. @returns {string} Padded field. */
	const pad = (number) => String(number).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Seeds five views with realistic, entirely application-owned rows and items. @returns {object} Scenario collections. */
function seedExamples() {
	return {
		resources: {
			title: 'Studio resource planner',
			description: 'Drag bookings through time or onto another person. Use the dotted right edge to resize.',
			heading: 'Team member',
			allowRowChange: true,
			rows: [
				{ id: 'maya', name: 'Maya Chen', detail: 'Design director', initials: 'MC' },
				{ id: 'oliver', name: 'Oliver James', detail: 'Product designer', initials: 'OJ' },
				{ id: 'amara', name: 'Amara Okafor', detail: 'Developer', initials: 'AO' },
				{ id: 'leo', name: 'Leo Martin', detail: 'Developer', initials: 'LM' },
				{ id: 'ella', name: 'Ella Wilson', detail: 'Project manager', initials: 'EW' },
			],
			items: [
				{ id: 'r1', rowId: 'maya', title: 'Northstar · Brand direction', startDate: at(0), duration: 5, tone: 'primary' },
				{ id: 'r2', rowId: 'maya', title: 'Fieldwork · Discovery', startDate: at(7), duration: 4, tone: 'success' },
				{ id: 'r3', rowId: 'oliver', title: 'Northstar · Website design', startDate: at(2), endDate: at(12), tone: 'primary' },
				{ id: 'r4', rowId: 'oliver', title: 'Design reviews', startDate: at(7, 10), endDate: at(9, 16), tone: 'warning' },
				{ id: 'r5', rowId: 'amara', title: 'Fieldwork · Customer portal', startDate: at(0), duration: 9, tone: 'success' },
				{ id: 'r6', rowId: 'amara', title: 'Northstar · Build', startDate: at(10), duration: 12, tone: 'primary' },
				{ id: 'r7', rowId: 'leo', title: 'Acorn · Integration', startDate: at(1), duration: 7, tone: 'warning' },
				{ id: 'r8', rowId: 'leo', title: 'Fieldwork · QA', startDate: at(10), duration: 5, tone: 'success' },
				{ id: 'r9', rowId: 'ella', title: 'Northstar · Delivery', startDate: at(0), duration: 18, tone: 'secondary' },
			],
		},
		project: {
			title: 'Customer portal launch',
			description: 'Move or resize features along the timeline. Each feature stays on its own row.',
			heading: 'Project / feature',
			rows: [
				{ id: 'discovery', name: 'Discovery', detail: 'Scope & requirements' },
				{ id: 'design', name: 'Interface design', detail: 'Flows & prototypes' },
				{ id: 'auth', name: 'Account access', detail: 'Sign in & permissions' },
				{ id: 'dashboard', name: 'Client dashboard', detail: 'Overview & activity' },
				{ id: 'billing', name: 'Billing', detail: 'Plans & invoices' },
				{ id: 'testing', name: 'Quality assurance', detail: 'Testing & accessibility' },
				{ id: 'launch', name: 'Launch', detail: 'Release & handover' },
			],
			items: [
				{ id: 'p1', rowId: 'discovery', title: 'Discovery', startDate: at(0), duration: 4, tone: 'success' },
				{ id: 'p2', rowId: 'design', title: 'Interface design', startDate: at(3), duration: 8, tone: 'primary' },
				{ id: 'p3', rowId: 'auth', title: 'Account access', startDate: at(7), duration: 5, tone: 'primary' },
				{ id: 'p4', rowId: 'dashboard', title: 'Client dashboard', startDate: at(10), duration: 10, tone: 'primary' },
				{ id: 'p5', rowId: 'billing', title: 'Billing', startDate: at(14), duration: 7, tone: 'warning' },
				{ id: 'p6', rowId: 'testing', title: 'Quality assurance', startDate: at(21), duration: 5, tone: 'warning' },
				{ id: 'p7', rowId: 'launch', title: 'Release & handover', startDate: at(28), duration: 2, tone: 'success' },
			],
		},
		roadmap: {
			title: 'Product roadmap',
			description: 'Draw an estimate, then move or resize it as plans change. Features stay on their own rows.',
			heading: 'Feature / outcome',
			zoom: 'months',
			rows: [
				{ id: 'inbox', name: 'Research inbox', detail: 'Bring feedback together' },
				{ id: 'search', name: 'Workspace search', detail: 'Find anything quickly' },
				{ id: 'notifications', name: 'Notifications', detail: 'Useful, quieter updates' },
				{ id: 'reporting', name: 'Team reporting', detail: 'See where time goes' },
				{ id: 'unscheduled', name: 'Client approvals', detail: 'Draw to estimate' },
			],
			items: [
				{ id: 'm1', rowId: 'inbox', title: 'Research inbox', startDate: at(0), duration: 14, tone: 'success' },
				{ id: 'm2', rowId: 'search', title: 'Workspace search', startDate: at(10), duration: 21, tone: 'primary' },
				{ id: 'm3', rowId: 'notifications', title: 'Notifications', startDate: at(28), duration: 14, tone: 'warning' },
				{ id: 'm4', rowId: 'reporting', title: 'Team reporting', startDate: at(42), duration: 21, tone: 'primary' },
			],
		},
		rooms: {
			title: 'Meeting room booker',
			description: 'Book a room, move a meeting, or extend it by 15 minutes. Rooms cannot be double-booked.',
			heading: 'Meeting room',
			itemLabel: 'Meeting title',
			itemPlaceholder: 'Team planning or client workshop',
			addItemLabel: 'Book room',
			addRowLabel: 'Add room',
			zoom: 'days',
			days: 14,
			workingHours: [8, 18],
			hideNonWorkingHours: true,
			hideWeekends: true,
			selectionStep: 15,
			allowRowChange: true,
			preventOverlaps: true,
			rows: [
				{ id: 'atlas', name: 'Atlas', detail: '12 seats · Video & screen' },
				{ id: 'cedar', name: 'Cedar', detail: '6 seats · Whiteboard' },
				{ id: 'focus', name: 'Focus', detail: '2 seats · Private booth' },
				{ id: 'forum', name: 'Forum', detail: '20 seats · Projector' },
				{ id: 'studio', name: 'Studio', detail: '8 seats · Video & screen' },
			],
			items: [
				{ id: 'room-1', rowId: 'atlas', title: 'Product planning', startDate: at(0, 9, 30), endDate: at(0, 11), tone: 'primary' },
				{ id: 'room-2', rowId: 'atlas', title: 'Client workshop', startDate: at(0, 13), endDate: at(0, 16), tone: 'success' },
				{ id: 'room-3', rowId: 'cedar', title: 'Sprint kickoff', startDate: at(0, 9), endDate: at(0, 10, 15), tone: 'primary' },
				{ id: 'room-4', rowId: 'cedar', title: 'Interviews', startDate: at(0, 14), endDate: at(0, 15, 30), tone: 'warning' },
				{ id: 'room-5', rowId: 'focus', title: 'One-to-one', startDate: at(0, 9, 30), endDate: at(0, 10, 30), tone: 'secondary' },
				{ id: 'room-6', rowId: 'focus', title: 'Partner call', startDate: at(0, 11), endDate: at(0, 12), tone: 'success' },
				{ id: 'room-7', rowId: 'forum', title: 'All-hands', startDate: at(0, 10), endDate: at(0, 12), tone: 'primary' },
				{ id: 'room-8', rowId: 'studio', title: 'Design sprint', startDate: at(0, 9), endDate: at(0, 12), tone: 'success' },
				{ id: 'room-9', rowId: 'atlas', title: 'Roadmap review', startDate: at(1, 9), endDate: at(1, 11), tone: 'primary' },
				{ id: 'room-10', rowId: 'cedar', title: 'Research playback', startDate: at(1, 10), endDate: at(1, 12), tone: 'success' },
				{ id: 'room-11', rowId: 'forum', title: 'Customer roundtable', startDate: at(2, 13), endDate: at(2, 16), tone: 'warning' },
				{ id: 'room-12', rowId: 'studio', title: 'Prototype testing', startDate: at(3, 9, 30), endDate: at(3, 12), tone: 'success' },
			],
		},
		equipment: {
			title: 'Production equipment hire',
			description: 'Reserve camera kits across several days, including weekends. Move a hire to another kit or resize its return date.',
			heading: 'Camera kit',
			itemLabel: 'Hire booking',
			itemPlaceholder: 'Client and shoot name',
			addItemLabel: 'Reserve kit',
			addRowLabel: 'Add kit',
			days: 42,
			allowRowChange: true,
			preventOverlaps: true,
			rows: [
				{ id: 'kit-a', name: 'Camera kit A', detail: 'FX3 · Lens, audio & tripod' },
				{ id: 'kit-b', name: 'Camera kit B', detail: 'FX3 · Lens, audio & tripod' },
				{ id: 'kit-c', name: 'Camera kit C', detail: 'FX3 · Lens, audio & tripod' },
				{ id: 'kit-d', name: 'Camera kit D', detail: 'FX3 · Lens, audio & tripod' },
				{ id: 'kit-e', name: 'Camera kit E', detail: 'FX3 · Lens, audio & tripod' },
			],
			items: [
				{ id: 'hire-1', rowId: 'kit-a', title: 'Northstar · Brand film', startDate: at(0), endDate: at(4), tone: 'primary' },
				{ id: 'hire-2', rowId: 'kit-a', title: 'Fieldwork · Case study', startDate: at(7), endDate: at(10), tone: 'success' },
				{ id: 'hire-3', rowId: 'kit-b', title: 'Acorn · Product shoot', startDate: at(1), endDate: at(5), tone: 'success' },
				{ id: 'hire-4', rowId: 'kit-b', title: 'Weekend wedding', startDate: at(5), endDate: at(8), tone: 'primary' },
				{ id: 'hire-5', rowId: 'kit-c', title: 'Lens calibration', startDate: at(0), endDate: at(2), tone: 'warning' },
				{ id: 'hire-6', rowId: 'kit-c', title: 'Coast · Documentary', startDate: at(3), endDate: at(12), tone: 'primary' },
				{ id: 'hire-7', rowId: 'kit-d', title: 'Festival coverage', startDate: at(4), endDate: at(8), tone: 'success' },
				{ id: 'hire-8', rowId: 'kit-d', title: 'Studio interview', startDate: at(10), endDate: at(13), tone: 'primary' },
				{ id: 'hire-9', rowId: 'kit-e', title: 'School prospectus', startDate: at(1), endDate: at(3), tone: 'primary' },
				{ id: 'hire-10', rowId: 'kit-e', title: 'Sensor service', startDate: at(8), endDate: at(10), tone: 'warning' },
			],
		},
	};
}

/** Uses the live week after hydration so the current-time marker remains useful. @returns {void} */
function useCurrentWeek() {
	const date = new Date();
	date.setDate(date.getDate() - (date.getDay() + 6) % 7);
	startDate.value = localInput(date).slice(0, 10);
	examples.value = seedExamples();
}

/** Switches dataset while preserving changes made in the other demos. @param {string} value Scenario. @returns {void} */
function changeScenario(value) {
	scenario.value = value;
	zoom.value = active.value.zoom || 'weeks';
	bookingError.value = '';
	notice.value = active.value.description;
}

/** Adds an unscheduled row to local Vue state. @param {{name: string}} payload Row creation intent. @returns {void} */
function addRow({ name }) {
	const row = { id: `row-${nextId++}`, name, detail: 'Not scheduled yet' };
	active.value.rows.push(row);
	notice.value = `Added ${name}. Draw across its row or use + to enter dates.`;
}

/** Opens a named draft without adding a record until explicit submission. @param {object} range Component range payload. @returns {void} */
function planRange(range) {
	draft.value = { id: null, rowId: range.rowKey, title: active.value.allowRowChange ? '' : range.row.name, startDate: localInput(range.startDate), endDate: localInput(range.endDate), tone: 'primary' };
	bookingError.value = '';
	error.value = '';
	dialogOpen.value = true;
}

/** Opens the same editor for an existing item; duration records become explicit dates when saved. @param {object} payload Item click payload. @returns {void} */
function editItem({ item, startDate: start, endDate: end }) {
	bookingError.value = '';
	draft.value = { ...item, startDate: localInput(start), endDate: localInput(end) };
	error.value = '';
	dialogOpen.value = true;
}

/** Validates and commits a draft to local application state. A real app persists here. @returns {void} */
function saveItem() {
	const value = draft.value;
	if (!value?.title.trim()) { error.value = 'Give this item a name.'; return; }
	const start = new Date(value.startDate);
	const end = new Date(value.endDate);
	if (!Number.isFinite(+start) || !Number.isFinite(+end) || end <= start) { error.value = 'Choose an end date and time after the start.'; return; }
	const item = { id: value.id || `item-${nextId++}`, rowId: value.rowId, title: value.title.trim(), startDate: value.startDate, endDate: value.endDate, tone: value.tone };
	const conflict = bookingConflict(item);
	if (conflict) { error.value = conflict; return; }
	const index = active.value.items.findIndex((record) => record.id === item.id);
	if (index === -1) active.value.items.push(item);
	else active.value.items.splice(index, 1, item);
	notice.value = `${item.title} saved in this example.`;
	dialogOpen.value = false;
}

/**
 * Rejects overlapping reservations in the room and equipment demos, whose records use explicit ends.
 * Exclusive intervals allow one booking to begin exactly when another finishes.
 * These application-level rules leave the shared component free to stack team allocations.
 * @param {object} candidate Proposed booking, including its target resource and dates.
 * @returns {string} A useful conflict message, or an empty string when available.
 */
function bookingConflict(candidate) {
	if (!active.value.preventOverlaps) return '';
	const start = +new Date(candidate.startDate);
	const end = +new Date(candidate.endDate);
	const conflict = active.value.items.find((item) => item.id !== candidate.id && item.rowId === candidate.rowId && +new Date(item.startDate) < end && +new Date(item.endDate) > start);
	if (!conflict) return '';
	const resource = active.value.rows.find((row) => row.id === candidate.rowId);
	return `${resource?.name || 'This resource'} is already booked for ${conflict.title}. Choose another time or resource.`;
}

/**
 * Accepts a component move/resize intent into application-owned example state.
 * Date-based Gantt rows keep their feature identity; resource bookings may change owner.
 * A production application can persist this same patch before or after an optimistic update.
 * @param {object} change Proposed item dates and source/target row keys.
 * @returns {void}
 */
function applyItemChange(change) {
	const index = active.value.items.findIndex((item) => item.id === change.item.id);
	if (index === -1 || (!active.value.allowRowChange && change.targetRowKey !== change.sourceRowKey)) return;
	const item = { ...active.value.items[index], rowId: change.targetRowKey, startDate: localInput(change.startDate), endDate: localInput(change.endDate) };
	bookingError.value = bookingConflict(item);
	if (bookingError.value) return;
	delete item.duration;
	active.value.items.splice(index, 1, item);
	notice.value = `${item.title} updated for ${change.targetRow.name}.`;
}

/** Removes only the selected local demo item, retaining its row. @returns {void} */
function removeItem() {
	active.value.items = active.value.items.filter((item) => item.id !== draft.value.id);
	notice.value = `${draft.value.title} removed from this example.`;
	dialogOpen.value = false;
}
</script>

<template>
	<div class="w-full min-w-0" :class="!embedded && 'space-y-4'" data-gantt-demo>
		<div class="space-y-4" :class="embedded && 'p-4'">
			<div class="flex flex-wrap gap-1 rounded-lg bg-secondary/50 p-1" role="group" aria-label="Planner example">
				<DomButton v-for="option in scenarioOptions" :key="option.value" size="sm" :variant="scenario === option.value ? 'secondary' : 'ghost'" :aria-pressed="scenario === option.value" @click="changeScenario(option.value)">{{ option.label }}</DomButton>
			</div>
			<div class="flex flex-wrap items-start justify-between gap-2">
				<div><h3 class="text-lg font-semibold tracking-tight">{{ active.title }}</h3><p class="mt-1 text-sm leading-6 text-muted-fg">{{ active.description }}</p></div>
				<span class="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium text-muted-fg">Interactive example</span>
			</div>
		</div>
		<DomGantt
			:key="scenario"
			:class="embedded && 'rounded-none! border-x-0!'"
			v-model:zoom="zoom"
			v-model:plan-mode="planMode"
			:rows="active.rows"
			:items="active.items"
			:start-date="startDate"
			:days="active.days || 84"
			:row-heading="active.heading"
			:add-row-label="active.addRowLabel || 'Add row'"
			:working-hours="active.workingHours || [6, 18]"
			:hide-non-working-hours="active.hideNonWorkingHours || false"
			:hide-weekends="active.hideWeekends || false"
			:selection-step="active.selectionStep || 30"
			:viewport-height="440"
			:draggable-items="planMode"
			:resizable-items="planMode"
			:allow-row-change="active.allowRowChange || false"
			@row-create="addRow"
			@time-range-select="planRange"
			@item-click="editItem"
			@item-move="applyItemChange"
			@item-resize="applyItemChange"
		>
			<template #row="{ row }">
				<div class="flex min-w-0 items-center gap-2.5">
					<span v-if="row.initials" class="hidden size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-muted-fg sm:flex">{{ row.initials }}</span>
					<div class="min-w-0"><p class="truncate font-semibold" :title="row.name">{{ row.name }}</p><p class="mt-1 truncate text-[10px] text-muted-fg" :title="row.detail">{{ row.detail }}</p></div>
				</div>
			</template>
		</DomGantt>
		<p v-if="bookingError" class="text-xs leading-5 text-destructive" :class="embedded && 'px-4 pt-3'" role="alert">{{ bookingError }}</p>
		<p class="text-xs leading-5 text-muted-fg" :class="embedded && 'px-4 py-3'" role="status">{{ notice }} Changes stay in this example until the page reloads.</p>
		<DomDialog v-model="dialogOpen" :title="active.preventOverlaps ? (draft?.id ? 'Edit booking' : 'New booking') : (draft?.id ? 'Edit planned work' : 'Plan work')" description="Choose a name and time span. The end is the moment this booking or task finishes." size="sm">
			<form v-if="draft" :id="formId" class="space-y-4" @submit.prevent="saveItem">
				<DomTextInput v-model="draft.title" :label="active.itemLabel || 'Item name'" :placeholder="active.itemPlaceholder || 'Project or feature name'" required autofocus />
				<DomNativeSelect v-if="active.allowRowChange" v-model="draft.rowId" :label="active.heading" :options="rowOptions" :placeholder="''" />
				<DomTextInput v-model="draft.startDate" label="Start" type="datetime-local" required />
				<DomTextInput v-model="draft.endDate" label="End" type="datetime-local" required />
				<DomNativeSelect v-model="draft.tone" label="Colour" :options="toneOptions" />
				<p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
			</form>
			<template #footer>
				<DomButton v-if="draft?.id" variant="ghost" class="mr-auto text-destructive" @click="removeItem">Delete</DomButton>
				<DomButton variant="secondary" @click="dialogOpen = false">Cancel</DomButton>
				<DomButton type="submit" :form="formId">{{ draft?.id ? 'Save changes' : (active.addItemLabel || 'Add item') }}</DomButton>
			</template>
		</DomDialog>
	</div>
</template>
