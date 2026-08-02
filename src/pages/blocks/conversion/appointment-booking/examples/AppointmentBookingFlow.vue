<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
	DomAlert,
	DomAvatar,
	DomBadge,
	DomButton,
	DomCalendar,
	DomCheckbox,
	DomDialog,
	DomEmailInput,
	DomIconButton,
	DomRadioGroup,
	DomSelect,
	DomSkeleton,
	DomStatusPill,
	DomTextInput,
	DomTextareaInput,
} from '@getdom/studio/vue';

const API_BASE = '/api/block-demos/appointment-booking';
const clockIcon = 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
const videoIcon = 'M15 10 20 7v10l-5-3M4 6h11v12H4V6Z';
const calendarIcon = 'M7 3v4M17 3v4M4 9h16M5 5h14v15H5V5Z';
const checkIcon = 'm5 12 4 4L19 6';
const shieldIcon = 'M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Zm-3 9 2 2 4-4';
const arrowLeftIcon = 'm15 18-6-6 6-6';

const steps = Object.freeze([
	{ id: 'type', label: 'Appointment' },
	{ id: 'time', label: 'Date & time' },
	{ id: 'details', label: 'Your details' },
	{ id: 'confirmed', label: 'Confirmed' },
]);

const cancellationOptions = Object.freeze([
	{ value: 'schedule', label: 'My schedule changed', description: 'The selected time no longer works.' },
	{ value: 'resolved', label: 'I no longer need the meeting', description: 'The question or project was resolved.' },
	{ value: 'different-topic', label: 'I need a different appointment', description: 'I will choose another conversation type.' },
]);

const bootstrap = ref(null);
const availability = ref(null);
const activeStep = ref(0);
const selectedMeetingTypeId = ref('');
const selectedDate = ref('');
const selectedTimezone = ref('Europe/London');
const selectedSlotId = ref('');
const slotHold = ref(null);
const booking = ref(null);
const receipt = ref(null);
const feedback = ref(null);
const loadError = ref('');
const isLoading = ref(true);
const isLoadingAvailability = ref(false);
const isHolding = ref(false);
const isBooking = ref(false);
const isCancelling = ref(false);
const cancelDialogOpen = ref(false);
const cancellationReason = ref('schedule');
const consent = ref(false);
const attendee = ref({
	name: '',
	email: '',
	company: '',
	notes: '',
});

const meetingTypes = computed(() => bootstrap.value?.meetingTypes || []);
const meetingTypeOptions = computed(() => meetingTypes.value.map(toMeetingTypeOption));
const selectedMeetingType = computed(() => meetingTypes.value.find((meetingType) => meetingType.id === selectedMeetingTypeId.value) || null);
const availableDates = computed(() => bootstrap.value?.availableDates || []);
const selectedSlot = computed(() => availability.value?.slots?.find((slot) => slot.id === selectedSlotId.value) || null);
const selectedDateLabel = computed(() => formatDateLabel(selectedDate.value));
const selectedTimeLabel = computed(() => selectedSlot.value?.label || booking.value?.display?.time || 'Choose a time');
const currentStep = computed(() => steps[activeStep.value] || steps[0]);
const progressValue = computed(() => Math.round(((activeStep.value + 1) / steps.length) * 100));
const attendeeReady = computed(() => Boolean(attendee.value.name.trim() && isValidEmail(attendee.value.email)));
const canContinue = computed(() => {
	if (activeStep.value === 0) return Boolean(selectedMeetingType.value);
	if (activeStep.value === 1) return Boolean(selectedDate.value && selectedSlot.value?.status === 'available');
	if (activeStep.value === 2) return Boolean(slotHold.value && attendeeReady.value && consent.value);
	return false;
});
const primaryActionLabel = computed(() => {
	if (activeStep.value === 0) return 'Choose a time';
	if (activeStep.value === 1) return 'Reserve this time';
	return 'Confirm appointment';
});
const primaryActionLoading = computed(() => isLoadingAvailability.value || isHolding.value || isBooking.value);
const holdExpiryLabel = computed(() => slotHold.value?.expiresAt ? formatShortTime(slotHold.value.expiresAt, selectedTimezone.value) : '');
const initialCalendarMonth = computed(() => selectedDate.value ? Number(selectedDate.value.slice(5, 7)) : null);
const initialCalendarYear = computed(() => selectedDate.value ? Number(selectedDate.value.slice(0, 4)) : null);
const activeHost = computed(() => selectedMeetingType.value?.host || meetingTypes.value[0]?.host || null);

onMounted(loadBookingExperience);
watch([selectedMeetingTypeId, selectedDate, selectedTimezone], onAvailabilityInputChange);

/**
 * Convert a meeting-type API record into a rich DOM Studio radio option.
 *
 * @param {Record<string, unknown>} meetingType Meeting-type record.
 * @returns {Record<string, unknown>} Radio-group option.
 */
function toMeetingTypeOption(meetingType) {
	return {
		...meetingType,
		value: meetingType.id,
	};
}

/**
 * Load the booking configuration and initialize a useful first selection.
 *
 * @returns {Promise<void>}
 */
async function loadBookingExperience() {
	isLoading.value = true;
	loadError.value = '';
	try {
		bootstrap.value = await requestJson(`${API_BASE}/bootstrap`);
		const preferredType = bootstrap.value.meetingTypes.find((meetingType) => meetingType.popular) || bootstrap.value.meetingTypes[0];
		selectedMeetingTypeId.value = preferredType?.id || '';
		selectedDate.value = bootstrap.value.defaultDate;
		selectedTimezone.value = bootstrap.value.viewer.timezone;
		attendee.value.name = bootstrap.value.viewer.name;
		attendee.value.email = bootstrap.value.viewer.email;
	} catch (error) {
		loadError.value = error instanceof Error ? error.message : 'The booking experience could not be loaded.';
	} finally {
		isLoading.value = false;
	}
}

/**
 * Refresh availability when a selected scheduling input changes on the time step.
 *
 * @returns {void}
 */
function onAvailabilityInputChange() {
	selectedSlotId.value = '';
	feedback.value = null;
	if (activeStep.value === 1 && selectedMeetingTypeId.value && selectedDate.value) loadAvailability();
}

/**
 * Fetch server-resolved appointment slots for the current selection.
 *
 * @param {{ preserveSelection?: boolean }} [options={}] Refresh behavior.
 * @returns {Promise<void>}
 */
async function loadAvailability(options = {}) {
	const previousSlotId = options.preserveSelection ? selectedSlotId.value : '';
	isLoadingAvailability.value = true;
	try {
		const query = new URLSearchParams({
			meetingTypeId: selectedMeetingTypeId.value,
			date: selectedDate.value,
			timezone: selectedTimezone.value,
		});
		availability.value = await requestJson(`${API_BASE}/availability?${query}`);
		const preservedSlot = availability.value.slots.find((slot) => slot.id === previousSlotId && slot.status === 'available');
		selectedSlotId.value = preservedSlot?.id || '';
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Times unavailable',
			description: error instanceof Error ? error.message : 'Refresh the published availability and try again.',
		};
	} finally {
		isLoadingAvailability.value = false;
	}
}

/**
 * Select one available slot from the server response.
 *
 * @param {Record<string, unknown>} slot Availability slot.
 * @returns {void}
 */
function selectSlot(slot) {
	if (slot.status !== 'available') return;
	selectedSlotId.value = slot.id;
	feedback.value = null;
}

/**
 * Move the booking journey forward and perform the required API mutation.
 *
 * @returns {Promise<void>}
 */
async function continueFlow() {
	if (!canContinue.value || primaryActionLoading.value) return;
	if (activeStep.value === 0) {
		activeStep.value = 1;
		await loadAvailability();
		return;
	}
	if (activeStep.value === 1) {
		await createSlotHold();
		return;
	}
	if (activeStep.value === 2) await confirmBooking();
}

/**
 * Create an eight-minute server-side hold before collecting final details.
 *
 * @returns {Promise<void>}
 */
async function createSlotHold() {
	isHolding.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(`${API_BASE}/holds`, {
			method: 'POST',
			body: JSON.stringify({
				meetingTypeId: selectedMeetingTypeId.value,
				date: selectedDate.value,
				timezone: selectedTimezone.value,
				slotId: selectedSlotId.value,
				availabilityRevision: availability.value.revision,
			}),
		});
		slotHold.value = payload.hold;
		activeStep.value = 2;
		feedback.value = {
			tone: 'success',
			title: 'Time reserved',
			description: payload.message,
		};
	} catch (error) {
		if (error.payload?.availability) availability.value = error.payload.availability;
		selectedSlotId.value = '';
		feedback.value = {
			tone: 'warning',
			title: 'Choose another time',
			description: error instanceof Error ? error.message : 'Availability changed before the slot could be reserved.',
		};
	} finally {
		isHolding.value = false;
	}
}

/**
 * Confirm the appointment and store the immutable API receipt.
 *
 * @returns {Promise<void>}
 */
async function confirmBooking() {
	isBooking.value = true;
	feedback.value = null;
	try {
		const payload = await requestJson(`${API_BASE}/bookings`, {
			method: 'POST',
			body: JSON.stringify({
				holdId: slotHold.value.id,
				attendee: attendee.value,
				consent: consent.value,
			}),
		});
		booking.value = payload.booking;
		receipt.value = payload.receipt;
		slotHold.value = null;
		activeStep.value = 3;
		feedback.value = null;
	} catch (error) {
		feedback.value = {
			tone: error.payload?.code === 'hold_expired' ? 'warning' : 'danger',
			title: error.payload?.code === 'hold_expired' ? 'Time hold expired' : 'Appointment not confirmed',
			description: error instanceof Error ? error.message : 'Review your details and try again.',
		};
		if (error.payload?.code === 'hold_expired') {
			slotHold.value = null;
			activeStep.value = 1;
			await loadAvailability();
		}
	} finally {
		isBooking.value = false;
	}
}

/**
 * Move to the previous step and release a temporary slot hold when necessary.
 *
 * @returns {Promise<void>}
 */
async function goBack() {
	feedback.value = null;
	if (activeStep.value === 2 && slotHold.value) {
		await releaseSlotHold();
		activeStep.value = 1;
		await loadAvailability();
		return;
	}
	activeStep.value = Math.max(0, activeStep.value - 1);
}

/**
 * Release the current API hold without interrupting navigation recovery.
 *
 * @returns {Promise<void>}
 */
async function releaseSlotHold() {
	if (!slotHold.value) return;
	try {
		await requestJson(`${API_BASE}/holds/${encodeURIComponent(slotHold.value.id)}`, { method: 'DELETE' });
	} catch {
		// Expired holds are already released server-side, so navigation can continue.
	} finally {
		slotHold.value = null;
	}
}

/**
 * Cancel the confirmed appointment through the demo API.
 *
 * @returns {Promise<void>}
 */
async function cancelBooking() {
	if (!booking.value) return;
	isCancelling.value = true;
	try {
		const reason = cancellationOptions.find((option) => option.value === cancellationReason.value)?.label || cancellationReason.value;
		const payload = await requestJson(`${API_BASE}/bookings/${encodeURIComponent(booking.value.id)}/cancel`, {
			method: 'POST',
			body: JSON.stringify({ reason }),
		});
		booking.value = payload.booking;
		receipt.value = payload.receipt;
		cancelDialogOpen.value = false;
		feedback.value = {
			tone: 'info',
			title: 'Appointment cancelled',
			description: payload.message,
		};
	} catch (error) {
		feedback.value = {
			tone: 'danger',
			title: 'Cancellation failed',
			description: error instanceof Error ? error.message : 'Try cancelling again.',
		};
	} finally {
		isCancelling.value = false;
	}
}

/**
 * Start a fresh booking journey while leaving completed API history intact.
 *
 * @returns {void}
 */
function resetFlow() {
	activeStep.value = 0;
	booking.value = null;
	receipt.value = null;
	availability.value = null;
	selectedSlotId.value = '';
	feedback.value = null;
	consent.value = false;
	attendee.value.notes = '';
}

/**
 * Populate realistic attendee details for the interactive demo journey.
 *
 * @returns {void}
 */
function useExampleDetails() {
	attendee.value = {
		name: 'Alex Morgan',
		email: 'alex@northstar.tools',
		company: 'Northstar Labs',
		notes: 'We need a rollout plan for a multi-workspace implementation and two data integrations.',
	};
	consent.value = true;
}

/**
 * Request JSON and preserve structured API recovery data on errors.
 *
 * @param {string} url API path.
 * @param {RequestInit} [options={}] Fetch options.
 * @returns {Promise<Record<string, unknown>>} Parsed API payload.
 */
async function requestJson(url, options = {}) {
	const response = await fetch(url, {
		headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
		...options,
	});
	const payload = await response.json();
	if (!response.ok) {
		const error = new Error(payload.message || 'The scheduling request failed.');
		error.payload = payload;
		throw error;
	}
	return payload;
}

/**
 * Format an ISO date-only value for a scheduling heading.
 *
 * @param {string} value ISO date-only value.
 * @returns {string} Localized long date.
 */
function formatDateLabel(value) {
	if (!value) return 'Choose a date';
	return new Intl.DateTimeFormat('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
	}).format(new Date(`${value}T12:00:00`));
}

/**
 * Format an ISO instant as a compact time in the selected timezone.
 *
 * @param {string} value ISO instant.
 * @param {string} timezone IANA timezone.
 * @returns {string} Localized time.
 */
function formatShortTime(value, timezone) {
	return new Intl.DateTimeFormat('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: timezone,
	}).format(new Date(value));
}

/**
 * Check an attendee email address before enabling confirmation.
 *
 * @param {string} value Candidate email address.
 * @returns {boolean} Whether the address is structurally valid.
 */
function isValidEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}
</script>

<template>
	<section class="flex h-dvh min-h-[42rem] w-full flex-col overflow-hidden bg-canvas text-canvas-fg" data-testid="appointment-booking-block">
		<header class="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
			<div class="flex min-w-0 items-center gap-3">
				<div class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-fg">
					{{ bootstrap?.brand?.mark || 'N' }}
				</div>
				<div class="min-w-0">
					<p class="truncate text-sm font-semibold">{{ bootstrap?.brand?.name || 'Northstar Studio' }}</p>
					<p class="hidden text-xs text-muted-fg sm:block">Scheduling</p>
				</div>
				<DomStatusPill class="hidden sm:inline-flex" tone="success" size="sm" label="Live availability" />
			</div>
			<DomButton size="sm" variant="ghost">Need help?</DomButton>
		</header>

		<div class="flex min-h-0 flex-1">
			<aside class="hidden w-[19rem] shrink-0 flex-col border-r border-border bg-secondary/20 p-6 lg:flex">
				<div class="flex items-center gap-3">
					<DomAvatar :name="activeHost?.name || 'Northstar host'" :initials="activeHost?.initials || 'NS'" size="lg" />
					<div class="min-w-0">
						<p class="truncate font-semibold">{{ activeHost?.name || 'Your Northstar host' }}</p>
						<p class="truncate text-sm text-muted-fg">{{ activeHost?.role || 'Solutions team' }}</p>
					</div>
				</div>

				<div class="mt-8">
					<p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-fg">Appointment</p>
					<h1 class="mt-2 text-2xl font-semibold tracking-tight">Plan your next move</h1>
					<p class="mt-3 text-sm leading-6 text-muted-fg">Choose a conversation, see the team’s actual availability, and leave with a calendar-ready confirmation.</p>
				</div>

				<div v-if="selectedMeetingType" class="mt-7 divide-y divide-border border-y border-border text-sm">
					<div class="flex items-center gap-3 py-3">
						<DomIconButton as="span" :icon="clockIcon" label="Duration" size="sm" />
						<span>{{ selectedMeetingType.durationMinutes }} minutes</span>
					</div>
					<div class="flex items-center gap-3 py-3">
						<DomIconButton as="span" :icon="videoIcon" label="Location" size="sm" />
						<span>{{ selectedMeetingType.location }}</span>
					</div>
					<div class="flex items-center gap-3 py-3">
						<DomIconButton as="span" :icon="calendarIcon" label="Current selection" size="sm" />
						<span class="min-w-0 truncate">{{ activeStep > 1 ? `${selectedDateLabel}, ${selectedTimeLabel}` : 'Choose a time next' }}</span>
					</div>
				</div>

				<ol class="mt-8 space-y-4" aria-label="Booking progress">
					<li v-for="(step, index) in steps" :key="step.id" class="flex items-center gap-3 text-sm">
						<DomIconButton
							v-if="index < activeStep"
							as="span"
							:icon="checkIcon"
							label="Completed"
							size="sm"
							class="shrink-0 border-success bg-success text-success-fg"
						/>
						<span
							v-else
							class="grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold"
							:class="index === activeStep ? 'border-primary bg-primary text-primary-fg' : 'border-border text-muted-fg'"
						>
							{{ index + 1 }}
						</span>
						<span :class="index === activeStep ? 'font-semibold text-canvas-fg' : 'text-muted-fg'">{{ step.label }}</span>
					</li>
				</ol>

				<div class="mt-auto flex items-start gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-fg">
					<DomIconButton as="span" :icon="shieldIcon" label="Privacy" size="sm" />
					<p>Your details are used only to coordinate this appointment and its follow-up.</p>
				</div>
			</aside>

			<main class="flex min-w-0 flex-1 flex-col">
				<div class="shrink-0 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
					<div class="mx-auto flex max-w-[54rem] items-center justify-between gap-4">
						<div>
							<p class="text-xs font-medium text-muted-fg">Step {{ activeStep + 1 }} of {{ steps.length }}</p>
							<p class="mt-0.5 text-sm font-semibold">{{ currentStep.label }}</p>
						</div>
						<div class="h-1.5 w-28 overflow-hidden rounded-full bg-secondary sm:w-44" aria-hidden="true">
							<div class="h-full rounded-full bg-primary transition-[width] duration-300" :style="{ width: `${progressValue}%` }"></div>
						</div>
					</div>
				</div>

				<div class="min-h-0 flex-1 overflow-y-auto">
					<div class="mx-auto w-full max-w-[54rem] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
						<DomAlert
							v-if="loadError"
							tone="danger"
							title="Scheduling unavailable"
							:description="loadError"
						>
							<template #actions>
								<DomButton size="sm" variant="secondary" @click="loadBookingExperience">Try again</DomButton>
							</template>
						</DomAlert>

						<div v-else-if="isLoading" class="space-y-5" aria-label="Loading booking experience">
							<DomSkeleton class="h-8 w-72" />
							<DomSkeleton class="h-5 w-full max-w-xl" />
							<DomSkeleton v-for="index in 3" :key="index" class="h-24 w-full" />
						</div>

						<template v-else>
							<div class="mb-5 flex items-center gap-3 border-b border-border pb-4 lg:hidden">
								<DomAvatar :name="activeHost?.name || 'Northstar host'" :initials="activeHost?.initials || 'NS'" size="md" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold">{{ activeHost?.name || 'Your Northstar host' }}</p>
									<p class="truncate text-xs text-muted-fg">{{ selectedMeetingType ? `${selectedMeetingType.durationMinutes} min · ${selectedMeetingType.location}` : 'Choose an appointment type' }}</p>
								</div>
							</div>

							<DomAlert
								v-if="feedback"
								class="mb-5"
								:tone="feedback.tone"
								:title="feedback.title"
								:description="feedback.description"
								dismissible
								@dismiss="feedback = null"
							/>

							<Transition name="booking-step" mode="out-in">
								<section v-if="activeStep === 0" key="appointment-type">
									<p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Find the right conversation</p>
									<h2 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">What would you like to plan?</h2>
									<p class="mt-2 max-w-2xl text-sm leading-6 text-muted-fg">Each appointment is routed to the teammate best placed to help. You can review the exact host and duration before choosing a time.</p>

									<DomRadioGroup
										v-model="selectedMeetingTypeId"
										class="mt-6"
										label="Appointment type"
										:options="meetingTypeOptions"
									>
										<template #option="{ option }">
											<span class="flex min-w-0 flex-1 items-start justify-between gap-4 py-1">
												<span class="min-w-0">
													<span class="flex flex-wrap items-center gap-2">
														<strong class="font-semibold">{{ option.label }}</strong>
														<DomBadge v-if="option.popular" tone="primary" size="sm">Most popular</DomBadge>
													</span>
													<span class="mt-1 block text-sm leading-5 text-muted-fg">{{ option.description }}</span>
													<span class="mt-2 block text-xs font-medium text-muted-fg">{{ option.host.name }} · {{ option.host.role }}</span>
												</span>
												<span class="shrink-0 text-sm font-semibold">{{ option.durationMinutes }} min</span>
											</span>
										</template>
									</DomRadioGroup>
								</section>

								<section v-else-if="activeStep === 1" key="date-time">
									<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
										<div>
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Live team availability</p>
											<h2 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Choose a date and time</h2>
											<p class="mt-2 text-sm text-muted-fg">Times update when you change timezone.</p>
										</div>
										<DomSelect
											v-model="selectedTimezone"
											label="Timezone"
											:options="bootstrap.timezoneOptions"
											width="min-w-[18rem]"
										>
											<template #option="{ option }">
												<span class="block">
													<span class="block font-semibold">{{ option.label }}</span>
													<span class="mt-0.5 block text-xs opacity-75">{{ option.description }}</span>
												</span>
											</template>
										</DomSelect>
									</div>

									<div class="mt-6 grid gap-6 md:grid-cols-[minmax(17rem,1fr)_18rem]">
										<div class="min-w-0 overflow-hidden border-y border-border md:border-y-0 md:border-r md:pr-6">
											<DomCalendar
												v-model="selectedDate"
												:min="bootstrap.minDate"
												:max="bootstrap.maxDate"
												:enabled-dates="availableDates"
												:initial-month="initialCalendarMonth"
												:initial-year="initialCalendarYear"
												:register-field="false"
												:native-input="false"
											/>
										</div>

										<div class="min-w-0">
											<div class="flex items-start justify-between gap-3">
												<div>
													<h3 class="font-semibold">{{ selectedDateLabel }}</h3>
													<p class="mt-1 text-xs text-muted-fg">{{ bootstrap.timezoneOptions.find((option) => option.value === selectedTimezone)?.label }}</p>
												</div>
												<DomStatusPill v-if="availability" tone="success" size="sm" :label="`${availability.availableCount} available`" />
											</div>

											<div v-if="isLoadingAvailability" class="mt-4 grid grid-cols-2 gap-2 md:grid-cols-1">
												<DomSkeleton v-for="index in 5" :key="index" class="h-11 w-full" />
											</div>
											<div v-else-if="availability?.slots?.length" class="mt-4 grid grid-cols-2 gap-2 md:grid-cols-1">
												<button
													v-for="slot in availability.slots"
													:key="slot.id"
													type="button"
													class="flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
													:class="slot.id === selectedSlotId ? 'border-primary bg-primary text-primary-fg' : slot.status === 'available' ? 'border-border bg-canvas hover:border-primary/60 hover:bg-secondary/50' : 'cursor-not-allowed border-border bg-secondary/40 text-muted-fg opacity-65'"
													:disabled="slot.status !== 'available'"
													:aria-pressed="slot.id === selectedSlotId"
													@click="selectSlot(slot)"
												>
													<span>{{ slot.label }}</span>
													<span class="text-xs font-medium opacity-75">{{ slot.status === 'available' ? 'Open' : slot.reason }}</span>
												</button>
											</div>
											<DomAlert v-else class="mt-4" tone="info" title="No times published" description="Choose another available date or appointment type." />
										</div>
									</div>
								</section>

								<section v-else-if="activeStep === 2" key="details">
									<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
										<div>
											<p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Almost finished</p>
											<h2 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Tell {{ selectedMeetingType.host.name.split(' ')[0] }} who’s joining</h2>
											<p class="mt-2 text-sm text-muted-fg">We’ll use this to send the invitation and prepare for your goals.</p>
										</div>
										<DomStatusPill tone="success" size="sm" :label="`Held until ${holdExpiryLabel}`" />
									</div>

									<div class="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_17rem]">
										<div class="grid gap-4 sm:grid-cols-2">
											<DomTextInput v-model="attendee.name" label="Your name" autocomplete="name" placeholder="Full name" />
											<DomEmailInput v-model="attendee.email" label="Work email" autocomplete="email" />
											<DomTextInput v-model="attendee.company" label="Company" autocomplete="organization" placeholder="Company name" />
											<div class="flex items-end">
												<DomButton class="w-full" size="sm" variant="secondary" @click="useExampleDetails">Use sample details</DomButton>
											</div>
											<DomTextareaInput v-model="attendee.notes" class="sm:col-span-2" label="What should we prepare?" placeholder="Goals, constraints, current stack, or questions" :rows="4" />
											<DomCheckbox
												v-model="consent"
												class="sm:col-span-2"
												label="Send me appointment updates"
												description="Required for the calendar invitation, changes, and joining link."
											/>
										</div>

										<aside class="divide-y divide-border border-y border-border py-1 text-sm md:border-y-0 md:border-l md:py-0 md:pl-5" aria-label="Appointment summary">
											<div class="py-3 md:pt-0">
												<p class="text-xs font-medium text-muted-fg">Appointment</p>
												<p class="mt-1 font-semibold">{{ selectedMeetingType.label }}</p>
												<p class="mt-0.5 text-muted-fg">{{ selectedMeetingType.durationMinutes }} min · {{ selectedMeetingType.location }}</p>
											</div>
											<div class="py-3">
												<p class="text-xs font-medium text-muted-fg">When</p>
												<p class="mt-1 font-semibold">{{ selectedDateLabel }}</p>
												<p class="mt-0.5 text-muted-fg">{{ selectedTimeLabel }} · {{ bootstrap.timezoneOptions.find((option) => option.value === selectedTimezone)?.label }}</p>
											</div>
											<div class="py-3">
												<p class="text-xs font-medium text-muted-fg">Host</p>
												<p class="mt-1 font-semibold">{{ selectedMeetingType.host.name }}</p>
												<p class="mt-0.5 text-muted-fg">{{ selectedMeetingType.host.role }}</p>
											</div>
										</aside>
									</div>
								</section>

								<section v-else key="confirmed" class="mx-auto max-w-2xl text-center">
									<div class="mx-auto grid size-14 place-items-center rounded-full" :class="booking?.status === 'cancelled' ? 'bg-secondary text-muted-fg' : 'bg-success/15 text-success'">
										<DomIconButton as="span" :icon="checkIcon" :label="booking?.status === 'cancelled' ? 'Cancelled' : 'Confirmed'" size="lg" />
									</div>
									<p class="mt-5 text-xs font-semibold uppercase tracking-[0.14em]" :class="booking?.status === 'cancelled' ? 'text-muted-fg' : 'text-success'">
										{{ booking?.status === 'cancelled' ? 'Appointment cancelled' : 'You’re booked' }}
									</p>
									<h2 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
										{{ booking?.status === 'cancelled' ? 'The time is available again' : `See you ${booking?.display?.date}` }}
									</h2>
									<p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-fg">
										{{ booking?.status === 'cancelled' ? 'The API released your reserved slot and updated the booking receipt.' : `A calendar invitation and joining link are being sent to ${booking?.attendee?.email}.` }}
									</p>

									<div class="mt-7 grid text-left sm:grid-cols-2">
										<div class="border-y border-border py-4 sm:border-r sm:pr-5">
											<p class="text-xs font-medium text-muted-fg">Appointment</p>
											<p class="mt-1 font-semibold">{{ booking?.meetingType?.label }}</p>
											<p class="mt-1 text-sm text-muted-fg">{{ booking?.durationMinutes }} min · {{ booking?.location }}</p>
										</div>
										<div class="border-b border-border py-4 sm:border-y sm:pl-5">
											<p class="text-xs font-medium text-muted-fg">Date & time</p>
											<p class="mt-1 font-semibold">{{ booking?.display?.date }}</p>
											<p class="mt-1 text-sm text-muted-fg">{{ booking?.display?.time }} · {{ booking?.display?.timezone }}</p>
										</div>
									</div>

									<div v-if="receipt" class="mt-5 flex flex-col gap-2 rounded-lg bg-secondary/45 p-4 text-left text-xs sm:flex-row sm:items-center sm:justify-between">
										<div>
											<p class="font-semibold text-canvas-fg">Reference {{ receipt.reference }}</p>
											<p class="mt-1 text-muted-fg">Receipt {{ receipt.id }}</p>
										</div>
										<code class="font-mono text-muted-fg">{{ receipt.checksum }}</code>
									</div>

									<div class="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
										<DomButton v-if="booking?.status === 'confirmed'" variant="secondary" @click="cancelDialogOpen = true">Cancel appointment</DomButton>
										<DomButton @click="resetFlow">Book another appointment</DomButton>
									</div>
								</section>
							</Transition>
						</template>
					</div>
				</div>

				<footer v-if="!isLoading && !loadError && activeStep < 3" class="shrink-0 border-t border-border bg-canvas px-4 py-3 sm:px-6 lg:px-8">
					<div class="mx-auto flex max-w-[54rem] items-center justify-between gap-3">
						<DomButton variant="ghost" :disabled="activeStep === 0" @click="goBack">
							<DomIconButton as="span" :icon="arrowLeftIcon" label="Back" size="xs" />
							<span class="hidden sm:inline">Back</span>
						</DomButton>
						<div class="min-w-0 text-right">
							<p v-if="activeStep === 1 && !selectedSlot" class="hidden text-xs text-muted-fg sm:block">Choose an open time to continue</p>
							<p v-else-if="activeStep === 2 && !canContinue" class="hidden text-xs text-muted-fg sm:block">Name, valid email, and updates consent are required</p>
						</div>
						<DomButton :loading="primaryActionLoading" :disabled="!canContinue" @click="continueFlow">
							{{ primaryActionLabel }}
						</DomButton>
					</div>
				</footer>
			</main>
		</div>

		<DomDialog
			v-model="cancelDialogOpen"
			title="Cancel this appointment?"
			description="The booking API will release the reserved time and issue a cancellation receipt."
			size="sm"
		>
			<DomSelect
				v-model="cancellationReason"
				label="Reason"
				:options="cancellationOptions"
				width="min-w-[18rem]"
			>
				<template #option="{ option }">
					<span class="block">
						<span class="block font-semibold">{{ option.label }}</span>
						<span class="mt-0.5 block text-xs opacity-75">{{ option.description }}</span>
					</span>
				</template>
			</DomSelect>
			<template #footer>
				<DomButton size="sm" variant="secondary" @click="cancelDialogOpen = false">Keep appointment</DomButton>
				<DomButton size="sm" variant="danger" :loading="isCancelling" @click="cancelBooking">Cancel appointment</DomButton>
			</template>
		</DomDialog>
	</section>
</template>

<style scoped>
.booking-step-enter-active,
.booking-step-leave-active {
	transition:
		opacity 160ms ease,
		transform 160ms ease;
}

.booking-step-enter-from {
	opacity: 0;
	transform: translateY(0.5rem);
}

.booking-step-leave-to {
	opacity: 0;
	transform: translateY(-0.25rem);
}

@media (prefers-reduced-motion: reduce) {
	.booking-step-enter-active,
	.booking-step-leave-active {
		transition: none;
	}
}
</style>
