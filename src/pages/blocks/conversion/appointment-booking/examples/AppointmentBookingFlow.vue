<script setup>
import { computed, ref, watch } from 'vue';
import { DomButton, DomCalendar, DomEmailInput, DomNativeSelect, DomTextareaInput, DomTextInput } from '@getdom/studio/vue';

const meetingTypes = [
	{
		id: 'discovery',
		name: 'Product discovery',
		duration: 30,
		description: 'Share goals and get a recommended next step.',
		accent: 'Qualification',
		host: 'Maya Chen',
	},
	{
		id: 'implementation',
		name: 'Implementation planning',
		duration: 45,
		description: 'Map requirements, data, and rollout risks.',
		accent: 'Technical plan',
		host: 'Elliot Grant',
	},
	{
		id: 'success',
		name: 'Customer success review',
		duration: 60,
		description: 'Review outcomes, usage, blockers, and expansion plans.',
		accent: 'Account growth',
		host: 'Priya Shah',
	},
];

const availabilityByType = {
	discovery: {
		'2026-06-16': [
			{ value: '09:00', status: 'busy', reason: 'Team standup' },
			{ value: '09:30', status: 'available' },
			{ value: '10:00', status: 'available' },
			{ value: '11:30', status: 'busy', reason: 'Customer call' },
			{ value: '14:00', status: 'available' },
			{ value: '15:30', status: 'busy', reason: 'Held' },
		],
		'2026-06-17': [
			{ value: '09:00', status: 'available' },
			{ value: '10:30', status: 'busy', reason: 'Workshop' },
			{ value: '12:00', status: 'available' },
			{ value: '14:30', status: 'available' },
			{ value: '16:00', status: 'busy', reason: 'Internal review' },
		],
	},
	implementation: {
		'2026-06-16': [
			{ value: '09:00', status: 'busy', reason: 'Discovery call' },
			{ value: '09:30', status: 'available' },
			{ value: '10:30', status: 'busy', reason: 'Reserved' },
			{ value: '11:00', status: 'available' },
			{ value: '13:30', status: 'available' },
			{ value: '14:00', status: 'busy', reason: 'Launch review' },
			{ value: '15:30', status: 'available' },
			{ value: '16:00', status: 'busy', reason: 'Held' },
		],
		'2026-06-18': [
			{ value: '09:00', status: 'available' },
			{ value: '09:30', status: 'busy', reason: 'Partner sync' },
			{ value: '10:30', status: 'available' },
			{ value: '11:30', status: 'available' },
			{ value: '14:00', status: 'busy', reason: 'Booked' },
			{ value: '15:00', status: 'available' },
		],
	},
	success: {
		'2026-06-16': [
			{ value: '09:00', status: 'available' },
			{ value: '10:00', status: 'busy', reason: 'QBR' },
			{ value: '11:00', status: 'busy', reason: 'QBR' },
			{ value: '13:00', status: 'available' },
			{ value: '14:30', status: 'available' },
			{ value: '16:00', status: 'busy', reason: 'Held' },
		],
		'2026-06-19': [
			{ value: '09:30', status: 'busy', reason: 'Booked' },
			{ value: '10:30', status: 'available' },
			{ value: '12:00', status: 'available' },
			{ value: '15:00', status: 'busy', reason: 'Account review' },
			{ value: '16:30', status: 'available' },
		],
	},
};

const regions = [
	{ value: 'Europe/London', label: 'Europe / London' },
	{ value: 'America/New_York', label: 'America / New York' },
	{ value: 'America/Los_Angeles', label: 'America / Los Angeles' },
	{ value: 'Asia/Singapore', label: 'Asia / Singapore' },
];

const steps = [
	{ id: 'type', label: 'Type' },
	{ id: 'time', label: 'Time' },
	{ id: 'details', label: 'Details' },
	{ id: 'done', label: 'Booked' },
];

const selectedMeetingTypeId = ref('');
const selectedDate = ref('2026-06-16');
const selectedTime = ref('');
const selectedRegion = ref('Europe/London');
const activeStep = ref(0);
const slideDirection = ref('forward');
const bookingConfirmed = ref(false);
const attendee = ref({
	name: '',
	email: '',
	company: '',
	notes: '',
});

const selectedMeetingType = computed(() => meetingTypes.find((type) => type.id === selectedMeetingTypeId.value) || null);
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
const availableDateValues = computed(() => availableDatesForType(selectedMeetingTypeId.value));
const selectedAvailability = computed(() => availabilityByType[selectedMeetingTypeId.value]?.[selectedDate.value] || []);
const selectedSlot = computed(() => selectedAvailability.value.find((slot) => slot.value === selectedTime.value) || null);
const availableSlotCount = computed(() => selectedAvailability.value.filter((slot) => slot.status === 'available').length);
const attendeeComplete = computed(() => Boolean(attendee.value.name.trim() && isValidEmail(attendee.value.email)));
const canContinueFromType = computed(() => Boolean(selectedMeetingType.value));
const canContinueFromTime = computed(() => Boolean(selectedDate.value && selectedSlot.value?.status === 'available'));
const canBook = computed(() => Boolean(canContinueFromType.value && canContinueFromTime.value && attendeeComplete.value));
const confirmationLabel = computed(() => selectedTime.value ? `${selectedDateLabel.value} at ${selectedTime.value}` : 'Slot not selected');
const stepTitle = computed(() => steps[activeStep.value]?.label || '');
const nextDisabled = computed(() => {
	if (activeStep.value === 0) return !canContinueFromType.value;
	if (activeStep.value === 1) return !canContinueFromTime.value;
	if (activeStep.value === 2) return !canBook.value;
	return false;
});
const bookingRequest = computed(() => ({
	meetingTypeId: selectedMeetingType.value?.id || '',
	host: selectedMeetingType.value?.host || '',
	startsAt: selectedDate.value && selectedTime.value ? `${selectedDate.value}T${selectedTime.value}:00` : '',
	durationMinutes: selectedMeetingType.value?.duration || 0,
	timezone: selectedRegion.value,
	attendee: { ...attendee.value },
	status: bookingConfirmed.value ? 'confirmed' : 'draft',
}));
const bookingRequestJson = computed(() => JSON.stringify(bookingRequest.value, null, 2));

watch([selectedMeetingTypeId, selectedDate], () => {
	if (selectedSlot.value?.status !== 'available') selectedTime.value = '';
	bookingConfirmed.value = false;
});

function parseIsoDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
	return date;
}

function isValidEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function availableDatesForType(typeId) {
	return Object.entries(availabilityByType[typeId] || {})
		.filter(([, slots]) => slots.some((slot) => slot.status === 'available'))
		.map(([date]) => date);
}

function selectMeetingType(id) {
	const dates = availableDatesForType(id);
	selectedMeetingTypeId.value = id;
	if (!dates.includes(selectedDate.value)) selectedDate.value = dates[0] || '';
	selectedTime.value = '';
	bookingConfirmed.value = false;
	goToStep(1);
}

function selectTime(slot) {
	if (slot.status !== 'available') return;
	selectedTime.value = slot.value;
	bookingConfirmed.value = false;
}

function goToStep(index) {
	const next = Math.min(Math.max(index, 0), steps.length - 1);
	slideDirection.value = next >= activeStep.value ? 'forward' : 'back';
	activeStep.value = next;
}

function goBack() {
	goToStep(activeStep.value - 1);
}

function goForward() {
	if (nextDisabled.value) return;
	if (activeStep.value === 2) {
		confirmBooking();
		return;
	}
	goToStep(activeStep.value + 1);
}

function onDateChange(value) {
	selectedDate.value = value;
	selectedTime.value = '';
	bookingConfirmed.value = false;
}

function resetBooking() {
	selectedMeetingTypeId.value = '';
	selectedTime.value = '';
	attendee.value = {
		name: '',
		email: '',
		company: '',
		notes: '',
	};
	bookingConfirmed.value = false;
	goToStep(0);
}

function editTime() {
	goToStep(1);
}

function editDetails() {
	goToStep(2);
}

function slotStateLabel(slot) {
	if (slot.status === 'available') return 'Free';
	return slot.reason || 'Busy';
}

function slotButtonClasses(slot) {
	if (slot.value === selectedTime.value && slot.status === 'available') {
		return 'border-primary bg-primary text-primary-fg shadow-sm';
	}
	if (slot.status === 'available') {
		return 'border-border bg-canvas text-canvas-fg hover:border-primary/50 hover:bg-secondary/60';
	}
	return 'cursor-not-allowed border-border bg-secondary/70 text-muted-fg opacity-70';
}

function setExampleDetails() {
	attendee.value = {
		name: 'Alex Morgan',
		email: 'alex@example.com',
		company: 'Northstar Labs',
		notes: 'We want to understand implementation steps and launch timing for a team workspace.',
	};
}

function confirmBooking() {
	if (!canBook.value) return;
	bookingConfirmed.value = true;
	goToStep(3);
}
</script>

<template>
	<section class="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center bg-canvas p-4 text-canvas-fg sm:p-6">
		<div class="w-full overflow-hidden rounded-lg border border-border bg-canvas shadow-xl">
			<header class="border-b border-border skin-card px-5 py-5 sm:px-6">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-fg">Scheduling</p>
						<h3 class="mt-2 text-2xl font-semibold tracking-tight">Book an implementation call</h3>
						<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">
							Select a meeting type, compare live availability, and complete the booking once the required details are ready.
						</p>
					</div>
					<div class="rounded-lg border border-border bg-canvas px-4 py-3 text-sm">
						<p class="font-semibold">{{ selectedMeetingType?.host || 'Host assigned after type' }}</p>
						<p class="mt-1 text-muted-fg">
							{{ selectedMeetingType ? `${selectedMeetingType.duration} minute appointment` : 'Choose an appointment type' }}
						</p>
					</div>
				</div>

				<ol class="mt-5 grid gap-2 sm:grid-cols-4" aria-label="Booking progress">
					<li v-for="(step, index) in steps" :key="step.id">
						<button
							type="button"
							class="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition"
							:class="[
								index === activeStep && 'border-primary bg-primary text-primary-fg',
								index < activeStep && 'border-border bg-secondary text-canvas-fg',
								index > activeStep && 'border-border bg-canvas text-muted-fg',
								index <= activeStep ? 'hover:border-primary/50' : 'cursor-default opacity-70',
							]"
							:disabled="index > activeStep || activeStep === 3"
							@click="goToStep(index)"
						>
							<span class="grid size-6 shrink-0 place-items-center rounded-full bg-current/10 text-xs font-semibold">
								{{ index + 1 }}
							</span>
							<span class="min-w-0 truncate font-medium">{{ step.label }}</span>
						</button>
					</li>
				</ol>
			</header>

			<div class="grid min-h-[36rem] lg:grid-cols-[minmax(0,1fr)_20rem]">
				<main class="min-w-0 overflow-hidden p-5 sm:p-6">
					<Transition :name="slideDirection === 'forward' ? 'booking-slide-forward' : 'booking-slide-back'" mode="out-in">
						<div :key="stepTitle" class="min-w-0">
							<div v-if="activeStep === 0" class="grid gap-3 md:grid-cols-3">
								<button
									v-for="type in meetingTypes"
									:key="type.id"
									type="button"
									class="min-h-44 rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
									:class="type.id === selectedMeetingTypeId ? 'border-primary bg-primary text-primary-fg shadow-md' : 'border-border bg-canvas'"
									@click="selectMeetingType(type.id)"
								>
									<div class="flex items-start justify-between gap-3">
										<p class="text-xs font-semibold uppercase tracking-[0.14em]" :class="type.id === selectedMeetingTypeId ? 'text-primary-fg/70' : 'text-muted-fg'">
											{{ type.accent }}
										</p>
										<span class="rounded-full border px-2 py-0.5 text-xs font-semibold" :class="type.id === selectedMeetingTypeId ? 'border-primary-fg/30 text-primary-fg' : 'border-border text-muted-fg'">
											{{ type.duration }}m
										</span>
									</div>
									<h4 class="mt-7 text-lg font-semibold tracking-tight">{{ type.name }}</h4>
									<p class="mt-2 text-sm leading-6" :class="type.id === selectedMeetingTypeId ? 'text-primary-fg/75' : 'text-muted-fg'">
										{{ type.description }}
									</p>
									<p class="mt-5 text-sm font-medium">{{ type.host }}</p>
								</button>
							</div>

							<div v-else-if="activeStep === 1" class="grid gap-5 xl:grid-cols-[minmax(20rem,1fr)_18rem]">
								<section class="min-w-0 rounded-lg border border-border bg-canvas p-4">
									<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
										<div>
											<h4 class="font-semibold tracking-tight">Choose a date</h4>
											<p class="mt-1 text-sm leading-6 text-muted-fg">{{ selectedMeetingType?.name }} with {{ selectedMeetingType?.host }}</p>
										</div>
										<DomNativeSelect
											v-model="selectedRegion"
											:options="regions"
											placeholder=""
											class="w-full sm:w-56"
										/>
									</div>
									<div v-if="availableDateValues.length" class="mt-4 min-w-[18rem] overflow-hidden rounded-lg border border-border">
										<DomCalendar
											:model-value="selectedDate"
											:min="'2026-06-10'"
											:max="'2026-07-31'"
											:enabled-dates="availableDateValues"
											:initial-month="6"
											:initial-year="2026"
											:register-field="false"
											:native-input="false"
											@update:model-value="onDateChange"
										/>
									</div>
									<div v-else class="mt-4 rounded-lg border border-dashed border-border bg-secondary/60 p-4 text-sm leading-6 text-muted-fg">
										No bookable days are available for this appointment type.
									</div>
								</section>

								<section class="rounded-lg border border-border bg-canvas p-4">
									<div class="flex items-start justify-between gap-3">
										<div>
											<h4 class="font-semibold tracking-tight">Available times</h4>
											<p class="mt-1 text-sm leading-6 text-muted-fg">{{ selectedDateLabel }}</p>
										</div>
										<span class="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-muted-fg">
											{{ availableSlotCount }} free
										</span>
									</div>

									<div v-if="selectedAvailability.length" class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-1">
										<button
											v-for="slot in selectedAvailability"
											:key="slot.value"
											type="button"
											class="flex min-h-12 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none"
											:class="slotButtonClasses(slot)"
											:disabled="slot.status !== 'available'"
											:aria-pressed="slot.value === selectedTime"
											@click="selectTime(slot)"
										>
											<span>{{ slot.value }}</span>
											<span class="text-xs font-medium opacity-75">{{ slotStateLabel(slot) }}</span>
										</button>
									</div>
									<div v-else class="mt-4 rounded-lg border border-dashed border-border bg-secondary/60 p-4 text-sm leading-6 text-muted-fg">
										No provider slots are published for this date.
									</div>
								</section>
							</div>

							<div v-else-if="activeStep === 2" class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
								<section class="rounded-lg border border-border bg-canvas p-4">
									<div class="grid gap-4 md:grid-cols-2">
										<DomTextInput v-model="attendee.name" label="Your name" autocomplete="name" placeholder="Full name" />
										<DomEmailInput v-model="attendee.email" label="Work email" />
										<DomTextInput v-model="attendee.company" label="Company" autocomplete="organization" placeholder="Company name" />
										<button
											type="button"
											class="rounded-lg border border-dashed border-border bg-secondary/60 p-3 text-left text-sm transition hover:border-primary/50 hover:bg-secondary"
											@click="setExampleDetails"
										>
											<span class="font-semibold text-canvas-fg">Use sample invitee</span>
											<span class="mt-1 block leading-6 text-muted-fg">Alex Morgan, alex@example.com</span>
										</button>
										<DomTextareaInput
											v-model="attendee.notes"
											label="What should we prepare?"
											placeholder="Goals, constraints, current stack, or questions"
											:rows="5"
											class="md:col-span-2"
										/>
									</div>
								</section>

								<section class="rounded-lg border border-border bg-canvas p-4">
									<h4 class="font-semibold tracking-tight">Ready to book</h4>
									<div class="mt-4 grid gap-3 text-sm">
										<div class="rounded-lg border border-border bg-secondary/50 p-3">
											<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Appointment</p>
											<p class="mt-1 font-semibold">{{ selectedMeetingType?.name }}</p>
											<p class="text-muted-fg">{{ selectedMeetingType?.duration }} minutes</p>
										</div>
										<div class="rounded-lg border border-border bg-secondary/50 p-3">
											<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">When</p>
											<p class="mt-1 font-semibold">{{ confirmationLabel }}</p>
											<p class="text-muted-fg">{{ selectedRegionLabel }}</p>
										</div>
									</div>
									<p v-if="!canBook" class="mt-4 rounded-lg bg-warning/15 p-3 text-sm font-medium leading-6 text-warning-fg">
										Add a valid name, email, and available slot to enable confirmation.
									</p>
								</section>
							</div>

							<div v-else class="mx-auto max-w-2xl rounded-lg border border-border bg-canvas p-5 text-center">
								<div class="mx-auto grid size-12 place-items-center rounded-full bg-success/15 text-success">
									<svg viewBox="0 0 24 24" class="size-6" fill="none" aria-hidden="true">
										<path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								</div>
								<h4 class="mt-4 text-xl font-semibold tracking-tight">Booking confirmed</h4>
								<p class="mt-2 text-sm leading-6 text-muted-fg">
									{{ selectedMeetingType?.name }} with {{ selectedMeetingType?.host }} is booked for {{ confirmationLabel }}.
								</p>
								<pre class="mt-5 overflow-auto rounded-lg border border-border bg-secondary/50 p-3 text-left text-xs leading-5 text-muted-fg"><code>{{ bookingRequestJson }}</code></pre>
								<DomButton variant="secondary" class="mt-5" @click="resetBooking">Book another appointment</DomButton>
							</div>
						</div>
					</Transition>
				</main>

				<aside class="border-t border-border bg-secondary/35 p-5 lg:border-l lg:border-t-0">
					<div class="rounded-lg border border-border bg-canvas p-4">
						<div class="flex items-start gap-3">
							<div class="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
								<svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
									<path d="M7 4v3M17 4v3M5 8h14M6 6h12v13H6V6Zm4 7h4M10 16h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
							</div>
							<div>
								<h4 class="font-semibold tracking-tight">Booking summary</h4>
								<p class="mt-1 text-sm leading-6 text-muted-fg">{{ selectedMeetingType?.duration || '--' }} minute call</p>
							</div>
						</div>

						<div class="mt-5 grid gap-3 text-sm">
							<div class="rounded-lg border border-border bg-secondary/50 p-3">
								<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Type</p>
								<p class="mt-1 font-semibold">{{ selectedMeetingType?.name || 'Not selected' }}</p>
								<p class="text-muted-fg">{{ selectedMeetingType?.host || 'Choose type first' }}</p>
							</div>
							<div class="rounded-lg border border-border bg-secondary/50 p-3">
								<div class="flex items-start justify-between gap-2">
									<div>
										<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">When</p>
										<p class="mt-1 font-semibold">{{ confirmationLabel }}</p>
										<p class="text-muted-fg">{{ selectedRegionLabel }}</p>
									</div>
									<button
										v-if="selectedMeetingType"
										type="button"
										class="rounded-md px-2 py-1 text-xs font-semibold text-muted-fg transition hover:bg-canvas hover:text-canvas-fg"
										@click="editTime"
									>
										Edit
									</button>
								</div>
							</div>
							<div class="rounded-lg border border-border bg-secondary/50 p-3">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0">
										<p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-fg">Invitee</p>
										<p class="mt-1 truncate font-semibold">{{ attendee.name || 'Name required' }}</p>
										<p class="truncate text-muted-fg">{{ attendee.email || 'Email required' }}</p>
									</div>
									<button
										v-if="canContinueFromTime"
										type="button"
										class="rounded-md px-2 py-1 text-xs font-semibold text-muted-fg transition hover:bg-canvas hover:text-canvas-fg"
										@click="editDetails"
									>
										Edit
									</button>
								</div>
							</div>
						</div>
					</div>
				</aside>
			</div>

			<footer v-if="activeStep < 3" class="flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<DomButton variant="secondary" :disabled="activeStep === 0" @click="goBack">
					<svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path d="m15 18-6-6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					Back
				</DomButton>
				<DomButton :disabled="nextDisabled" @click="goForward">
					{{ activeStep === 2 ? 'Confirm booking' : 'Continue' }}
					<svg v-if="activeStep < 2" viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
						<path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</DomButton>
			</footer>
		</div>
	</section>
</template>

<style scoped>
.booking-slide-forward-enter-active,
.booking-slide-forward-leave-active,
.booking-slide-back-enter-active,
.booking-slide-back-leave-active {
	transition:
		opacity 180ms ease,
		transform 180ms ease;
}

.booking-slide-forward-enter-from,
.booking-slide-back-leave-to {
	opacity: 0;
	transform: translateX(1.5rem);
}

.booking-slide-forward-leave-to,
.booking-slide-back-enter-from {
	opacity: 0;
	transform: translateX(-1.5rem);
}
</style>
