<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomBadge,
	DomButton,
	DomDialog,
	DomEmptyState,
	DomIconButton,
	DomMoneyInput,
	DomMonthCalendar,
	DomNumberInput,
	DomSelect,
	DomStatusPill,
	DomTagCombobox,
	DomToggleButtonGroup,
} from '@getdom/studio/vue';

const modes = [
	{ label: 'Price', value: 'price' },
	{ label: 'Availability', value: 'availability' },
	{ label: 'Rules', value: 'rules' },
];

const mobileViews = [
	{ label: 'Calendar', value: 'calendar' },
	{ label: 'Day', value: 'day' },
	{ label: 'Publish', value: 'publish' },
];

const availabilityOptions = [
	{ label: 'Available', value: 'available', description: 'Open for instant booking' },
	{ label: 'On hold', value: 'hold', description: 'Reserved by a partner or operator' },
	{ label: 'Blocked', value: 'blocked', description: 'Unavailable across every channel' },
];

const restrictionOptions = [
	{ label: 'No check-in', value: 'no-check-in', description: 'Guests cannot arrive on this date' },
	{ label: 'No check-out', value: 'no-check-out', description: 'Guests cannot leave on this date' },
	{ label: 'Manual review', value: 'manual-review', description: 'Require approval before confirmation' },
	{ label: 'Event pricing', value: 'event-pricing', description: 'Keep event rate guardrails active' },
	{ label: 'Owner stay', value: 'owner-stay', description: 'Personal use or maintenance window' },
];

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const previousIcon = 'M15 18l-6-6 6-6';
const nextIcon = 'M9 18l6-6-6-6';

const listings = ref([]);
const selectedListingId = ref('river-loft');
const calendar = ref(null);
const selectedMonth = ref('2026-08');
const selectedDate = ref('2026-08-01');
const mode = ref('price');
const mobileView = ref('calendar');
const nightlyPrice = ref(0);
const availability = ref('available');
const minimumStay = ref(1);
const restrictions = ref([]);
const feedback = ref(null);
const loadError = ref('');
const publishDialogOpen = ref(false);
const isLoading = ref(true);
const isSaving = ref(false);
const isImporting = ref(false);
const isPublishing = ref(false);
const isDiscarding = ref(false);
let calendarRequestSequence = 0;

const listingOptions = computed(() => listings.value.map((listing) => ({
	value: listing.id,
	label: listing.name,
	description: `${listing.description} · ${listing.occupancy}% occupied`,
	status: listing.status,
	pendingChangeCount: listing.pendingChangeCount,
})));
const calendarDays = computed(() => calendar.value?.days || []);
const dayByDate = computed(() => Object.fromEntries(calendarDays.value.map((day) => [day.date, day])));
const visibleDays = computed(() => calendarDays.value.filter((day) => day.date.startsWith(`${selectedMonth.value}-`)));
const selectedDay = computed(() => dayByDate.value[selectedDate.value] || visibleDays.value[0] || null);
const activeListing = computed(() => calendar.value?.listing || listings.value.find((listing) => listing.id === selectedListingId.value) || null);
const pendingChanges = computed(() => calendar.value?.pendingChanges || []);
const pendingDateSet = computed(() => new Set(pendingChanges.value.map((change) => change.date)));
const selectedDayPending = computed(() => pendingDateSet.value.has(selectedDate.value));
const currentMonthIndex = computed(() => Math.max(0, (calendar.value?.months || []).indexOf(selectedMonth.value)));
const monthLabel = computed(() => formatMonth(selectedMonth.value));
const selectedDateLabel = computed(() => formatDate(selectedDate.value));
const selectedRestrictionLabels = computed(() => restrictions.value.map(restrictionLabel).join(', ') || 'No restrictions');
const changedFields = computed(() => {
	if (!selectedDay.value) return [];
	const changes = [];
	if (Number(nightlyPrice.value) !== selectedDay.value.price) changes.push('price');
	if (availability.value !== selectedDay.value.status) changes.push('availability');
	if (Number(minimumStay.value) !== selectedDay.value.minimumStay) changes.push('minimum stay');
	if (restrictions.value.join('|') !== selectedDay.value.restrictions.join('|')) changes.push('restrictions');
	return changes;
});
const availableNightCount = computed(() => visibleDays.value.filter((day) => day.status === 'available').length);
const averageNightlyRate = computed(() => {
	if (!visibleDays.value.length) return 0;
	return Math.round(visibleDays.value.reduce((total, day) => total + day.price, 0) / visibleDays.value.length);
});
const projectedRevenue = computed(() => Math.round(availableNightCount.value * averageNightlyRate.value * 0.72));
const mobileGridCells = computed(() => {
	const firstDay = new Date(`${selectedMonth.value}-01T12:00:00`).getDay();
	const mondayOffset = (firstDay + 6) % 7;
	return [
		...Array.from({ length: mondayOffset }, (_, index) => ({ empty: true, key: `empty-${index}` })),
		...visibleDays.value.map((day) => ({ ...day, key: day.date })),
	];
});

watch(selectedListingId, (listingId, previousListingId) => {
	if (listingId && previousListingId && listingId !== previousListingId) loadCalendar(listingId);
});

onMounted(loadResources);

/**
 * Requests JSON from the availability calendar API and converts non-success
 * responses into ordinary JavaScript errors for consistent recovery UI.
 *
 * @param {string} url API route.
 * @param {RequestInit} [options] Fetch options.
 * @returns {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		...options,
		headers: {
			Accept: 'application/json',
			...(options.body ? { 'Content-Type': 'application/json' } : {}),
			...(options.headers || {}),
		},
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(payload.error || `Request failed with status ${response.status}.`);
	return payload;
}

/**
 * Loads the listing catalog before hydrating the initially selected calendar.
 *
 * @returns {Promise<void>}
 */
async function loadResources() {
	isLoading.value = true;
	loadError.value = '';
	try {
		const payload = await requestJson('/api/block-demos/availability-pricing-calendar/listings');
		listings.value = Array.isArray(payload.listings) ? payload.listings : [];
		if (!listings.value.length) throw new Error('No booking listings are available.');
		if (!listings.value.some((listing) => listing.id === selectedListingId.value)) {
			selectedListingId.value = listings.value[0].id;
		}
		await loadCalendar(selectedListingId.value);
	} catch (error) {
		loadError.value = error instanceof Error ? error.message : 'Could not load booking inventory.';
		isLoading.value = false;
	}
}

/**
 * Loads one listing while ignoring stale responses after a quick selection.
 *
 * @param {string} listingId Canonical listing identifier.
 * @returns {Promise<void>}
 */
async function loadCalendar(listingId) {
	const requestSequence = ++calendarRequestSequence;
	isLoading.value = true;
	loadError.value = '';
	feedback.value = null;
	try {
		const payload = await requestJson(`/api/block-demos/availability-pricing-calendar/${encodeURIComponent(listingId)}`);
		if (requestSequence !== calendarRequestSequence) return;
		applyCalendar(payload.calendar, { resetMonth: true });
	} catch (error) {
		if (requestSequence !== calendarRequestSequence) return;
		loadError.value = error instanceof Error ? error.message : 'Could not load this listing.';
	} finally {
		if (requestSequence === calendarRequestSequence) isLoading.value = false;
	}
}

/**
 * Applies a complete API calendar payload and refreshes the active day editor.
 *
 * @param {Record<string, unknown>} nextCalendar API calendar payload.
 * @param {{ resetMonth?: boolean, preferredDate?: string }} [options] Selection behavior.
 * @returns {void}
 */
function applyCalendar(nextCalendar, options = {}) {
	calendar.value = nextCalendar;
	syncListingSummary(nextCalendar.listing);
	if (options.resetMonth || !nextCalendar.months.includes(selectedMonth.value)) {
		selectedMonth.value = nextCalendar.months[0];
	}
	const preferredDate = options.preferredDate || selectedDate.value;
	const nextDate = nextCalendar.days.some((day) => day.date === preferredDate)
		? preferredDate
		: nextCalendar.days.find((day) => day.date.startsWith(`${selectedMonth.value}-`))?.date;
	selectDay(nextDate || nextCalendar.days[0]?.date, false);
}

/**
 * Refreshes selector metadata after draft or publish mutations.
 *
 * @param {Record<string, unknown>} listing Updated listing summary.
 * @returns {void}
 */
function syncListingSummary(listing) {
	listings.value = listings.value.map((item) => (item.id === listing.id ? { ...item, ...listing } : item));
}

/**
 * Selects a date, populates its exact rule editor, and optionally opens the
 * focused mobile day workflow.
 *
 * @param {string} date Date-only inventory identifier.
 * @param {boolean} [openMobileEditor] Whether to reveal the mobile day panel.
 * @returns {void}
 */
function selectDay(date, openMobileEditor = true) {
	const day = dayByDate.value[date];
	if (!day) return;
	selectedDate.value = date;
	nightlyPrice.value = day.price;
	availability.value = day.status;
	minimumStay.value = day.minimumStay;
	restrictions.value = [...day.restrictions];
	feedback.value = null;
	if (openMobileEditor) mobileView.value = 'day';
}

/**
 * Handles a DOM Studio calendar day activation.
 *
 * @param {{ cell: { value: string } }} payload Calendar click payload.
 * @returns {void}
 */
function onDayClick({ cell }) {
	selectDay(cell.value);
}

/**
 * Moves to the adjacent loaded month without requesting unsupported inventory.
 *
 * @param {number} direction Negative for previous and positive for next.
 * @returns {void}
 */
function navigateMonth(direction) {
	const months = calendar.value?.months || [];
	const nextIndex = Math.max(0, Math.min(months.length - 1, currentMonthIndex.value + direction));
	if (!months[nextIndex] || months[nextIndex] === selectedMonth.value) return;
	selectedMonth.value = months[nextIndex];
	const nextDate = calendarDays.value.find((day) => day.date.startsWith(`${selectedMonth.value}-`))?.date;
	if (nextDate) selectDay(nextDate, false);
}

/**
 * Saves the active date editor as an unpublished server-owned draft.
 *
 * @returns {Promise<void>}
 */
async function saveDay() {
	if (!selectedDay.value || !changedFields.value.length) return;
	isSaving.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(
			`/api/block-demos/availability-pricing-calendar/${encodeURIComponent(selectedListingId.value)}/days/${encodeURIComponent(selectedDate.value)}`,
			{
				method: 'PATCH',
				body: JSON.stringify({
					price: Number(nightlyPrice.value),
					status: availability.value,
					minimumStay: Number(minimumStay.value),
					restrictions: restrictions.value,
				}),
			},
		);
		applyCalendar(payload.calendar, { preferredDate: selectedDate.value });
		feedback.value = {
			tone: 'success',
			title: 'Draft saved',
			description: `${selectedDateLabel.value} is ready for review and publishing.`,
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Draft not saved',
			description: error instanceof Error ? error.message : 'Check the date rule and try again.',
		};
	} finally {
		isSaving.value = false;
	}
}

/**
 * Imports deterministic partner holds into the visible month through the API.
 *
 * @returns {Promise<void>}
 */
async function importHolds() {
	isImporting.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(
			`/api/block-demos/availability-pricing-calendar/${encodeURIComponent(selectedListingId.value)}/holds/import`,
			{
				method: 'POST',
				body: JSON.stringify({ month: selectedMonth.value }),
			},
		);
		applyCalendar(payload.calendar, { preferredDate: payload.importedDates[0] || selectedDate.value });
		feedback.value = {
			tone: payload.importedDates.length ? 'success' : 'info',
			title: payload.importedDates.length ? 'Partner holds imported' : 'Channels already up to date',
			description: payload.importedDates.length
				? `${payload.importedDates.length} ${payload.importedDates.length === 1 ? 'date was' : 'dates were'} saved as drafts for ${monthLabel.value}.`
				: `No new holds were found for ${monthLabel.value}.`,
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Holds not imported',
			description: error instanceof Error ? error.message : 'Try the import again.',
		};
	} finally {
		isImporting.value = false;
	}
}

/**
 * Publishes every saved draft to the configured channels with revision checks.
 *
 * @returns {Promise<void>}
 */
async function publishChanges() {
	if (!pendingChanges.value.length) return;
	isPublishing.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(
			`/api/block-demos/availability-pricing-calendar/${encodeURIComponent(selectedListingId.value)}/publish`,
			{
				method: 'POST',
				body: JSON.stringify({ revision: calendar.value.revision }),
			},
		);
		applyCalendar(payload.calendar, { preferredDate: selectedDate.value });
		publishDialogOpen.value = false;
		mobileView.value = 'calendar';
		feedback.value = {
			tone: 'success',
			title: 'Calendar published',
			description: `${payload.publishedDates.length} ${payload.publishedDates.length === 1 ? 'date is' : 'dates are'} synced across all three channels.`,
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Calendar not published',
			description: error instanceof Error ? error.message : 'Reload the inventory and try again.',
		};
	} finally {
		isPublishing.value = false;
	}
}

/**
 * Discards all saved drafts and restores the last published calendar state.
 *
 * @returns {Promise<void>}
 */
async function discardChanges() {
	if (!pendingChanges.value.length) return;
	isDiscarding.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(
			`/api/block-demos/availability-pricing-calendar/${encodeURIComponent(selectedListingId.value)}/discard`,
			{
				method: 'POST',
				body: JSON.stringify({ revision: calendar.value.revision }),
			},
		);
		applyCalendar(payload.calendar, { preferredDate: selectedDate.value });
		publishDialogOpen.value = false;
		feedback.value = {
			tone: 'info',
			title: 'Drafts discarded',
			description: `${payload.discardedDates.length} ${payload.discardedDates.length === 1 ? 'date was' : 'dates were'} restored to the published state.`,
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Drafts not discarded',
			description: error instanceof Error ? error.message : 'Reload the inventory and try again.',
		};
	} finally {
		isDiscarding.value = false;
	}
}

/**
 * Returns a day record for the DOM Studio month-calendar slot.
 *
 * @param {string} date Date-only cell value.
 * @returns {Record<string, unknown>|undefined} Matching inventory day.
 */
function dayFor(date) {
	return dayByDate.value[date];
}

/**
 * Builds calendar cell classes from selection, draft, and availability state.
 *
 * @param {{ value: string }} cell DOM Studio calendar cell.
 * @returns {string} Tailwind class list.
 */
function cellClass(cell) {
	const day = dayFor(cell.value);
	if (!day) return '!min-h-24 md:!min-h-24 lg:!min-h-28';
	const classes = ['!min-h-24 md:!min-h-24 lg:!min-h-28'];
	if (cell.value === selectedDate.value) classes.push('bg-primary/10 ring-2 ring-inset ring-primary/45');
	else if (day.status === 'blocked') classes.push('bg-destructive/5');
	else if (day.status === 'hold') classes.push('bg-warning/10');
	if (pendingDateSet.value.has(cell.value)) classes.push('after:absolute after:right-2 after:top-2 after:size-2 after:rounded-full after:bg-primary');
	return classes.join(' ');
}

/**
 * Resolves a semantic status tone for an availability state.
 *
 * @param {string} status Availability state.
 * @returns {string} DOM Studio tone.
 */
function statusTone(status) {
	return {
		available: 'success',
		hold: 'warning',
		blocked: 'danger',
	}[status] || 'neutral';
}

/**
 * Resolves a concise label for an availability state.
 *
 * @param {string} status Availability state.
 * @returns {string} Human-readable status.
 */
function statusLabel(status) {
	return {
		available: 'Open',
		hold: 'Hold',
		blocked: 'Blocked',
	}[status] || status;
}

/**
 * Resolves a human-readable restriction label.
 *
 * @param {string} value Restriction identifier.
 * @returns {string} Restriction label.
 */
function restrictionLabel(value) {
	return restrictionOptions.find((option) => option.value === value)?.label || value;
}

/**
 * Formats an API month identifier for the workspace heading.
 *
 * @param {string} value Month in YYYY-MM format.
 * @returns {string} Localized month label.
 */
function formatMonth(value) {
	return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })
		.format(new Date(`${value}-01T12:00:00`));
}

/**
 * Formats an API date identifier for the day inspector.
 *
 * @param {string} value Date in YYYY-MM-DD format.
 * @returns {string} Localized date label.
 */
function formatDate(value) {
	return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })
		.format(new Date(`${value}T12:00:00`));
}

/**
 * Formats a whole-value price in the listing currency.
 *
 * @param {number} value Monetary value.
 * @returns {string} Compact localized currency.
 */
function formatCurrency(value) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: activeListing.value?.currency || 'GBP',
		maximumFractionDigits: 0,
	}).format(value || 0);
}

/**
 * Builds an accessible mobile calendar day label.
 *
 * @param {Record<string, unknown>} day Inventory day.
 * @returns {string} Button label.
 */
function mobileDayLabel(day) {
	return `${formatDate(day.date)}, ${formatCurrency(day.price)}, ${statusLabel(day.status)}`;
}
</script>

<template>
	<section class="min-h-screen bg-canvas text-canvas-fg" data-testid="availability-pricing-calendar-block">
		<header class="border-b border-border bg-canvas px-4 py-4 sm:px-6 lg:px-8">
			<div class="mx-auto flex max-w-[96rem] flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-fg">
						<span>Bookings</span>
						<span aria-hidden="true">/</span>
						<span>Calendar</span>
						<DomStatusPill v-if="calendar" tone="success" size="sm">Inventory live</DomStatusPill>
					</div>
					<h1 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Rates &amp; availability</h1>
					<p class="mt-1 text-sm text-muted-fg">Manage resolved nightly inventory, then publish saved drafts to every booking channel.</p>
				</div>

				<div v-if="calendar" class="flex flex-wrap items-end gap-x-5 gap-y-3 text-sm">
					<div>
						<p class="text-xs text-muted-fg">Projected revenue</p>
						<p class="font-semibold">{{ formatCurrency(projectedRevenue) }}</p>
					</div>
					<div class="hidden h-8 w-px bg-border sm:block"></div>
					<div>
						<p class="text-xs text-muted-fg">Open nights</p>
						<p class="font-semibold">{{ availableNightCount }} of {{ visibleDays.length }}</p>
					</div>
					<div class="hidden h-8 w-px bg-border sm:block"></div>
					<div>
						<p class="text-xs text-muted-fg">Occupancy</p>
						<p class="font-semibold">{{ activeListing.occupancy }}%</p>
					</div>
				</div>
			</div>
		</header>

		<main class="mx-auto max-w-[96rem] px-4 py-4 sm:px-6 lg:px-8">
			<DomAlert
				v-if="loadError"
				tone="danger"
				title="Calendar unavailable"
				:description="loadError"
			>
				<template #actions>
					<DomButton size="sm" variant="secondary" @click="loadResources">Try again</DomButton>
				</template>
			</DomAlert>

			<DomEmptyState
				v-else-if="isLoading && !calendar"
				title="Loading booking inventory"
				description="Resolving prices, holds, restrictions, and channel state from the demo API."
				size="sm"
			/>

			<template v-else-if="calendar">
				<div class="flex flex-col gap-3 border-b border-border pb-4 xl:flex-row xl:items-end xl:justify-between">
					<div class="grid min-w-0 gap-3 sm:grid-cols-[minmax(15rem,22rem)_auto] sm:items-end">
						<DomSelect
							v-model="selectedListingId"
							label="Listing"
							:options="listingOptions"
							width="min-w-[21rem]"
						>
							<template #value="{ option }">
								<span class="flex min-w-0 items-center justify-between gap-3">
									<span class="min-w-0 truncate font-semibold">{{ option?.label || activeListing.name }}</span>
									<DomBadge v-if="activeListing.pendingChangeCount" tone="primary" size="sm">{{ activeListing.pendingChangeCount }} drafts</DomBadge>
								</span>
							</template>
							<template #option="{ option }">
								<span class="flex min-w-0 items-center justify-between gap-3">
									<span class="min-w-0">
										<span class="block truncate font-semibold">{{ option.label }}</span>
										<span class="block truncate text-xs opacity-75">{{ option.description }}</span>
									</span>
									<DomBadge v-if="option.pendingChangeCount" tone="primary" size="sm">{{ option.pendingChangeCount }}</DomBadge>
								</span>
							</template>
						</DomSelect>

						<DomToggleButtonGroup
							v-model="mode"
							label="Calendar display"
							:options="modes"
							size="sm"
						/>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<DomButton variant="secondary" size="sm" :loading="isImporting" @click="importHolds">Import holds</DomButton>
						<DomButton size="sm" :disabled="!pendingChanges.length" @click="publishDialogOpen = true">
							Review &amp; publish
							<span v-if="pendingChanges.length">({{ pendingChanges.length }})</span>
						</DomButton>
					</div>
				</div>

				<DomAlert
					v-if="feedback"
					class="mt-4"
					:tone="feedback.tone"
					:title="feedback.title"
					:description="feedback.description"
					dismissible
					@dismiss="feedback = null"
				/>

				<div class="mt-4 md:hidden">
					<DomToggleButtonGroup
						v-model="mobileView"
						label="Mobile calendar section"
						:options="mobileViews"
						size="sm"
					/>
				</div>

				<div class="mt-4 hidden gap-0 overflow-hidden rounded-2xl border border-border bg-canvas shadow-sm md:grid md:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
					<section class="min-w-0 border-r border-border" aria-label="Availability calendar">
						<div class="flex items-center justify-between border-b border-border px-4 py-3">
							<div class="flex items-center gap-2">
								<DomIconButton
									label="Previous month"
									:icon="previousIcon"
									size="sm"
									:disabled="currentMonthIndex === 0"
									@click="navigateMonth(-1)"
								/>
								<h2 class="min-w-40 text-center text-base font-semibold">{{ monthLabel }}</h2>
								<DomIconButton
									label="Next month"
									:icon="nextIcon"
									size="sm"
									:disabled="currentMonthIndex === calendar.months.length - 1"
									@click="navigateMonth(1)"
								/>
							</div>
							<div class="flex items-center gap-2 text-xs text-muted-fg">
								<span class="size-2 rounded-full bg-primary"></span>
								Saved draft
							</div>
						</div>

						<div class="p-3">
							<DomMonthCalendar
								:start-date="`${selectedMonth}-01`"
								:months="1"
								:clickable="true"
								:fixed-weeks="true"
								:show-adjacent-days="false"
								:day-class="cellClass"
								@day-click="onDayClick"
							>
								<template #month-header>
									<span>{{ activeListing.name }} · {{ mode === 'price' ? 'Nightly rate' : mode === 'availability' ? 'Booking status' : 'Stay rules' }}</span>
								</template>

								<template #default="{ cell }">
									<div v-if="dayFor(cell.value)" class="flex h-full min-h-0 flex-col gap-1">
										<template v-if="mode === 'price'">
											<strong class="text-sm">{{ formatCurrency(dayFor(cell.value).price) }}</strong>
											<span class="mt-auto text-[11px] text-muted-fg">{{ dayFor(cell.value).demand }}% demand</span>
										</template>
										<template v-else-if="mode === 'availability'">
											<DomStatusPill :tone="statusTone(dayFor(cell.value).status)" size="sm">{{ statusLabel(dayFor(cell.value).status) }}</DomStatusPill>
											<span class="mt-auto truncate text-[11px] text-muted-fg">{{ dayFor(cell.value).source }}</span>
										</template>
										<template v-else>
											<strong class="text-sm">{{ dayFor(cell.value).minimumStay }} night min</strong>
											<span class="mt-auto text-[11px] text-muted-fg">{{ dayFor(cell.value).restrictions.length ? `${dayFor(cell.value).restrictions.length} restrictions` : 'Standard rules' }}</span>
										</template>
									</div>
								</template>
							</DomMonthCalendar>
						</div>
					</section>

					<aside class="min-w-0 bg-secondary/20" aria-label="Selected date editor">
						<div class="border-b border-border px-5 py-4">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-xs font-medium uppercase tracking-wide text-muted-fg">Selected date</p>
									<h2 class="mt-1 text-lg font-semibold">{{ selectedDateLabel }}</h2>
								</div>
								<DomBadge v-if="selectedDayPending" tone="primary" variant="outline">Draft</DomBadge>
							</div>
							<p class="mt-2 text-xs leading-5 text-muted-fg">{{ selectedDay?.demand }}% demand · Recommended {{ formatCurrency(selectedDay?.recommendedPrice) }}</p>
						</div>

						<form class="space-y-4 p-5" @submit.prevent="saveDay">
							<DomMoneyInput v-model="nightlyPrice" label="Nightly price" currency="GBP" :min="80" :max="1200" :step="1" />
							<DomSelect v-model="availability" label="Availability" :options="availabilityOptions" width="min-w-[18rem]" />
							<DomNumberInput v-model="minimumStay" label="Minimum stay" description="Nights before checkout" :min="1" :max="14" :step="1" />
							<DomTagCombobox v-model="restrictions" label="Restrictions" placeholder="Add a rule" :options="restrictionOptions" :clearable="true" />

							<div class="border-t border-border pt-4">
								<DomButton class="w-full" type="submit" :loading="isSaving" :disabled="!changedFields.length">
									Save day draft
								</DomButton>
								<p class="mt-2 text-center text-xs leading-5 text-muted-fg">
									{{ changedFields.length ? `${changedFields.length} unsaved ${changedFields.length === 1 ? 'field' : 'fields'}` : selectedDayPending ? 'Saved, not yet published' : 'Matches published inventory' }}
								</p>
							</div>
						</form>
					</aside>
				</div>

				<section v-if="mobileView === 'calendar'" class="mt-4 md:hidden" aria-label="Compact availability calendar">
					<div class="flex items-center justify-between">
						<DomIconButton label="Previous month" :icon="previousIcon" :disabled="currentMonthIndex === 0" @click="navigateMonth(-1)" />
						<div class="text-center">
							<h2 class="font-semibold">{{ monthLabel }}</h2>
							<p class="text-xs text-muted-fg">{{ activeListing.name }}</p>
						</div>
						<DomIconButton label="Next month" :icon="nextIcon" :disabled="currentMonthIndex === calendar.months.length - 1" @click="navigateMonth(1)" />
					</div>

					<div class="mt-4 grid grid-cols-7 border-b border-l border-border text-center">
						<div v-for="weekday in weekdayLabels" :key="weekday" class="border-r border-t border-border bg-secondary/50 px-1 py-2 text-[10px] font-semibold uppercase text-muted-fg">
							{{ weekday.slice(0, 1) }}
						</div>
						<template v-for="cell in mobileGridCells" :key="cell.key">
							<div v-if="cell.empty" class="min-h-16 border-r border-t border-border bg-secondary/20"></div>
							<button
								v-else
								type="button"
								class="relative min-h-16 border-r border-t border-border p-1 text-left outline-none transition focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
								:class="{
									'bg-primary/10 ring-2 ring-inset ring-primary/45': cell.date === selectedDate,
									'bg-warning/10': cell.status === 'hold' && cell.date !== selectedDate,
									'bg-destructive/5': cell.status === 'blocked' && cell.date !== selectedDate,
								}"
								:aria-label="mobileDayLabel(cell)"
								@click="selectDay(cell.date)"
							>
								<span class="text-xs font-semibold">{{ Number(cell.date.slice(-2)) }}</span>
								<span v-if="pendingDateSet.has(cell.date)" class="absolute right-1 top-1 size-1.5 rounded-full bg-primary" title="Saved draft"></span>
								<span class="mt-2 block truncate text-[10px] font-medium">{{ mode === 'price' ? formatCurrency(cell.price) : mode === 'availability' ? statusLabel(cell.status) : `${cell.minimumStay}n min` }}</span>
							</button>
						</template>
					</div>
					<p class="mt-3 text-center text-xs text-muted-fg">Choose a date to open its full rate and availability controls.</p>
				</section>

				<section v-else-if="mobileView === 'day'" class="mt-4 md:hidden" aria-label="Selected day editor">
					<div class="flex items-start justify-between gap-3 border-b border-border pb-4">
						<div>
							<p class="text-xs font-medium uppercase tracking-wide text-muted-fg">Selected date</p>
							<h2 class="mt-1 text-xl font-semibold">{{ selectedDateLabel }}</h2>
							<p class="mt-1 text-xs text-muted-fg">{{ selectedDay?.demand }}% demand · Recommended {{ formatCurrency(selectedDay?.recommendedPrice) }}</p>
						</div>
						<DomBadge v-if="selectedDayPending" tone="primary" variant="outline">Draft</DomBadge>
					</div>

					<form class="mt-4 space-y-4" @submit.prevent="saveDay">
						<DomMoneyInput v-model="nightlyPrice" label="Nightly price" currency="GBP" :min="80" :max="1200" :step="1" />
						<DomSelect v-model="availability" label="Availability" :options="availabilityOptions" width="min-w-[18rem]" />
						<DomNumberInput v-model="minimumStay" label="Minimum stay" description="Nights before checkout" :min="1" :max="14" :step="1" />
						<DomTagCombobox v-model="restrictions" label="Restrictions" placeholder="Add a rule" :options="restrictionOptions" :clearable="true" />
						<DomButton class="w-full" type="submit" :loading="isSaving" :disabled="!changedFields.length">Save day draft</DomButton>
						<p class="text-center text-xs text-muted-fg">{{ selectedRestrictionLabels }}</p>
					</form>
				</section>

				<section v-else class="mt-4 space-y-5 md:hidden" aria-label="Publish calendar changes">
					<div>
						<p class="text-xs font-medium uppercase tracking-wide text-muted-fg">Saved drafts</p>
						<h2 class="mt-1 text-xl font-semibold">{{ pendingChanges.length }} {{ pendingChanges.length === 1 ? 'date' : 'dates' }} ready</h2>
						<p class="mt-1 text-sm leading-6 text-muted-fg">Publishing distributes resolved inventory to Direct booking, Airbnb, and Booking.com.</p>
					</div>

					<div v-if="pendingChanges.length" class="divide-y divide-border border-y border-border">
						<div v-for="change in pendingChanges" :key="change.date" class="flex items-start justify-between gap-3 py-3 text-sm">
							<div>
								<p class="font-semibold">{{ formatDate(change.date) }}</p>
								<p class="mt-1 text-xs text-muted-fg">{{ change.fields.join(', ') }}</p>
							</div>
							<DomBadge tone="primary" variant="outline">Draft</DomBadge>
						</div>
					</div>
					<DomEmptyState v-else title="Everything is published" description="Edit a day or import partner holds to create a new draft." size="sm" />

					<div class="space-y-2">
						<DomButton class="w-full" :disabled="!pendingChanges.length" :loading="isPublishing" @click="publishChanges">Publish to 3 channels</DomButton>
						<DomButton class="w-full" variant="ghost" :disabled="!pendingChanges.length" :loading="isDiscarding" @click="discardChanges">Discard drafts</DomButton>
					</div>
				</section>

				<footer class="mt-4 flex flex-col gap-2 border-t border-border pt-3 text-xs text-muted-fg sm:flex-row sm:items-center sm:justify-between">
					<span>Last synced {{ calendar.lastSyncedAt }} · Published {{ calendar.lastPublishedAt }}</span>
					<DomButton variant="ghost" size="sm" @click="loadCalendar(selectedListingId)">Reload server state</DomButton>
				</footer>
			</template>
		</main>

		<DomDialog
			v-model="publishDialogOpen"
			title="Publish calendar changes"
			description="Review saved drafts before sending resolved inventory to every connected channel."
			size="lg"
		>
			<div v-if="pendingChanges.length" class="divide-y divide-border border-y border-border">
				<div v-for="change in pendingChanges" :key="change.date" class="flex items-start justify-between gap-4 py-3 text-sm">
					<div>
						<p class="font-semibold">{{ formatDate(change.date) }}</p>
						<p class="mt-1 text-xs text-muted-fg">Changed {{ change.fields.join(', ') }}</p>
					</div>
					<DomBadge tone="primary" variant="outline">Saved</DomBadge>
				</div>
			</div>

			<div class="mt-5 grid gap-3 sm:grid-cols-3">
				<div v-for="channel in calendar?.channels || []" :key="channel.id" class="border-l-2 border-success pl-3">
					<p class="text-sm font-semibold">{{ channel.name }}</p>
					<p class="mt-1 text-xs leading-5 text-muted-fg">{{ channel.detail }}</p>
				</div>
			</div>

			<template #footer>
				<DomButton variant="ghost" :loading="isDiscarding" @click="discardChanges">Discard drafts</DomButton>
				<DomButton :loading="isPublishing" @click="publishChanges">Publish {{ pendingChanges.length }} {{ pendingChanges.length === 1 ? 'date' : 'dates' }}</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
