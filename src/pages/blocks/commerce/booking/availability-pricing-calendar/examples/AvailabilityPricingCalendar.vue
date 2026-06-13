<script setup>
import { computed, ref } from 'vue';
import {
	DomBadge,
	DomButton,
	DomDialog,
	DomListbox,
	DomMonthCalendar,
	DomRangeInput,
	DomStatusPill,
	DomTagCombobox,
	DomToggleButtonGroup,
} from '../../../../../lib/vue';

const listings = [
	{
		value: 'river-loft',
		label: 'River loft',
		description: '2 bedrooms · Sleeps 4 · Central',
		occupancy: '83%',
		revenue: 'GBP 7.8k',
		status: 'Live',
	},
	{
		value: 'garden-studio',
		label: 'Garden studio',
		description: 'Studio · Sleeps 2 · West End',
		occupancy: '71%',
		revenue: 'GBP 4.1k',
		status: 'Needs review',
	},
	{
		value: 'harbour-house',
		label: 'Harbour house',
		description: '4 bedrooms · Sleeps 8 · Waterfront',
		occupancy: '64%',
		revenue: 'GBP 11.2k',
		status: 'Seasonal',
	},
];

const modes = [
	{ label: 'Price', value: 'price' },
	{ label: 'Availability', value: 'availability' },
	{ label: 'Rules', value: 'rules' },
];

const availabilityOptions = [
	{ label: 'Available', value: 'available', description: 'Open for instant booking', tone: 'success' },
	{ label: 'Blocked', value: 'blocked', description: 'Unavailable across channels', tone: 'danger' },
	{ label: 'Hold', value: 'hold', description: 'Temporarily reserved internally', tone: 'warning' },
];

const restrictionOptions = [
	{ label: 'No check-in', value: 'no-check-in', description: 'Guests cannot start on this date' },
	{ label: 'No check-out', value: 'no-check-out', description: 'Guests cannot leave on this date' },
	{ label: 'Manual review', value: 'manual-review', description: 'Require approval before confirmation' },
	{ label: 'Event pricing', value: 'event-pricing', description: 'Keep dynamic pricing guardrails active' },
	{ label: 'Owner stay', value: 'owner-stay', description: 'Personal use or maintenance window' },
];

const calendarDays = [
	{ date: '2026-07-03', price: 164, status: 'available', demand: 48, minStay: 2, restrictions: [] },
	{ date: '2026-07-04', price: 178, status: 'available', demand: 54, minStay: 2, restrictions: [] },
	{ date: '2026-07-05', price: 172, status: 'available', demand: 51, minStay: 2, restrictions: [] },
	{ date: '2026-07-06', price: 149, status: 'hold', demand: 36, minStay: 2, restrictions: ['manual-review'] },
	{ date: '2026-07-07', price: 152, status: 'available', demand: 42, minStay: 2, restrictions: [] },
	{ date: '2026-07-08', price: 156, status: 'available', demand: 44, minStay: 2, restrictions: [] },
	{ date: '2026-07-09', price: 161, status: 'available', demand: 47, minStay: 2, restrictions: [] },
	{ date: '2026-07-10', price: 198, status: 'available', demand: 71, minStay: 2, restrictions: ['event-pricing'] },
	{ date: '2026-07-11', price: 211, status: 'available', demand: 79, minStay: 3, restrictions: ['event-pricing'] },
	{ date: '2026-07-12', price: 206, status: 'available', demand: 76, minStay: 3, restrictions: ['event-pricing'] },
	{ date: '2026-07-13', price: 158, status: 'available', demand: 43, minStay: 2, restrictions: [] },
	{ date: '2026-07-14', price: 154, status: 'available', demand: 39, minStay: 2, restrictions: [] },
	{ date: '2026-07-15', price: 165, status: 'available', demand: 56, minStay: 2, restrictions: [] },
	{ date: '2026-07-16', price: 183, status: 'available', demand: 62, minStay: 2, restrictions: [] },
	{ date: '2026-07-17', price: 219, status: 'available', demand: 88, minStay: 3, restrictions: ['no-check-in', 'event-pricing'] },
	{ date: '2026-07-18', price: 232, status: 'available', demand: 91, minStay: 3, restrictions: ['event-pricing'] },
	{ date: '2026-07-19', price: 224, status: 'available', demand: 85, minStay: 3, restrictions: ['no-check-out', 'event-pricing'] },
	{ date: '2026-07-20', price: 151, status: 'blocked', demand: 30, minStay: 2, restrictions: ['owner-stay'] },
	{ date: '2026-07-21', price: 151, status: 'blocked', demand: 28, minStay: 2, restrictions: ['owner-stay'] },
	{ date: '2026-07-22', price: 159, status: 'available', demand: 41, minStay: 2, restrictions: [] },
	{ date: '2026-07-23', price: 166, status: 'available', demand: 48, minStay: 2, restrictions: [] },
	{ date: '2026-07-24', price: 194, status: 'hold', demand: 68, minStay: 2, restrictions: ['manual-review'] },
	{ date: '2026-07-25', price: 207, status: 'available', demand: 74, minStay: 2, restrictions: [] },
	{ date: '2026-07-26', price: 184, status: 'available', demand: 63, minStay: 2, restrictions: [] },
	{ date: '2026-07-27', price: 143, status: 'available', demand: 32, minStay: 2, restrictions: [] },
	{ date: '2026-07-28', price: 145, status: 'available', demand: 35, minStay: 2, restrictions: [] },
	{ date: '2026-07-29', price: 147, status: 'available', demand: 37, minStay: 2, restrictions: [] },
	{ date: '2026-07-30', price: 153, status: 'available', demand: 45, minStay: 2, restrictions: [] },
	{ date: '2026-07-31', price: 181, status: 'available', demand: 65, minStay: 2, restrictions: [] },
	{ date: '2026-08-01', price: 204, status: 'available', demand: 77, minStay: 3, restrictions: ['event-pricing'] },
	{ date: '2026-08-02', price: 196, status: 'available', demand: 72, minStay: 3, restrictions: ['event-pricing'] },
	{ date: '2026-08-03', price: 148, status: 'available', demand: 40, minStay: 2, restrictions: [] },
	{ date: '2026-08-04', price: 146, status: 'available', demand: 38, minStay: 2, restrictions: [] },
	{ date: '2026-08-05', price: 149, status: 'available', demand: 43, minStay: 2, restrictions: [] },
	{ date: '2026-08-06', price: 167, status: 'available', demand: 55, minStay: 2, restrictions: [] },
	{ date: '2026-08-07', price: 202, status: 'available', demand: 78, minStay: 2, restrictions: ['event-pricing'] },
	{ date: '2026-08-08', price: 216, status: 'available', demand: 84, minStay: 2, restrictions: ['event-pricing'] },
	{ date: '2026-08-09', price: 191, status: 'available', demand: 66, minStay: 2, restrictions: [] },
];

const selectedListing = ref('river-loft');
const mode = ref('price');
const selectedDate = ref('2026-07-18');
const availability = ref('available');
const nightlyPrice = ref(232);
const minimumStay = ref(3);
const restrictions = ref(['event-pricing']);
const publishDialogOpen = ref(false);
const publishedMessage = ref('Pending changes saved locally');

const dayByDate = computed(() => Object.fromEntries(calendarDays.map((day) => [day.date, day])));
const activeListing = computed(() => listings.find((listing) => listing.value === selectedListing.value) || listings[0]);
const selectedDay = computed(() => dayByDate.value[selectedDate.value] || calendarDays[0]);
const selectedRestrictionLabels = computed(() => restrictions.value.map((value) => restrictionLabel(value)).join(', ') || 'No restrictions');
const selectedAvailabilityOption = computed(() => availabilityOptions.find((option) => option.value === availability.value) || availabilityOptions[0]);
const selectedDayDemandLabel = computed(() => demandLabel(selectedDay.value?.demand || 0));
const projectedRevenue = computed(() => {
	const availableNights = calendarDays.filter((day) => day.status === 'available').length;
	const averagePrice = Math.round(calendarDays.reduce((total, day) => total + day.price, 0) / calendarDays.length);
	return `GBP ${Math.round((availableNights * averagePrice * 0.74) / 100) / 10}k`;
});
const changedFields = computed(() => {
	const changes = [];
	if (nightlyPrice.value !== selectedDay.value.price) changes.push('price');
	if (availability.value !== selectedDay.value.status) changes.push('availability');
	if (minimumStay.value !== selectedDay.value.minStay) changes.push('minimum stay');
	if (restrictions.value.join('|') !== selectedDay.value.restrictions.join('|')) changes.push('restrictions');
	return changes;
});

function dayFor(value) {
	return dayByDate.value[value];
}

function onDayClick({ cell }) {
	const day = dayFor(cell.value);
	if (!day) return;
	selectedDate.value = cell.value;
	availability.value = day.status;
	nightlyPrice.value = day.price;
	minimumStay.value = day.minStay;
	restrictions.value = [...day.restrictions];
	publishedMessage.value = 'Pending changes saved locally';
}

function restrictionLabel(value) {
	return restrictionOptions.find((option) => option.value === value)?.label || value;
}

function demandLabel(score) {
	if (score >= 80) return 'Peak demand';
	if (score >= 60) return 'Strong demand';
	if (score >= 40) return 'Steady demand';
	return 'Low demand';
}

function demandTone(score) {
	if (score >= 80) return 'success';
	if (score >= 60) return 'primary';
	if (score >= 40) return 'warning';
	return 'neutral';
}

function statusTone(status) {
	return {
		available: 'success',
		hold: 'warning',
		blocked: 'danger',
	}[status] || 'neutral';
}

function statusLabel(status) {
	return {
		available: 'Open',
		hold: 'Hold',
		blocked: 'Blocked',
	}[status] || status;
}

function cellClass(cell) {
	const day = dayFor(cell.value);
	if (!day) return '';
	if (cell.value === selectedDate.value) return 'bg-primary/10 ring-2 ring-inset ring-primary/45';
	if (day.status === 'blocked') return 'bg-destructive/5';
	if (day.status === 'hold') return 'bg-warning/10';
	return '';
}

function publishChanges() {
	publishedMessage.value = `Published ${changedFields.value.length || 1} update${changedFields.value.length === 1 ? '' : 's'} for ${selectedDate.value}`;
	publishDialogOpen.value = false;
}
</script>

<template>
	<section class="min-h-screen bg-canvas p-4 text-canvas-fg sm:p-6 lg:p-8" data-testid="availability-pricing-calendar-block">
		<div class="mx-auto flex w-full max-w-7xl flex-col gap-5">
			<header class="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
				<div class="space-y-3">
					<div class="flex flex-wrap items-center gap-2">
						<DomStatusPill tone="success" label="Inventory live" />
						<DomBadge tone="primary" variant="outline">12 channel updates queued</DomBadge>
						<span class="text-xs font-medium text-muted-fg">Last synced 8 minutes ago</span>
					</div>
					<div>
						<h1 class="text-2xl font-bold tracking-tight text-canvas-fg sm:text-3xl">Availability pricing calendar</h1>
						<p class="mt-2 max-w-3xl text-sm leading-6 text-muted-fg">
							Adjust booking inventory with demand signals, minimum-stay rules, blocked dates, and channel publishing in one calendar-led workflow.
						</p>
					</div>
				</div>

				<div class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-2xl border border-border skin-card p-4">
						<p class="text-xs font-semibold uppercase text-muted-fg">Projected month</p>
						<p class="mt-2 text-2xl font-bold">{{ projectedRevenue }}</p>
					</div>
					<div class="rounded-2xl border border-border skin-card p-4">
						<p class="text-xs font-semibold uppercase text-muted-fg">Occupancy</p>
						<p class="mt-2 text-2xl font-bold">{{ activeListing.occupancy }}</p>
					</div>
					<div class="rounded-2xl border border-border skin-card p-4">
						<p class="text-xs font-semibold uppercase text-muted-fg">Selected demand</p>
						<p class="mt-2 text-2xl font-bold">{{ selectedDay.demand }}%</p>
					</div>
				</div>
			</header>

			<div class="rounded-3xl border border-border skin-popover p-3 shadow-sm sm:p-4">
				<div class="grid gap-4 xl:grid-cols-[minmax(18rem,24rem)_1fr_auto] xl:items-end">
					<DomListbox
						v-model="selectedListing"
						label="Listing"
						:options="listings"
					>
						<template #option="{ option }">
							<span class="flex min-w-0 items-center justify-between gap-3">
								<span class="min-w-0">
									<span class="block truncate font-semibold">{{ option.label }}</span>
									<span class="block truncate text-xs opacity-75">{{ option.description }}</span>
								</span>
								<span class="shrink-0 rounded-full bg-canvas/75 px-2 py-1 text-[11px] font-semibold">
									{{ option.revenue }}
								</span>
							</span>
						</template>
					</DomListbox>

					<DomToggleButtonGroup
						v-model="mode"
						label="Calendar mode"
						:options="modes"
						size="sm"
					/>

					<div class="flex flex-wrap items-center gap-2 xl:justify-end">
						<DomButton variant="secondary" @click="publishedMessage = 'Imported partner holds for July'">Import holds</DomButton>
						<DomButton @click="publishDialogOpen = true">Review publish</DomButton>
					</div>
				</div>
			</div>

			<div class="rounded-3xl border border-border bg-canvas p-3 shadow-sm sm:p-4">
				<DomMonthCalendar
					start-date="2026-07-01"
					:months="2"
					:clickable="true"
					:fixed-weeks="true"
					:day-class="cellClass"
					@day-click="onDayClick"
				>
					<template #month-header="{ month }">
						<span>{{ month.value === '2026-07' ? 'Event weekend and owner holds visible' : 'Early August rate lift active' }}</span>
					</template>

					<template #default="{ cell }">
						<div v-if="dayFor(cell.value)" class="flex h-full min-h-[6.5rem] flex-col gap-2">
							<div class="flex items-center justify-between gap-2">
								<span class="text-lg font-bold">GBP {{ dayFor(cell.value).price }}</span>
								<span
									class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
									:class="{
										'bg-success/15 text-success': dayFor(cell.value).status === 'available',
										'bg-warning/20 text-warning-fg': dayFor(cell.value).status === 'hold',
										'bg-destructive/15 text-destructive': dayFor(cell.value).status === 'blocked',
									}"
								>
									{{ statusLabel(dayFor(cell.value).status) }}
								</span>
							</div>
							<div class="mt-auto space-y-2">
								<div class="h-1.5 overflow-hidden rounded-full bg-secondary">
									<div
										class="h-full rounded-full"
										:class="{
											'bg-success': dayFor(cell.value).demand >= 80,
											'bg-primary': dayFor(cell.value).demand >= 60 && dayFor(cell.value).demand < 80,
											'bg-warning': dayFor(cell.value).demand < 60,
										}"
										:style="{ width: `${dayFor(cell.value).demand}%` }"
									></div>
								</div>
								<div class="flex items-center justify-between text-xs text-muted-fg">
									<span>{{ demandLabel(dayFor(cell.value).demand) }}</span>
									<span>{{ dayFor(cell.value).minStay }} night min</span>
								</div>
							</div>
						</div>
						<div v-else class="text-xs text-muted-fg">No inventory</div>
					</template>
				</DomMonthCalendar>
			</div>

			<form class="grid gap-4 rounded-3xl border border-border skin-popover p-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end" @submit.prevent="publishDialogOpen = true">
				<div class="space-y-2">
					<p class="text-xs font-semibold uppercase text-muted-fg">Selected date</p>
					<div class="flex flex-wrap items-center gap-2">
						<strong class="text-lg">{{ selectedDate }}</strong>
						<DomStatusPill :tone="demandTone(selectedDay.demand)" :label="selectedDayDemandLabel" />
					</div>
					<p class="text-sm text-muted-fg">{{ activeListing.label }} · {{ selectedRestrictionLabels }}</p>
				</div>

				<DomRangeInput
					v-model="nightlyPrice"
					label="Nightly price"
					:min="90"
					:max="340"
					:step="1"
					suffix=" GBP"
				/>

				<div class="grid gap-3 sm:grid-cols-2">
					<DomListbox
						v-model="availability"
						label="Availability"
						:options="availabilityOptions"
					>
						<template #option="{ option }">
							<span class="flex items-center justify-between gap-3">
								<span>
									<span class="block font-semibold">{{ option.label }}</span>
									<span class="block text-xs opacity-75">{{ option.description }}</span>
								</span>
							</span>
						</template>
					</DomListbox>

					<DomRangeInput
						v-model="minimumStay"
						label="Minimum stay"
						:min="1"
						:max="7"
						:step="1"
						suffix=" nights"
					/>
				</div>

				<div class="flex flex-col gap-2">
					<DomButton type="submit">Publish update</DomButton>
					<p class="text-xs text-muted-fg">{{ publishedMessage }}</p>
				</div>

				<div class="lg:col-span-4">
					<DomTagCombobox
						v-model="restrictions"
						label="Restrictions"
						placeholder="Add rule"
						:options="restrictionOptions"
						:clearable="true"
					>
						<template #item="{ item }">
							<span class="block">
								<span class="block font-medium">{{ item.label }}</span>
								<span class="block text-xs text-muted-fg">{{ item.description }}</span>
							</span>
						</template>
					</DomTagCombobox>
				</div>
			</form>
		</div>

		<DomDialog
			v-model="publishDialogOpen"
			title="Publish availability update"
			description="Review the date rule before sending it to booking channels."
		>
			<div class="space-y-4 text-sm">
				<div class="rounded-2xl border border-border bg-secondary/35 p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="font-semibold text-canvas-fg">{{ activeListing.label }} · {{ selectedDate }}</p>
							<p class="mt-1 text-muted-fg">GBP {{ nightlyPrice }} · {{ minimumStay }} night minimum · {{ selectedAvailabilityOption.label }}</p>
						</div>
						<DomStatusPill :tone="statusTone(availability)" :label="selectedAvailabilityOption.label" />
					</div>
				</div>
				<div>
					<p class="text-xs font-semibold uppercase text-muted-fg">Changed fields</p>
					<div class="mt-2 flex flex-wrap gap-2">
						<DomBadge
							v-for="field in changedFields.length ? changedFields : ['reviewed']"
							:key="field"
							tone="primary"
							variant="outline"
						>
							{{ field }}
						</DomBadge>
					</div>
				</div>
				<p class="leading-6 text-muted-fg">
					In production, this action should call your rule validation endpoint, reserve the updated inventory version, then publish to each external channel with an auditable sync result.
				</p>
			</div>

			<template #footer>
				<DomButton variant="secondary" data-close>Cancel</DomButton>
				<DomButton @click="publishChanges">Publish rule</DomButton>
			</template>
		</DomDialog>
	</section>
</template>
