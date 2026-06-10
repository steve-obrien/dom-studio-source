<script setup>
import { computed, ref } from 'vue';
import { DomButton, DomCalendar, DomCard, DomEmailInput, DomNativeSelect, DomTextareaInput, DomTextInput } from '../../../lib/vue';

const meetingTypes = [
	{
		id: 'discovery',
		name: 'Product discovery',
		duration: 30,
		description: 'Share goals and get a recommended next step.',
		host: 'Maya Chen',
	},
	{
		id: 'implementation',
		name: 'Implementation planning',
		duration: 45,
		description: 'Map requirements, data, and rollout risks.',
		host: 'Elliot Grant',
	},
	{
		id: 'success',
		name: 'Customer success review',
		duration: 60,
		description: 'Review outcomes, usage, blockers, and expansion plans.',
		host: 'Priya Shah',
	},
];

const timeSlots = [
	{ value: '09:00', label: '09:00' },
	{ value: '09:30', label: '09:30' },
	{ value: '10:30', label: '10:30' },
	{ value: '11:00', label: '11:00' },
	{ value: '13:30', label: '13:30' },
	{ value: '14:00', label: '14:00' },
	{ value: '15:30', label: '15:30' },
	{ value: '16:00', label: '16:00' },
];

const regions = [
	{ value: 'Europe/London', label: 'Europe / London' },
	{ value: 'America/New_York', label: 'America / New York' },
	{ value: 'America/Los_Angeles', label: 'America / Los Angeles' },
	{ value: 'Asia/Singapore', label: 'Asia / Singapore' },
];

const selectedMeetingTypeId = ref('implementation');
const selectedDate = ref('2026-06-16');
const selectedTime = ref('10:30');
const selectedRegion = ref('Europe/London');
const bookingConfirmed = ref(false);
const attendee = ref({
	name: 'Alex Morgan',
	email: 'alex@example.com',
	company: 'Northstar Labs',
	notes: 'We want to understand implementation steps and launch timing for a team workspace.',
});

const selectedMeetingType = computed(() => meetingTypes.find((type) => type.id === selectedMeetingTypeId.value) || meetingTypes[0]);
const selectedRegionLabel = computed(() => regions.find((region) => region.value === selectedRegion.value)?.label || selectedRegion.value);
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
	weekday: 'long',
	day: 'numeric',
	month: 'long',
	year: 'numeric',
});
const selectedDateLabel = computed(() => {
	const date = parseIsoDate(selectedDate.value);
	return date ? dateFormatter.format(date) : 'Choose a date';
});
const canBook = computed(() => Boolean(attendee.value.name && attendee.value.email && selectedDate.value && selectedTime.value));
const confirmationLabel = computed(() => `${selectedDateLabel.value} at ${selectedTime.value}`);

function parseIsoDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
	return date;
}

function selectMeetingType(id) {
	selectedMeetingTypeId.value = id;
	bookingConfirmed.value = false;
}

function selectTime(value) {
	selectedTime.value = value;
	bookingConfirmed.value = false;
}

function confirmBooking() {
	if (!canBook.value) return;
	bookingConfirmed.value = true;
}
</script>

<template>
	<div class="w-full max-w-6xl overflow-hidden rounded-3xl border border-border bg-background text-fg shadow-2xl shadow-black/10">
		<header class="border-b border-border skin-raised px-5 py-5 sm:px-7">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Scheduling</p>
					<h3 class="mt-2 text-2xl font-semibold tracking-tight">Book an implementation call</h3>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
						Let visitors choose a meeting type, available date, time, and attendee details without leaving the product.
					</p>
				</div>
				<div class="rounded-2xl border border-border bg-background px-4 py-3 text-sm">
					<p class="font-semibold">{{ selectedMeetingType.host }}</p>
					<p class="mt-1 text-muted-fg">Host assigned for {{ selectedMeetingType.duration }} minutes</p>
				</div>
			</div>
		</header>

		<div class="grid gap-5 p-5 sm:p-7 xl:grid-cols-[18rem_minmax(0,1fr)_21rem]">
			<aside class="grid content-start gap-3">
				<button
					v-for="type in meetingTypes"
					:key="type.id"
					type="button"
					class="rounded-2xl border p-4 text-left transition hover:border-primary/50 hover:bg-secondary/70"
					:class="type.id === selectedMeetingTypeId ? 'border-primary bg-primary/10' : 'border-border bg-background'"
					@click="selectMeetingType(type.id)"
				>
					<div class="flex items-start justify-between gap-3">
						<h4 class="font-semibold tracking-tight">{{ type.name }}</h4>
						<span class="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-fg">{{ type.duration }}m</span>
					</div>
					<p class="mt-2 text-sm leading-6 text-muted-fg">{{ type.description }}</p>
				</button>
			</aside>

			<main class="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
				<DomCard padding="lg" class="min-w-0">
					<div class="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h4 class="font-semibold tracking-tight">Choose a date</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">Keep the date picker in the flow so users can compare days quickly.</p>
						</div>
						<DomNativeSelect v-model="selectedRegion" :options="regions" class="w-full sm:w-56" />
					</div>
					<div class="mt-5 overflow-hidden rounded-2xl border border-border">
						<DomCalendar
							v-model="selectedDate"
							:min="'2026-06-10'"
							:max="'2026-07-31'"
							:initial-month="6"
							:initial-year="2026"
							:register-field="false"
							:native-input="false"
						/>
					</div>
				</DomCard>

				<DomCard padding="lg">
					<h4 class="font-semibold tracking-tight">Available times</h4>
					<p class="mt-1 text-sm leading-6 text-muted-fg">{{ selectedDateLabel }}</p>
					<div class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
						<button
							v-for="slot in timeSlots"
							:key="slot.value"
							type="button"
							class="rounded-xl border px-3 py-2 text-sm font-semibold transition hover:border-primary/50"
							:class="slot.value === selectedTime ? 'border-primary bg-primary text-primary-fg' : 'border-border bg-background text-fg'"
							@click="selectTime(slot.value)"
						>
							{{ slot.label }}
						</button>
					</div>
				</DomCard>

				<DomCard padding="lg" class="lg:col-span-2">
					<div class="grid gap-4 md:grid-cols-2">
						<DomTextInput v-model="attendee.name" label="Your name" autocomplete="name" placeholder="Full name" />
						<DomEmailInput v-model="attendee.email" label="Work email" />
						<DomTextInput v-model="attendee.company" label="Company" autocomplete="organization" placeholder="Company name" />
						<div class="rounded-2xl border border-border bg-secondary/60 p-4">
							<p class="text-sm font-semibold">Calendar hold</p>
							<p class="mt-1 text-sm leading-6 text-muted-fg">
								{{ selectedMeetingType.name }} with {{ selectedMeetingType.host }} in {{ selectedRegionLabel }}.
							</p>
						</div>
						<DomTextareaInput
							v-model="attendee.notes"
							label="What should we prepare?"
							placeholder="Goals, constraints, current stack, or questions"
							:rows="4"
							class="md:col-span-2"
						/>
					</div>
				</DomCard>
			</main>

			<aside class="grid content-start gap-5">
				<DomCard padding="lg">
					<div class="flex items-start gap-3">
						<div class="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
							<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
								<path d="M7 4v3M17 4v3M5 8h14M6 6h12v13H6V6Zm4 7h4M10 16h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</div>
						<div>
							<h4 class="font-semibold tracking-tight">Booking summary</h4>
							<p class="mt-1 text-sm leading-6 text-muted-fg">{{ selectedMeetingType.duration }} minute call</p>
						</div>
					</div>

					<div class="mt-5 grid gap-3 text-sm">
						<div class="rounded-2xl border border-border bg-background p-3">
							<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">When</p>
							<p class="mt-1 font-semibold">{{ confirmationLabel }}</p>
						</div>
						<div class="rounded-2xl border border-border bg-background p-3">
							<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Invitee</p>
							<p class="mt-1 font-semibold">{{ attendee.name || 'Name required' }}</p>
							<p class="text-muted-fg">{{ attendee.email || 'Email required' }}</p>
						</div>
					</div>

					<DomButton class="mt-5 w-full" :disabled="!canBook" @click="confirmBooking">
						{{ bookingConfirmed ? 'Booking confirmed' : 'Confirm booking' }}
					</DomButton>
					<p v-if="bookingConfirmed" class="mt-3 rounded-2xl bg-success/15 p-3 text-sm font-medium leading-6 text-success">
						Invite created for {{ confirmationLabel }}. Send this payload to your scheduling API.
					</p>
				</DomCard>

				<DomCard padding="lg">
					<h4 class="font-semibold tracking-tight">Recommended wiring</h4>
					<ul class="mt-3 grid gap-2 text-sm leading-6 text-muted-fg">
						<li>Connect slots to provider availability.</li>
						<li>Create a tentative hold before payment or confirmation.</li>
						<li>Send a calendar invite and reminder emails after booking.</li>
					</ul>
				</DomCard>
			</aside>
		</div>
	</div>
</template>
