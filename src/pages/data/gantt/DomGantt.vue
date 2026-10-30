<script>
/** Public field mappings and display options for the shared scheduling surface. */
export const ganttProps = {
	rows: { type: Array, default: () => [], _edit: { description: 'Application-owned people, projects, or feature rows.' } },
	items: { type: Array, default: () => [], _edit: { description: 'Application-owned scheduled items. Multiple items may share a row.' } },
	rowKey: { type: [String, Function], default: 'id' },
	rowLabelKey: { type: [String, Function], default: 'name' },
	itemKey: { type: [String, Function], default: 'id' },
	itemRowKey: { type: [String, Function], default: 'rowId' },
	titleKey: { type: [String, Function], default: 'title' },
	startKey: { type: [String, Function], default: 'startDate' },
	endKey: { type: [String, Function], default: 'endDate' },
	durationKey: { type: [String, Function], default: 'duration' },
	toneKey: { type: [String, Function], default: 'tone' },
	durationUnit: { type: String, default: 'days', _edit: { options: ['days', 'hours', 'minutes'], description: 'Whole local calendar days, or elapsed hours/minutes. An explicit end wins.' } },
	startDate: { type: [String, Date, Number], default: '', _edit: { description: 'First local date of the scrollable range. Supply a stable value for SSR.' } },
	days: { type: Number, default: 84, _edit: { description: 'Scrollable range in calendar days, from 1 to 3660. Change this or startDate to load another window.' } },
	zoom: { type: String, default: 'weeks', _edit: { options: ['months', 'weeks', 'days'], description: 'Initial or v-model zoom. Days displays individual hours.' } },
	planMode: { type: Boolean, default: false, _edit: { description: 'Enable named row creation and pointer/keyboard time selection.' } },
	draggableItems: { type: Boolean, default: false, _edit: { description: 'Allow items to move through time. Emits item-move; the application saves the change.' } },
	allowRowChange: { type: Boolean, default: false, _edit: { description: 'Allow moving items between rows when draggableItems is enabled. Enable for resource bookings; leave off for feature-based Gantt rows.' } },
	resizableItems: { type: Boolean, default: false, _edit: { description: 'Show a right-edge grip for shortening or extending an item. Emits item-resize.' } },
	workingHours: { type: Array, default: () => [6, 18], _edit: { description: 'Local start and exclusive end hour, e.g. [6, 18]. Outside hours are muted in day zoom.' } },
	weekendDays: { type: Array, default: () => [0, 6], _edit: { description: 'Non-working weekdays: Sunday = 0, Saturday = 6. Muted, still selectable.' } },
	hideNonWorkingHours: { type: Boolean, default: false, _edit: { description: 'Compress out-of-hours time in day zoom. The toolbar can expand it again.' } },
	hideWeekends: { type: Boolean, default: false, _edit: { description: 'Compress configured non-working weekdays at every zoom.' } },
	selectionStep: { type: Number, default: 30, _edit: { description: 'Hourly-view selection snap in minutes (1–60). Other views snap to visible calendar days.' } },
	rowHeight: { type: Number, default: 64, _edit: { description: 'Minimum row height in pixels. Overlapping items expand the row.' } },
	viewportHeight: { type: Number, default: 460 },
	rowHeading: { type: String, default: 'People / work' },
	addRowLabel: { type: String, default: 'Add row' },
	showToolbar: { type: Boolean, default: true },
	showCurrentTime: { type: Boolean, default: true },
	loading: { type: Boolean, default: false },
	ariaLabel: { type: String, default: 'Planning timeline' },
};
</script>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import DomButton from '../../components/button/DomButton.vue';
import DomTextInput from '../../forms/text-input/DomTextInput.vue';
import { calculateVirtualWindow } from '../_shared/calculateVirtualWindow.js';
import { createGanttAxis, ganttDateToX, ganttXToDate, ganttSnapWidth, layoutGanttRows, moveGanttSpan, parseGanttDate, resizeGanttSpan } from './ganttTime.js';

defineOptions({
	__doc: {
		name: 'Gantt',
		tag: '<DomGantt>',
		description: 'One horizontal timeline for team resources, project schedules, and roadmaps, with time zoom, working hours, and drag-to-plan ranges.',
		icon: 'M4 4v16h16M7 7h6M10 11h8M8 15h7',
		events: [
			{ name: 'time-range-select', payload: 'GanttRangePayload', description: 'A requested span with source row, rowKey, Date start/end, elapsed durationMinutes, and original event. End is exclusive; the application creates the item.' },
			{ name: 'row-create', payload: '{ name: string }', description: 'Validated row name. The application assigns an id and adds its row.' },
			{ name: 'item-click', payload: 'GanttItemPayload', description: 'Source item and row, resolved dates, and original event for an application-owned editor.' },
			{ name: 'item-move', payload: 'GanttItemChangePayload', description: 'Proposed dates and source/target rows after a drag or keyboard move. Source records remain unchanged until the application accepts the event.' },
			{ name: 'item-resize', payload: 'GanttItemChangePayload', description: 'Proposed exclusive end after right-edge resizing. The start and row are preserved.' },
			{ name: 'update:zoom', payload: "'months' | 'weeks' | 'days'", description: 'Toolbar zoom changed, preserving the date at the left of the viewport.' },
			{ name: 'update:planMode', payload: 'boolean', description: 'Plan mode changed.' },
			{ name: 'update:hideNonWorkingHours', payload: 'boolean', description: 'Out-of-hours visibility changed.' },
			{ name: 'update:hideWeekends', payload: 'boolean', description: 'Non-working day visibility changed.' },
			{ name: 'visible-range-change', payload: '{ startDate: Date, endDate: Date }', description: 'Visible date window after scrolling or zooming, for application-owned data loading.' },
		],
		slots: [
			{ name: 'row', payload: '{ row, rowKey, label }', description: 'Replace a row label, for example with a member avatar and role.' },
			{ name: 'item', payload: '{ item, row, startDate, endDate }', description: 'Replace bar content inside its focusable item button. Avoid nested interactive controls.' },
			{ name: 'toolbar', description: 'Append application filters or actions.' },
			{ name: 'empty', description: 'Replace the empty collection message.' },
		],
		keyboard: [
			{ keys: '← / →', action: 'Move the focused row’s time cursor one selection step.' },
			{ keys: 'Shift + ← / →', action: 'Extend a time selection.' },
			{ keys: 'Enter', action: 'Request the selected time span.' },
			{ keys: 'Escape', action: 'Cancel a pointer or keyboard selection.' },
			{ keys: 'Alt + ← / →', action: 'Move a focused draggable item one time increment.' },
			{ keys: 'Alt + ↑ / ↓', action: 'Move a focused item to the previous/next resource row when row changes are enabled.' },
			{ keys: '← / → on resize grip', action: 'Shorten or extend an item by one time increment.' },
		],
	},
});

const props = defineProps(ganttProps);
const emit = defineEmits(['time-range-select', 'row-create', 'item-click', 'item-move', 'item-resize', 'update:zoom', 'update:planMode', 'update:hideNonWorkingHours', 'update:hideWeekends', 'visible-range-change']);
const viewport = ref(null);
const localZoom = ref(props.zoom);
const planning = ref(props.planMode);
const hideHours = ref(props.hideNonWorkingHours);
const hideDays = ref(props.hideWeekends);
const rowName = ref('');
const scrollLeft = ref(0);
const viewportWidth = ref(900);
const labelWidth = ref(200);
const now = ref(null);
const selection = ref(null);
const keyboardSelection = ref(null);
const itemInteraction = ref(null);
const helpId = useId();
let resizeObserver;
let clockTimer;
let scrollFrame;
let pointerX = 0;
let pointerY = 0;
let activePointerId = null;
let suppressedClick = null;

const axis = computed(buildAxis);
const lanes = computed(buildLanes);
const renderWindow = computed(getRenderWindow);
const visibleCells = computed(getVisibleCells);
const headerGroups = computed(getHeaderGroups);
const currentX = computed(getCurrentX);
const rangeLabel = computed(getRangeLabel);
const preview = computed(getPreview);
const itemPreview = computed(getItemPreview);

watch(() => props.zoom, syncZoom);
watch(() => props.planMode, syncPlanning);
watch(() => props.hideNonWorkingHours, syncHours);
watch(() => props.hideWeekends, syncDays);
watch(axis, preserveDate, { flush: 'pre' });
watch(() => [props.draggableItems, props.resizableItems, props.allowRowChange, props.loading], cancelSelection);
onMounted(mountTimeline);
onBeforeUnmount(unmountTimeline);
defineExpose({ scrollToDate, scrollToToday });

/** Builds the horizontal axis from current display settings. @returns {object} Axis. */
function buildAxis() {
	return createGanttAxis({ startDate: props.startDate, days: props.days, workingHours: props.workingHours, weekendDays: props.weekendDays, zoom: localZoom.value, hideNonWorkingHours: hideHours.value, hideWeekends: hideDays.value });
}

/** Resolves source records using shared data-component field semantics. @returns {Array<object>} Lanes. */
function buildLanes() {
	return layoutGanttRows(props.rows || [], props.items || [], props, axis.value);
}

/** Calculates the horizontally mounted cell window using the shared virtualizer. @returns {object} Window. */
function getRenderWindow() {
	return calculateVirtualWindow({ itemCount: axis.value.cells.length, itemSize: axis.value.cellWidth, scrollOffset: scrollLeft.value, viewportSize: viewportWidth.value - labelWidth.value, overscan: 3 });
}

/** Lists the cell decorations needed around the viewport. @returns {Array<object>} Visible cells. */
function getVisibleCells() {
	return axis.value.cells.slice(renderWindow.value.startIndex, renderWindow.value.endIndex).map((cell) => ({
		...cell,
		boundary: cellBoundary(cell),
	}));
}

/**
 * Classifies a boundary against the preceding visible cell, including hidden periods.
 * Weeks begin on Monday; month boundaries take precedence when both change.
 * @param {object} cell Axis cell at the right of the boundary.
 * @returns {'hour'|'day'|'week'|'month'} Strongest calendar boundary.
 */
function cellBoundary(cell) {
	const previous = axis.value.cells[Math.round(cell.left / axis.value.cellWidth) - 1];
	if (!previous) return 'day';
	const date = new Date(cell.start);
	const before = new Date(previous.start);
	if (date.getFullYear() !== before.getFullYear() || date.getMonth() !== before.getMonth()) return 'month';
	if (date.toDateString() === before.toDateString()) return 'hour';
	date.setHours(0, 0, 0, 0);
	before.setHours(0, 0, 0, 0);
	date.setDate(date.getDate() - (date.getDay() + 6) % 7);
	before.setDate(before.getDate() - (before.getDay() + 6) % 7);
	return +date !== +before ? 'week' : 'day';
}

/**
 * Scales boundary emphasis with zoom while keeping header and row lines aligned.
 * Day zoom retains its hourly hierarchy; wider views use faint daily divisions.
 * Month zoom uses a subtle step above its weekly boundaries.
 * @param {object} cell Visible cell with a resolved calendar boundary.
 * @returns {string} Tailwind utilities for its leading vertical border.
 */
function boundaryClass(cell) {
	const dayView = {
		hour: 'border-l border-l-border/60',
		day: 'border-l border-l-canvas-fg/20',
		week: 'border-l border-l-canvas-fg/35',
		month: 'border-l-2 border-l-canvas-fg/50',
	};
	if (localZoom.value === 'days') return dayView[cell.boundary];
	return {
		hour: dayView.hour,
		day: dayView.hour,
		week: dayView.day,
		month: localZoom.value === 'months' ? 'border-l border-l-canvas-fg/25' : dayView.week,
	}[cell.boundary];
}

/** Groups visible header cells by month or local day at hourly zoom. @returns {Array<object>} Labels and geometry. */
function getHeaderGroups() {
	const groups = [];
	for (const cell of visibleCells.value) {
		const date = new Date(cell.start);
		const key = localZoom.value === 'days' ? date.toDateString() : `${date.getFullYear()}-${date.getMonth()}`;
		let group = groups[groups.length - 1];
		if (!group || group.key !== key) {
			group = { key, left: cell.left, width: 0, label: date.toLocaleDateString('en-GB', localZoom.value === 'days' ? { weekday: 'short', day: 'numeric', month: 'short' } : { month: 'long', year: 'numeric' }) };
			groups.push(group);
		}
		group.width += cell.width;
	}
	return groups;
}

/** Locates live time only within a visible time cell, avoiding false markers in omitted hours. @returns {number|null} Position. */
function getCurrentX() {
	if (!props.showCurrentTime || now.value === null) return null;
	const position = ganttDateToX(axis.value, now.value);
	const cell = axis.value.cells[Math.floor(position / axis.value.cellWidth)];
	return cell && now.value >= cell.start && now.value < cell.end ? position : null;
}

/** Formats the current viewport's first and last calendar dates. @returns {string} Toolbar range. */
function getRangeLabel() {
	const start = ganttXToDate(axis.value, scrollLeft.value);
	const end = ganttXToDate(axis.value, scrollLeft.value + Math.max(0, viewportWidth.value - labelWidth.value), 'end');
	if (start === null || end === null) return 'No visible dates';
	return `${dateLabel(start)} – ${dateLabel(Math.max(start, end - 1))}`;
}

/** Formats a compact local date. @param {number} time Timestamp. @returns {string} Date label. */
function dateLabel(time) {
	return new Date(time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Labels hour cells or day boundaries without crowding month zoom. @param {object} cell Axis cell. @returns {string} Label. */
function cellLabel(cell) {
	const date = new Date(cell.start);
	if (localZoom.value === 'days') return String(date.getHours()).padStart(2, '0');
	if (localZoom.value === 'months') return date.getDay() === 1 || date.getDate() === 1 ? String(date.getDate()) : '';
	return `${date.toLocaleDateString('en-GB', { weekday: 'narrow' })} ${date.getDate()}`;
}

/** Produces theme-aware item styling. @param {object} record Item presentation. @returns {string} Utility classes. */
function itemTone(record) {
	return { success: 'border-success/30 bg-success/15 text-canvas-fg', warning: 'border-warning/30 bg-warning/15 text-canvas-fg', destructive: 'border-destructive/30 bg-destructive/15 text-canvas-fg', secondary: 'border-border bg-secondary text-canvas-fg' }[record.tone] || 'border-primary/30 bg-primary/15 text-canvas-fg';
}

/** Lists bars intersecting the visible viewport, with an overscan margin. @param {object} lane Row geometry. @returns {Array<object>} Bars. */
function visibleItems(lane) {
	return lane.records.filter((record) => record.left + record.width >= scrollLeft.value - 100 && record.left <= scrollLeft.value + viewportWidth.value + 100);
}

/**
 * Clips long bars to the visible time window so their names remain readable while scrolling.
 * The original interval remains available in the item payload and accessible label.
 * @param {object} record Item geometry.
 * @returns {object} Visible fragment's inline position and size.
 */
function itemStyle(record) {
	const left = Math.max(record.left, scrollLeft.value);
	const right = Math.min(record.left + record.width, scrollLeft.value + viewportWidth.value - labelWidth.value);
	const width = right > left ? Math.max(2, right - left - 2) : 0;
	return { left: `${left + 1}px`, width: `${width}px`, top: `${record.top}px`, paddingInline: width < 24 ? '0' : undefined, display: width > 0 ? undefined : 'none' };
}

/** Formats the full accessible item interval. @param {object} record Scheduled item. @returns {string} Button label. */
function itemLabel(record) {
	return `${record.title || 'Untitled item'}: ${new Date(record.start).toLocaleString('en-GB')} to ${new Date(record.end).toLocaleString('en-GB')}`;
}

/** Emits the original record for application-owned editing. @param {object} lane Row. @param {object} record Item. @param {Event} event Input event. @returns {void} */
function selectItem(lane, record, event) {
	if (suppressedClick?.key === record.key && Date.now() < suppressedClick.until) return;
	emit('item-click', { item: record.item, row: lane.row, rowKey: lane.key, startDate: new Date(record.start), endDate: new Date(record.end), event });
}

/**
 * Shows the resize grip only when the actual end is inside the visible window.
 * A clipped bar edge must not masquerade as the item's editable end.
 * @param {object} record Scheduled item geometry.
 * @returns {boolean} Whether the end grip can be shown.
 */
function showResizeHandle(record) {
	const right = record.left + record.width;
	return props.resizableItems && record.end <= +axis.value.end && right > scrollLeft.value + 10 && right <= scrollLeft.value + viewportWidth.value - labelWidth.value;
}

/**
 * Begins a potential item gesture, retaining click-to-edit until movement exceeds four pixels.
 * Touch scrolling remains native on bar bodies; the explicit end grip supports touch resizing.
 * @param {'move'|'resize'} kind Gesture type.
 * @param {object} lane Original row.
 * @param {object} record Original item geometry.
 * @param {PointerEvent} event Pointer-down event.
 * @returns {void}
 */
function startItemInteraction(kind, lane, record, event) {
	if (props.loading || event.button !== 0 || !axis.value.width) return;
	if (kind === 'move' && (!props.draggableItems || event.pointerType === 'touch')) return;
	if (kind === 'resize' && !props.resizableItems) return;
	event.preventDefault();
	cancelSelection();
	activePointerId = event.pointerId;
	pointerX = event.clientX;
	pointerY = event.clientY;
	itemInteraction.value = { kind, lane, record, targetLane: lane, active: false, valid: true, initialX: pointerX, initialY: pointerY, anchorX: pointerPosition(pointerX), proposal: { start: record.start, end: record.end } };
	event.currentTarget.focus({ preventScroll: true });
	window.addEventListener('pointermove', moveItemInteraction, { passive: false });
	window.addEventListener('pointerup', finishItemInteraction);
	window.addEventListener('pointercancel', cancelSelection);
	window.addEventListener('blur', cancelSelection);
	window.addEventListener('keydown', cancelOnEscape);
	scrollFrame = requestAnimationFrame(autoScroll);
}

/**
 * Finds a real row beneath the pointer, excluding sticky headers and off-chart drops.
 * @returns {object|null} Target row presentation, or null outside the time area.
 */
function pointerLane() {
	const rect = viewport.value.getBoundingClientRect();
	if (pointerX < rect.left + labelWidth.value || pointerX > rect.right || pointerY < rect.top + 64 || pointerY > rect.bottom) return null;
	const element = document.elementFromPoint(pointerX, pointerY)?.closest('[data-gantt-row-index]');
	return element && viewport.value.contains(element) ? lanes.value[Number(element.dataset.ganttRowIndex)] || null : null;
}

/**
 * Recalculates the snapped proposal and legal target after pointer or viewport movement.
 * @returns {void}
 */
function updateItemProposal() {
	const state = itemInteraction.value;
	if (!state) return;
	const deltaX = pointerPosition(pointerX) - state.anchorX;
	const over = pointerLane();
	const targetLane = state.kind === 'move' && props.allowRowChange ? over : state.lane;
	const proposal = state.kind === 'resize'
		? resizeGanttSpan(axis.value, state.record, deltaX, localZoom.value, props.selectionStep)
		: moveGanttSpan(axis.value, state.record, state.anchorX, deltaX, localZoom.value, props.selectionStep);
	itemInteraction.value = { ...state, targetLane, valid: Boolean(over && targetLane), proposal };
}

/**
 * Activates and updates an item gesture without changing the app-owned record.
 * @param {PointerEvent} event Pointer-move event.
 * @returns {void}
 */
function moveItemInteraction(event) {
	const state = itemInteraction.value;
	if (!state || event.pointerId !== activePointerId) return;
	event.preventDefault();
	pointerX = event.clientX;
	pointerY = event.clientY;
	const distance = Math.max(Math.abs(pointerX - state.initialX), state.kind === 'move' && props.allowRowChange ? Math.abs(pointerY - state.initialY) : 0);
	if (!state.active && distance < 4) return;
	itemInteraction.value = { ...state, active: true };
	updateItemProposal();
}

/**
 * Builds a foreground preview on the proposed row while preserving existing bookings.
 * @returns {object|null} Transient item geometry with its target lane.
 */
function getItemPreview() {
	const state = itemInteraction.value;
	if (!state?.active || !state.valid) return null;
	const left = ganttDateToX(axis.value, state.proposal.start);
	const right = ganttDateToX(axis.value, state.proposal.end);
	return { ...state.record, ...state.proposal, left, width: right - left, top: state.targetLane.key === state.lane.key ? state.record.top : 12, lane: state.targetLane };
}

/**
 * Publishes a changed interval only while the original item and both rows still exist.
 * Concurrent source changes cancel a stale gesture instead of overwriting newer dates.
 * @param {object} state Completed gesture or keyboard proposal.
 * @param {Event} event Originating input event.
 * @returns {void}
 */
function commitItemChange(state, event) {
	if (!state.valid || props.loading) return;
	if (state.kind === 'move' && !props.draggableItems) return;
	if (state.kind === 'resize' && !props.resizableItems) return;
	const source = lanes.value.find((lane) => lane.key === state.lane.key);
	const current = source?.records.find((record) => record.key === state.record.key);
	const target = lanes.value.find((lane) => lane.key === state.targetLane?.key);
	if (!current || !target || current.start !== state.record.start || current.end !== state.record.end) return;
	if (!props.allowRowChange && target.key !== source.key) return;
	const { start, end } = state.proposal;
	if (end <= start || (start === current.start && end === current.end && target.key === source.key)) return;
	emit(state.kind === 'move' ? 'item-move' : 'item-resize', {
		item: current.item,
		sourceRow: source.row,
		targetRow: target.row,
		sourceRowKey: source.key,
		targetRowKey: target.key,
		previousStartDate: new Date(current.start),
		previousEndDate: new Date(current.end),
		startDate: new Date(start),
		endDate: new Date(end),
		durationMinutes: (end - start) / 60000,
		event,
	});
}

/**
 * Commits a valid drop and suppresses the synthetic click following a completed drag.
 * @param {PointerEvent} event Pointer-up event.
 * @returns {void}
 */
function finishItemInteraction(event) {
	if (!itemInteraction.value || event.pointerId !== activePointerId) return;
	moveItemInteraction(event);
	const state = itemInteraction.value;
	if (state.active) commitItemChange(state, event);
	cancelSelection();
}

/**
 * Moves focused items with Alt+arrows, preserving ordinary Enter/click editing.
 * @param {object} lane Source row.
 * @param {object} record Scheduled item.
 * @param {KeyboardEvent} event Key event.
 * @returns {void}
 */
function onItemKey(lane, record, event) {
	if (!props.draggableItems || props.loading || !event.altKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
	event.preventDefault();
	event.stopPropagation();
	cancelSelection();
	let targetLane = lane;
	let proposal = { start: record.start, end: record.end };
	if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
		if (!props.allowRowChange) return;
		const index = lanes.value.findIndex((candidate) => candidate.key === lane.key);
		targetLane = lanes.value[index + (event.key === 'ArrowDown' ? 1 : -1)];
	} else {
		proposal = moveGanttSpan(axis.value, record, record.left, (event.key === 'ArrowRight' ? 1 : -1) * snapWidth(), localZoom.value, props.selectionStep);
	}
	if (targetLane) {
		commitItemChange({ kind: 'move', lane, record, targetLane, proposal, valid: true }, event);
		focusChangedItem(record.key, targetLane.key, 'move');
	}
}

/**
 * Resizes the focused end grip with arrow keys using the same snapping as the pointer.
 * @param {object} lane Source row.
 * @param {object} record Scheduled item.
 * @param {KeyboardEvent} event Key event.
 * @returns {void}
 */
function onResizeKey(lane, record, event) {
	if (!props.resizableItems || props.loading || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
	event.preventDefault();
	event.stopPropagation();
	cancelSelection();
	const proposal = resizeGanttSpan(axis.value, record, (event.key === 'ArrowRight' ? 1 : -1) * snapWidth(), localZoom.value, props.selectionStep);
	commitItemChange({ kind: 'resize', lane, record, targetLane: lane, proposal, valid: true }, event);
	focusChangedItem(record.key, lane.key, 'resize');
}

/**
 * Restores keyboard focus after an application accepts a move into another row.
 * @param {string|number} itemKey Stable item id.
 * @param {string|number} rowKey Target row id.
 * @param {'move'|'resize'} kind Control to focus.
 * @returns {Promise<void>} Resolves after the accepted data change renders.
 */
async function focusChangedItem(itemKey, rowKey, kind) {
	await nextTick();
	if (!viewport.value) return;
	const laneIndex = lanes.value.findIndex((lane) => lane.key === rowKey);
	const record = lanes.value[laneIndex]?.records.find((candidate) => candidate.key === itemKey);
	if (!record) return;
	const available = viewportWidth.value - labelWidth.value;
	const position = kind === 'resize' ? record.left + record.width : Math.max(record.left, Math.min(scrollLeft.value + 12, record.left + record.width - 2));
	if (position < scrollLeft.value) viewport.value.scrollLeft = Math.max(0, position - 12);
	else if (position > scrollLeft.value + available - 12) viewport.value.scrollLeft = position - available + 12;
	onScroll();
	await nextTick();
	const row = viewport.value.querySelectorAll('[data-gantt-row-index]')[laneIndex];
	if (row) {
		const bounds = viewport.value.getBoundingClientRect();
		const rowBounds = row.getBoundingClientRect();
		if (rowBounds.top < bounds.top + 64) viewport.value.scrollTop += rowBounds.top - bounds.top - 64;
		else if (rowBounds.bottom > bounds.bottom) viewport.value.scrollTop += rowBounds.bottom - bounds.bottom;
	}
	const selector = kind === 'resize' ? '[data-gantt-resize]' : '[data-gantt-item]';
	const button = Array.from(row?.querySelectorAll(selector) || []).find((element) => element.dataset.ganttItemKey === String(itemKey));
	button?.focus({ preventScroll: true });
}

/** Syncs an externally controlled zoom. @param {string} value Requested zoom. @returns {void} */
function syncZoom(value) { localZoom.value = value; }
/** Syncs external planning state and abandons in-progress selections. @param {boolean} value State. @returns {void} */
function syncPlanning(value) { planning.value = value; cancelSelection(); }
/** Syncs externally controlled hidden hours. @param {boolean} value State. @returns {void} */
function syncHours(value) { hideHours.value = value; }
/** Syncs externally controlled hidden weekdays. @param {boolean} value State. @returns {void} */
function syncDays(value) { hideDays.value = value; }

/** Updates a toolbar setting and reports its v-model value. @param {string} name Setting. @param {unknown} value Next value. @returns {void} */
function updateSetting(name, value) {
	cancelSelection();
	if (name === 'zoom') localZoom.value = value;
	if (name === 'planMode') planning.value = value;
	if (name === 'hideNonWorkingHours') hideHours.value = value;
	if (name === 'hideWeekends') hideDays.value = value;
	emit(`update:${name}`, value);
}

/** Preserves the left-hand date across zoom, range, and working-time changes. @param {object} next Axis. @param {object} previous Previous axis. @returns {Promise<void>} Settles after layout. */
async function preserveDate(next, previous) {
	cancelSelection();
	const date = ganttXToDate(previous, scrollLeft.value);
	await nextTick();
	if (viewport.value) viewport.value.scrollLeft = date === null ? 0 : ganttDateToX(next, date);
	measureViewport();
}

/** Measures responsive label width and reports visible dates. @returns {void} */
function measureViewport() {
	if (!viewport.value) return;
	viewportWidth.value = viewport.value.clientWidth;
	labelWidth.value = viewport.value.querySelector('[data-gantt-corner]')?.getBoundingClientRect().width || 200;
	onScroll();
}

/** Tracks native scroll and emits the visible application query window. @returns {void} */
function onScroll() {
	if (!viewport.value) return;
	scrollLeft.value = viewport.value.scrollLeft;
	const start = ganttXToDate(axis.value, scrollLeft.value);
	const end = ganttXToDate(axis.value, scrollLeft.value + viewportWidth.value - labelWidth.value, 'end');
	if (start !== null && end !== null) emit('visible-range-change', { startDate: new Date(start), endDate: new Date(end) });
}

/** Scrolls within the supplied date window. Hidden instants resolve to the next visible boundary. @param {Date|string|number} value Target. @returns {void} */
function scrollToDate(value) {
	const date = parseGanttDate(value);
	if (viewport.value && date) viewport.value.scrollLeft = ganttDateToX(axis.value, date);
	onScroll();
}

/** Returns to the live day within the supplied scrollable window. @returns {void} */
function scrollToToday() { scrollToDate(new Date()); }

/** Scrolls one viewport in either direction. @param {number} direction -1 or 1. @returns {void} */
function pageTime(direction) {
	if (viewport.value) viewport.value.scrollLeft += direction * Math.max(axis.value.cellWidth, viewportWidth.value - labelWidth.value);
	onScroll();
}

/** Updates live time after mount, avoiding server/client hydration differences. @returns {void} */
function tick() { now.value = Date.now(); }

/** Starts measurement and the minute clock. @returns {void} */
function mountTimeline() {
	tick();
	clockTimer = window.setInterval(tick, 30000);
	resizeObserver = new ResizeObserver(measureViewport);
	resizeObserver.observe(viewport.value);
	measureViewport();
}

/** Releases timers, observers, and pointer listeners. @returns {void} */
function unmountTimeline() {
	cancelSelection();
	resizeObserver?.disconnect();
	window.clearInterval(clockTimer);
}

/** Computes the pixel snap step; day-level views use whole visible dates. @returns {number} Pixels. */
function snapWidth() {
	return ganttSnapWidth(axis.value, localZoom.value, props.selectionStep);
}

/** Finds a bounded snapped position inside the time axis. @param {number} x Unsnapped pixels. @returns {number} Snap start. */
function snapX(x) {
	const step = snapWidth();
	return Math.max(0, Math.min(axis.value.width - step, Math.floor((x + 0.0001) / step) * step));
}

/** Gets axis-relative pointer position through the sticky row header. @param {number} clientX Viewport coordinate. @returns {number} Axis pixels. */
function pointerPosition(clientX) {
	return clientX - viewport.value.getBoundingClientRect().left - labelWidth.value + viewport.value.scrollLeft;
}

/** Starts mouse/pen selection while retaining native touch scrolling. @param {object} lane Source row. @param {PointerEvent} event Pointer event. @returns {void} */
function startSelection(lane, event) {
	if (!planning.value || props.loading || !axis.value.width || event.button !== 0 || event.pointerType === 'touch') return;
	if (event.target.closest('button, input, a, select, textarea, [data-gantt-ignore-selection]')) return;
	event.preventDefault();
	cancelSelection();
	activePointerId = event.pointerId;
	pointerX = event.clientX;
	const anchor = snapX(pointerPosition(pointerX));
	selection.value = { lane, anchor, cursor: anchor };
	event.currentTarget.focus({ preventScroll: true });
	window.addEventListener('pointermove', moveSelection, { passive: false });
	window.addEventListener('pointerup', finishSelection);
	window.addEventListener('pointercancel', cancelSelection);
	window.addEventListener('blur', cancelSelection);
	window.addEventListener('keydown', cancelOnEscape);
	scrollFrame = requestAnimationFrame(autoScroll);
}

/** Updates the active drag, including reversed selections. @param {PointerEvent} event Pointer event. @returns {void} */
function moveSelection(event) {
	if (!selection.value || event.pointerId !== activePointerId) return;
	event.preventDefault();
	pointerX = event.clientX;
	selection.value = { ...selection.value, cursor: snapX(pointerPosition(pointerX)) };
}

/** Keeps dragging usable across horizontal viewport edges. @returns {void} */
function autoScroll() {
	if ((!selection.value && !itemInteraction.value) || !viewport.value) return;
	if (itemInteraction.value && !itemInteraction.value.active) {
		scrollFrame = requestAnimationFrame(autoScroll);
		return;
	}
	const rect = viewport.value.getBoundingClientRect();
	const direction = pointerX > rect.right - 28 ? 1 : pointerX < rect.left + labelWidth.value + 28 ? -1 : 0;
	const vertical = itemInteraction.value ? (pointerY > rect.bottom - 24 ? 1 : pointerY < rect.top + 88 ? -1 : 0) : 0;
	if (vertical) viewport.value.scrollTop += vertical * 8;
	if (direction) {
		viewport.value.scrollLeft += direction * 12;
		onScroll();
		if (selection.value) selection.value = { ...selection.value, cursor: snapX(pointerPosition(pointerX)) };
	}
	if (itemInteraction.value?.active && (direction || vertical)) updateItemProposal();
	scrollFrame = requestAnimationFrame(autoScroll);
}

/** Emits a completed selection only for its owning pointer. @param {PointerEvent} event Pointer event. @returns {void} */
function finishSelection(event) {
	if (!selection.value || event.pointerId !== activePointerId) return;
	moveSelection(event);
	emitRange(selection.value, event);
	cancelSelection();
}

/** Cancels pointer interaction when Escape is pressed anywhere. @param {KeyboardEvent} event Key event. @returns {void} */
function cancelOnEscape(event) { if (event.key === 'Escape') cancelSelection(); }

/** Clears selection state and removes every temporary global listener. @returns {void} */
function cancelSelection() {
	if (itemInteraction.value?.active) suppressedClick = { key: itemInteraction.value.record.key, until: Date.now() + 400 };
	itemInteraction.value = null;
	selection.value = null;
	keyboardSelection.value = null;
	activePointerId = null;
	if (typeof window === 'undefined') return;
	cancelAnimationFrame(scrollFrame);
	window.removeEventListener('pointermove', moveSelection);
	window.removeEventListener('pointerup', finishSelection);
	window.removeEventListener('pointermove', moveItemInteraction);
	window.removeEventListener('pointerup', finishItemInteraction);
	window.removeEventListener('pointercancel', cancelSelection);
	window.removeEventListener('blur', cancelSelection);
	window.removeEventListener('keydown', cancelOnEscape);
}

/** Converts pointer or keyboard state to an exclusive-end preview. @returns {object|null} Preview. */
function getPreview() {
	const state = selection.value || keyboardSelection.value;
	if (!state) return null;
	const left = Math.min(state.anchor, state.cursor);
	const right = Math.min(axis.value.width, Math.max(state.anchor, state.cursor) + snapWidth());
	return { ...state, left, width: right - left, start: ganttXToDate(axis.value, left), end: ganttXToDate(axis.value, right, 'end') };
}

/** Reports a requested range while leaving item creation to the application. @param {object} state Selection. @param {Event} event Origin. @returns {void} */
function emitRange(state, event) {
	const left = Math.min(state.anchor, state.cursor);
	const right = Math.min(axis.value.width, Math.max(state.anchor, state.cursor) + snapWidth());
	const start = ganttXToDate(axis.value, left);
	const end = ganttXToDate(axis.value, right, 'end');
	if (start === null || end === null || end <= start) return;
	emit('time-range-select', { row: state.lane.row, rowKey: state.lane.key, startDate: new Date(start), endDate: new Date(end), durationMinutes: (end - start) / 60000, event });
}

/** Opens an application form with a suggested visible span for touch or keyboard users. @param {object} lane Row. @param {Event} event Origin. @returns {void} */
function requestRange(lane, event) {
	if (!axis.value.width || props.loading) return;
	const anchor = snapX(scrollLeft.value);
	emitRange({ lane, anchor, cursor: anchor }, event);
}

/** Handles a roving time cursor, range extension, and explicit keyboard submission. @param {object} lane Row. @param {KeyboardEvent} event Origin. @returns {void} */
function onLaneKey(lane, event) {
	if (event.target !== event.currentTarget || !planning.value || props.loading || !axis.value.width) return;
	if (!['ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(event.key)) return;
	event.preventDefault();
	if (event.key === 'Escape') return cancelSelection();
	let state = keyboardSelection.value?.lane.key === lane.key ? keyboardSelection.value : { lane, anchor: snapX(scrollLeft.value), cursor: snapX(scrollLeft.value) };
	if (event.key === 'Enter') {
		emitRange(state, event);
		return cancelSelection();
	}
	const cursor = snapX(state.cursor + (event.key === 'ArrowRight' ? snapWidth() : -snapWidth()));
	state = { lane, cursor, anchor: event.shiftKey ? state.anchor : cursor };
	keyboardSelection.value = state;
	const available = viewportWidth.value - labelWidth.value;
	if (cursor < scrollLeft.value) viewport.value.scrollLeft = cursor;
	if (cursor + snapWidth() > scrollLeft.value + available) viewport.value.scrollLeft = cursor + snapWidth() - available;
	onScroll();
}

/** Validates row creation intent and reveals a synchronously accepted row. @returns {Promise<void>} Settles after the row is rendered. */
async function createRow() {
	const name = rowName.value.trim();
	if (!name || props.loading) return;
	const previousCount = lanes.value.length;
	emit('row-create', { name });
	rowName.value = '';
	await nextTick();
	if (viewport.value && lanes.value.length > previousCount) {
		viewport.value.scrollTop = viewport.value.scrollHeight;
		const rowElements = viewport.value.querySelectorAll('[data-gantt-lane]');
		rowElements[rowElements.length - 1]?.focus({ preventScroll: true });
	}
}
</script>

<template>
	<section class="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-canvas text-canvas-fg" :aria-label="ariaLabel" :aria-busy="loading" :class="itemInteraction?.active && ['select-none', itemInteraction.kind === 'resize' ? '[&_*]:cursor-ew-resize!' : '[&_*]:cursor-grabbing!']" data-gantt>
		<div v-if="showToolbar" class="flex flex-wrap items-center gap-2 border-b border-border px-3 py-3 sm:px-4">
			<div class="flex items-center gap-1">
				<DomButton size="sm" variant="ghost" aria-label="Previous time window" @click="pageTime(-1)">←</DomButton>
				<DomButton size="sm" variant="secondary" @click="scrollToToday">Today</DomButton>
				<DomButton size="sm" variant="ghost" aria-label="Next time window" @click="pageTime(1)">→</DomButton>
			</div>
			<span class="mr-auto text-xs font-medium tabular-nums text-muted-fg">{{ rangeLabel }}</span>
			<div class="flex rounded-full border border-border p-0.5" role="group" aria-label="Time zoom">
				<DomButton v-for="level in ['months', 'weeks', 'days']" :key="level" size="sm" :variant="localZoom === level ? 'secondary' : 'ghost'" :aria-pressed="localZoom === level" @click="updateSetting('zoom', level)">{{ level[0].toUpperCase() + level.slice(1) }}</DomButton>
			</div>
			<DomButton size="sm" :variant="planning ? 'primary' : 'secondary'" :aria-pressed="planning" @click="updateSetting('planMode', !planning)">Plan mode</DomButton>
			<div class="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-fg">
				<button type="button" class="rounded py-1 hover:text-canvas-fg focus-visible:outline-2 focus-visible:outline-ring" :aria-pressed="hideDays" @click="updateSetting('hideWeekends', !hideDays)">{{ hideDays ? 'Show weekends' : 'Hide weekends' }}</button>
				<button v-if="localZoom === 'days'" type="button" class="rounded py-1 hover:text-canvas-fg focus-visible:outline-2 focus-visible:outline-ring" :aria-pressed="hideHours" @click="updateSetting('hideNonWorkingHours', !hideHours)">{{ hideHours ? 'Expand all hours' : 'Working hours only' }}</button>
				<span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm border border-border bg-secondary/60"></span> Non-working time</span>
				<slot name="toolbar" />
			</div>
		</div>
		<p v-if="planning" :id="helpId" class="border-b border-border bg-primary/5 px-4 py-2 text-xs leading-5 text-muted-fg">Drag across a row to plan. Use + to enter dates. Keyboard: arrows to move, Shift + arrows to extend, Enter to add, Escape to cancel.</p>
		<div ref="viewport" class="relative isolate overflow-auto overscroll-x-contain [--gantt-label-width:136px] sm:[--gantt-label-width:200px]" :style="{ maxHeight: `${Math.max(180, viewportHeight)}px` }" @scroll.passive="onScroll" data-gantt-viewport>
			<div class="relative min-w-full" :style="{ width: `calc(var(--gantt-label-width) + ${axis.width}px)` }">
				<div class="sticky top-0 z-40 flex h-16 border-b border-border bg-canvas" data-gantt-header>
					<div data-gantt-corner class="sticky left-0 z-50 flex w-[var(--gantt-label-width)] shrink-0 items-center border-r border-border bg-canvas px-3 text-xs font-semibold">{{ rowHeading }}</div>
					<div class="relative flex-1 overflow-hidden" aria-hidden="true">
						<div v-for="group in headerGroups" :key="group.key" class="absolute top-0 h-8 overflow-hidden text-xs font-semibold whitespace-nowrap" :style="{ left: `${Math.max(group.left, scrollLeft)}px`, width: `${Math.max(0, group.width - Math.max(0, scrollLeft - group.left))}px` }"><span class="block px-2 pt-2">{{ group.label }}</span></div>
						<div v-for="cell in visibleCells" :key="cell.start" class="absolute bottom-0 flex h-8 items-center justify-center border-t border-t-border/60 text-[10px] tabular-nums text-muted-fg" :class="[boundaryClass(cell), cell.muted && 'bg-secondary/45']" :style="{ left: `${cell.left}px`, width: `${cell.width}px` }">{{ cellLabel(cell) }}</div>
						<div v-for="cell in visibleCells.filter((entry) => entry.boundary === 'month' || (localZoom === 'days' && entry.boundary !== 'hour'))" :key="`boundary-${cell.start}`" class="pointer-events-none absolute top-0 h-8" :class="boundaryClass(cell)" :style="{ left: `${cell.left}px` }" />
					</div>
				</div>
				<div class="relative">
					<div class="pointer-events-none absolute inset-y-0 left-[var(--gantt-label-width)] right-0" aria-hidden="true">
						<div v-for="cell in visibleCells" :key="cell.start" class="absolute inset-y-0" :class="[boundaryClass(cell), cell.muted && 'bg-secondary/40']" :style="{ left: `${cell.left}px`, width: `${cell.width}px` }" :data-gantt-boundary="cell.boundary" />
					</div>
					<div v-for="(lane, laneIndex) in lanes" :key="lane.key" class="relative flex border-b border-border/70 last:border-b-0" :style="{ height: `${lane.height}px` }" :data-gantt-row-index="laneIndex" data-gantt-row>
						<div class="sticky left-0 z-30 flex w-[var(--gantt-label-width)] shrink-0 items-center gap-2 border-r border-border bg-canvas px-3">
							<div class="min-w-0 flex-1 text-xs font-medium"><slot name="row" :row="lane.row" :row-key="lane.key" :label="lane.label"><span class="block truncate" :title="String(lane.label || '')">{{ lane.label }}</span></slot></div>
							<button v-if="planning" type="button" class="grid size-7 shrink-0 place-items-center rounded-md text-lg text-muted-fg hover:bg-secondary hover:text-canvas-fg focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40" :disabled="loading || !axis.width" :aria-label="`Plan work for ${lane.label}`" @click="requestRange(lane, $event)">+</button>
						</div>
						<div class="relative flex-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50" :class="[planning && 'cursor-crosshair', itemPreview?.lane.key === lane.key && 'bg-primary/5 ring-1 ring-inset ring-primary/30']" :tabindex="planning && !loading ? 0 : undefined" :role="planning ? 'group' : undefined" :aria-label="`${lane.label} timeline`" :aria-describedby="planning ? helpId : undefined" @pointerdown="startSelection(lane, $event)" @keydown="onLaneKey(lane, $event)" @blur="keyboardSelection = null" data-gantt-lane>
							<div v-for="record in visibleItems(lane)" :key="record.key" class="group absolute z-10 h-8 rounded-md border shadow-xs" :class="[itemTone(record), itemInteraction?.active && itemInteraction.record.key === record.key && 'opacity-35']" :style="itemStyle(record)">
								<button type="button" class="flex size-full min-w-0 items-center overflow-hidden rounded-md px-2.5 text-left text-xs font-medium transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-ring" :class="[draggableItems && !loading && 'cursor-grab', showResizeHandle(record) && 'pr-4']" :title="itemLabel(record)" :aria-label="itemLabel(record)" :disabled="loading" :data-gantt-item-key="record.key" @pointerdown.stop="startItemInteraction('move', lane, record, $event)" @dragstart.prevent @keydown="onItemKey(lane, record, $event)" @click="selectItem(lane, record, $event)" data-gantt-item>
									<slot name="item" :item="record.item" :row="lane.row" :start-date="new Date(record.start)" :end-date="new Date(record.end)"><span class="truncate">{{ record.title }}</span></slot>
								</button>
								<button v-if="showResizeHandle(record)" type="button" class="absolute inset-y-0 right-0 flex w-3 touch-none cursor-ew-resize items-center justify-center rounded-r text-muted-fg/35 transition-colors hover:bg-canvas-fg/5 hover:text-muted-fg group-focus-within:text-muted-fg/65 group-hover:text-muted-fg/65 focus-visible:outline-2 focus-visible:outline-ring" :disabled="loading" :aria-label="`Resize ${record.title || 'item'}`" title="Drag to change duration. Use left/right arrows when focused." :data-gantt-item-key="record.key" @pointerdown.stop="startItemInteraction('resize', lane, record, $event)" @keydown="onResizeKey(lane, record, $event)" @click.stop data-gantt-resize>
									<svg width="6" height="14" viewBox="0 0 6 14" fill="currentColor" aria-hidden="true"><circle v-for="dot in 6" :key="dot" :cx="dot % 2 ? 1 : 5" :cy="2 + Math.floor((dot - 1) / 2) * 5" r="0.85" /></svg>
								</button>
							</div>
							<div v-if="itemPreview?.lane.key === lane.key" class="pointer-events-none absolute z-30 flex h-8 items-center overflow-hidden rounded-md border-2 border-primary bg-canvas px-2 text-xs font-semibold text-canvas-fg shadow-md ring-2 ring-primary/15" :style="itemStyle(itemPreview)" data-gantt-item-preview><span class="truncate">{{ itemPreview.title }}</span></div>
							<div v-if="preview?.lane.key === lane.key" class="pointer-events-none absolute inset-y-1 z-20 rounded border-2 border-primary bg-primary/20" :style="{ left: `${preview.left}px`, width: `${preview.width}px` }" data-gantt-selection />
						</div>
					</div>
					<div v-if="currentX !== null" class="pointer-events-none absolute inset-y-0 z-20 w-px bg-destructive" :style="{ left: `calc(var(--gantt-label-width) + ${currentX}px)` }" aria-hidden="true" data-gantt-now><span class="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-destructive"></span></div>
				</div>
			</div>
			<div v-if="!lanes.length" class="sticky left-0 px-4 py-12 text-center text-sm text-muted-fg"><slot name="empty">{{ loading ? 'Loading schedule…' : 'No rows yet. Turn on Plan mode to add your first row.' }}</slot></div>
			<p v-else-if="!axis.width" class="sticky left-0 p-4 text-sm text-muted-fg">All dates in this range are hidden. Show weekends or choose another range.</p>
		</div>
		<form v-if="planning" class="flex flex-wrap items-end gap-2 border-t border-border bg-secondary/15 p-3" @submit.prevent="createRow">
			<label class="sr-only" :for="`${helpId}-row-name`">New row name</label>
			<DomTextInput :id="`${helpId}-row-name`" v-model="rowName" class="min-w-0 flex-1 basis-44" placeholder="New row name…" :disabled="loading" />
			<DomButton type="submit" size="sm" variant="secondary" :disabled="!rowName.trim() || loading">{{ addRowLabel }}</DomButton>
		</form>
		<p v-if="itemInteraction?.active" class="border-t border-border bg-primary/5 px-3 py-2 text-xs text-muted-fg" aria-live="polite">{{ itemPreview ? `${itemPreview.lane.label}: ${new Date(itemPreview.start).toLocaleString('en-GB')} – ${new Date(itemPreview.end).toLocaleString('en-GB')}` : 'Move over a timeline row to drop.' }} Escape to cancel.</p>
		<p class="sr-only" aria-live="polite">{{ preview ? `${new Date(preview.start).toLocaleString('en-GB')} to ${new Date(preview.end).toLocaleString('en-GB')}` : '' }}</p>
	</section>
</template>
