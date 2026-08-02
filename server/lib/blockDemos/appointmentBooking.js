import { createHash } from 'node:crypto';

const meetingTypes = Object.freeze([
	{
		id: 'implementation',
		label: 'Implementation planning',
		durationMinutes: 45,
		description: 'Map requirements, integrations, and a practical rollout path.',
		host: {
			name: 'Maya Chen',
			role: 'Solutions lead',
			initials: 'MC',
		},
		location: 'Google Meet',
		popular: true,
	},
	{
		id: 'architecture',
		label: 'Architecture review',
		durationMinutes: 30,
		description: 'Pressure-test your current stack and unblock one technical decision.',
		host: {
			name: 'Elliot Grant',
			role: 'Staff engineer',
			initials: 'EG',
		},
		location: 'Google Meet',
		popular: false,
	},
	{
		id: 'success',
		label: 'Customer success review',
		durationMinutes: 60,
		description: 'Review adoption, outcomes, open risks, and the next quarter together.',
		host: {
			name: 'Priya Shah',
			role: 'Customer success',
			initials: 'PS',
		},
		location: 'Zoom',
		popular: false,
	},
]);

const timezoneOptions = Object.freeze([
	{ value: 'Europe/London', label: 'London', description: 'GMT / British Summer Time' },
	{ value: 'America/New_York', label: 'New York', description: 'Eastern Time' },
	{ value: 'America/Los_Angeles', label: 'Los Angeles', description: 'Pacific Time' },
	{ value: 'Europe/Paris', label: 'Paris', description: 'Central European Time' },
	{ value: 'Asia/Singapore', label: 'Singapore', description: 'Singapore Standard Time' },
	{ value: 'Australia/Sydney', label: 'Sydney', description: 'Australian Eastern Time' },
]);

const baseTimesByType = Object.freeze({
	implementation: ['08:30', '09:30', '11:00', '13:00', '14:30', '16:00'],
	architecture: ['08:00', '09:00', '10:30', '12:00', '14:00', '15:30', '17:00'],
	success: ['08:00', '10:00', '12:00', '14:00', '16:00'],
});

let state = createInitialState();
let holdSequence = 300;
let bookingSequence = 900;

/**
 * Return the scheduling product, meeting choices, date range, and viewer defaults.
 *
 * @returns {Record<string, unknown>} Appointment-booking bootstrap payload.
 */
export function getAppointmentBookingBootstrap() {
	purgeExpiredHolds();
	const dates = nextBookableDates();
	return cloneValue({
		brand: {
			name: 'Northstar Studio',
			mark: 'N',
		},
		meetingTypes,
		timezoneOptions,
		availableDates: dates,
		defaultDate: dates[0] || '',
		minDate: dates[0] || '',
		maxDate: dates.at(-1) || '',
		availabilityRevision: state.availabilityRevision,
		viewer: {
			name: 'Alex Morgan',
			email: 'alex@northstar.tools',
			timezone: 'Europe/London',
		},
		policy: {
			holdMinutes: 8,
			minimumNoticeHours: 24,
			cancellationHours: 12,
		},
	});
}

/**
 * Return server-resolved availability for one meeting type, date, and timezone.
 *
 * @param {Record<string, unknown>} input Availability query values.
 * @returns {Record<string, unknown>} Availability payload or API error.
 */
export function getAppointmentAvailability(input = {}) {
	purgeExpiredHolds();
	const meetingType = meetingTypeById(input.meetingTypeId);
	if (!meetingType) return validation('Choose an available meeting type.');
	const date = normalizeDate(input.date);
	if (!nextBookableDates().includes(date)) return validation('Choose a date inside the published booking window.');
	const timezone = normalizeTimezone(input.timezone);
	if (!timezone) return validation('Choose a supported timezone.');
	return cloneValue(buildAvailability(meetingType, date, timezone));
}

/**
 * Place a short-lived server-side hold on an available slot.
 *
 * @param {Record<string, unknown>} input Slot identity, timezone, and optimistic revision.
 * @returns {Record<string, unknown>} Hold payload or recoverable API error.
 */
export function holdAppointmentSlot(input = {}) {
	purgeExpiredHolds();
	const meetingType = meetingTypeById(input.meetingTypeId);
	if (!meetingType) return validation('Choose an available meeting type.');
	const date = normalizeDate(input.date);
	if (!nextBookableDates().includes(date)) return validation('Choose a date inside the published booking window.');
	const timezone = normalizeTimezone(input.timezone);
	if (!timezone) return validation('Choose a supported timezone.');
	const revisionError = validateAvailabilityRevision(input.availabilityRevision);
	if (revisionError) return revisionError;
	const availability = buildAvailability(meetingType, date, timezone);
	const slot = availability.slots.find((candidate) => candidate.id === String(input.slotId || ''));
	if (!slot || slot.status !== 'available') {
		return conflict('That time was just reserved. Choose another available slot.', {
			code: 'slot_unavailable',
			availability,
		});
	}
	const now = Date.now();
	const hold = {
		id: `slot-hold-${++holdSequence}`,
		meetingTypeId: meetingType.id,
		date,
		slotId: slot.id,
		startsAt: slot.startsAt,
		timezone,
		createdAt: new Date(now).toISOString(),
		expiresAt: new Date(now + 8 * 60 * 1000).toISOString(),
	};
	state.holds.set(hold.id, hold);
	state.availabilityRevision += 1;
	return cloneValue({
		hold,
		availabilityRevision: state.availabilityRevision,
		message: `${slot.label} is held for eight minutes while you add your details.`,
	});
}

/**
 * Release an active slot hold when the attendee returns to the calendar.
 *
 * @param {string} holdId Slot-hold identifier.
 * @returns {Record<string, unknown>} Updated availability revision or API error.
 */
export function releaseAppointmentHold(holdId) {
	purgeExpiredHolds();
	const hold = state.holds.get(String(holdId || ''));
	if (!hold) return conflict('This slot hold has already expired or been released.', { code: 'hold_expired' });
	state.holds.delete(hold.id);
	state.availabilityRevision += 1;
	return {
		availabilityRevision: state.availabilityRevision,
		message: 'The temporary slot hold was released.',
	};
}

/**
 * Confirm an appointment from a valid slot hold and attendee profile.
 *
 * @param {Record<string, unknown>} input Hold identifier and attendee details.
 * @returns {Record<string, unknown>} Confirmed booking receipt or API error.
 */
export function createAppointmentBooking(input = {}) {
	purgeExpiredHolds();
	const hold = state.holds.get(String(input.holdId || ''));
	if (!hold) return conflict('Your slot hold expired. Return to the calendar and choose the time again.', { code: 'hold_expired' });
	const attendee = normalizeAttendee(input.attendee);
	if (!attendee.name) return validation('Enter your full name.', [{ field: 'name', message: 'Your name is required.' }]);
	if (!isValidEmail(attendee.email)) return validation('Enter a valid work email.', [{ field: 'email', message: 'Use an address such as name@company.com.' }]);
	if (input.consent !== true) return validation('Confirm that Northstar may send booking updates.', [{ field: 'consent', message: 'Booking updates require consent.' }]);
	const meetingType = meetingTypeById(hold.meetingTypeId);
	if (!meetingType) return conflict('This meeting type is no longer published. Choose another appointment.', { code: 'meeting_unavailable' });
	const now = new Date().toISOString();
	const sequence = ++bookingSequence;
	const booking = {
		id: `booking-${sequence}`,
		reference: `NST-${sequence}`,
		status: 'confirmed',
		meetingTypeId: meetingType.id,
		date: hold.date,
		slotId: hold.slotId,
		startsAt: hold.startsAt,
		timezone: hold.timezone,
		durationMinutes: meetingType.durationMinutes,
		location: meetingType.location,
		host: meetingType.host,
		attendee,
		createdAt: now,
		updatedAt: now,
		cancelledAt: null,
	};
	state.bookings.set(booking.id, booking);
	state.holds.delete(hold.id);
	state.availabilityRevision += 1;
	const receipt = buildBookingReceipt(booking);
	return cloneValue({
		booking: serializeBooking(booking),
		receipt,
		availabilityRevision: state.availabilityRevision,
		message: `Appointment ${booking.reference} is confirmed and the calendar invitation is queued.`,
	});
}

/**
 * Return one process-local booking by its stable identifier.
 *
 * @param {string} bookingId Booking identifier.
 * @returns {Record<string, unknown>} Booking payload or not-found API error.
 */
export function getAppointmentBooking(bookingId) {
	const booking = state.bookings.get(String(bookingId || ''));
	if (!booking) return notFound('Appointment');
	return cloneValue({
		booking: serializeBooking(booking),
		receipt: buildBookingReceipt(booking),
	});
}

/**
 * Cancel a confirmed booking and release its slot back into availability.
 *
 * @param {string} bookingId Booking identifier.
 * @param {Record<string, unknown>} input Cancellation reason.
 * @returns {Record<string, unknown>} Cancelled booking payload or API error.
 */
export function cancelAppointmentBooking(bookingId, input = {}) {
	const booking = state.bookings.get(String(bookingId || ''));
	if (!booking) return notFound('Appointment');
	if (booking.status === 'cancelled') return conflict('This appointment is already cancelled.', { code: 'already_cancelled' });
	const reason = normalizeText(input.reason, 180);
	if (!reason) return validation('Choose or enter a cancellation reason.');
	booking.status = 'cancelled';
	booking.cancellationReason = reason;
	booking.cancelledAt = new Date().toISOString();
	booking.updatedAt = booking.cancelledAt;
	state.availabilityRevision += 1;
	return cloneValue({
		booking: serializeBooking(booking),
		receipt: buildBookingReceipt(booking),
		availabilityRevision: state.availabilityRevision,
		message: `Appointment ${booking.reference} was cancelled and the slot was released.`,
	});
}

/**
 * Create the process-local scheduling state.
 *
 * @returns {Record<string, unknown>} Empty hold and booking stores with a stable revision.
 */
function createInitialState() {
	return {
		availabilityRevision: 24,
		holds: new Map(),
		bookings: new Map(),
	};
}

/**
 * Build the rolling list of future weekdays offered by the demo calendar.
 *
 * @returns {Array<string>} Ten future ISO date values.
 */
function nextBookableDates() {
	const dates = [];
	const cursor = new Date();
	cursor.setHours(12, 0, 0, 0);
	for (let offset = 1; dates.length < 10 && offset <= 24; offset += 1) {
		const candidate = new Date(cursor);
		candidate.setDate(cursor.getDate() + offset);
		if (candidate.getDay() === 0 || candidate.getDay() === 6) continue;
		dates.push(formatDate(candidate));
	}
	return dates;
}

/**
 * Build a complete availability response with base schedule and live reservations.
 *
 * @param {Record<string, unknown>} meetingType Meeting-type record.
 * @param {string} date Host calendar date.
 * @param {string} timezone Requested display timezone.
 * @returns {Record<string, unknown>} Server-resolved availability response.
 */
function buildAvailability(meetingType, date, timezone) {
	const slots = (baseTimesByType[meetingType.id] || []).map((time, index) => buildSlot(meetingType, date, timezone, time, index));
	return {
		meetingTypeId: meetingType.id,
		date,
		timezone,
		revision: state.availabilityRevision,
		generatedAt: new Date().toISOString(),
		slots,
		availableCount: slots.filter((slot) => slot.status === 'available').length,
	};
}

/**
 * Build one slot and resolve busy, held, or booked state.
 *
 * @param {Record<string, unknown>} meetingType Meeting-type record.
 * @param {string} date Host calendar date.
 * @param {string} timezone Requested display timezone.
 * @param {string} time Base UTC time.
 * @param {number} index Position inside the meeting schedule.
 * @returns {Record<string, unknown>} Serialized availability slot.
 */
function buildSlot(meetingType, date, timezone, time, index) {
	const compactTime = time.replace(':', '');
	const id = `${meetingType.id}-${date}-${compactTime}`;
	const startsAt = `${date}T${time}:00.000Z`;
	const reservation = activeReservationFor(id);
	const dateSeed = Number(date.slice(-2));
	const seededBusy = (dateSeed + index + meetingType.durationMinutes) % 5 === 0;
	const status = reservation || seededBusy ? 'unavailable' : 'available';
	return {
		id,
		startsAt,
		label: formatTime(startsAt, timezone),
		status,
		reason: reservation ? 'Reserved' : seededBusy ? 'Host unavailable' : '',
	};
}

/**
 * Find an active hold or confirmed booking for a slot.
 *
 * @param {string} slotId Stable slot identifier.
 * @returns {Record<string, unknown>|null} Reservation record or null.
 */
function activeReservationFor(slotId) {
	const hold = [...state.holds.values()].find((candidate) => candidate.slotId === slotId);
	if (hold) return hold;
	return [...state.bookings.values()].find((booking) => booking.slotId === slotId && booking.status === 'confirmed') || null;
}

/**
 * Remove expired holds and advance availability when reservations are released.
 *
 * @returns {void}
 */
function purgeExpiredHolds() {
	const now = Date.now();
	let changed = false;
	for (const [holdId, hold] of state.holds.entries()) {
		if (Date.parse(hold.expiresAt) > now) continue;
		state.holds.delete(holdId);
		changed = true;
	}
	if (changed) state.availabilityRevision += 1;
}

/**
 * Find a published meeting type by identifier.
 *
 * @param {unknown} value Candidate meeting-type identifier.
 * @returns {Record<string, unknown>|null} Meeting type or null.
 */
function meetingTypeById(value) {
	return meetingTypes.find((meetingType) => meetingType.id === String(value || '')) || null;
}

/**
 * Validate optimistic availability state before creating a hold.
 *
 * @param {unknown} value Candidate revision.
 * @returns {Record<string, unknown>|null} Conflict response or null.
 */
function validateAvailabilityRevision(value) {
	const revision = Number(value);
	if (!Number.isInteger(revision)) return validation('Send the availability revision with this slot.');
	if (revision === state.availabilityRevision) return null;
	return conflict('Availability changed while you were choosing. Refresh the times and try again.', {
		code: 'availability_changed',
		currentRevision: state.availabilityRevision,
	});
}

/**
 * Normalize attendee fields at the API boundary.
 *
 * @param {unknown} value Candidate attendee record.
 * @returns {Record<string, string>} Safe attendee profile.
 */
function normalizeAttendee(value) {
	const attendee = value && typeof value === 'object' ? value : {};
	return {
		name: normalizeText(attendee.name, 80),
		email: normalizeText(attendee.email, 160).toLowerCase(),
		company: normalizeText(attendee.company, 100),
		notes: normalizeText(attendee.notes, 800),
	};
}

/**
 * Resolve a supported timezone identifier.
 *
 * @param {unknown} value Candidate timezone.
 * @returns {string} Supported timezone or an empty string.
 */
function normalizeTimezone(value) {
	const candidate = String(value || '');
	return timezoneOptions.some((option) => option.value === candidate) ? candidate : '';
}

/**
 * Normalize an ISO date-only value.
 *
 * @param {unknown} value Candidate date.
 * @returns {string} Valid date or an empty string.
 */
function normalizeDate(value) {
	const candidate = String(value || '');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return '';
	const date = new Date(`${candidate}T12:00:00`);
	return Number.isNaN(date.getTime()) ? '' : candidate;
}

/**
 * Normalize user-entered text to a maximum length.
 *
 * @param {unknown} value Candidate text.
 * @param {number} maxLength Maximum returned length.
 * @returns {string} Trimmed text.
 */
function normalizeText(value, maxLength) {
	return String(value ?? '').trim().slice(0, maxLength);
}

/**
 * Check an attendee email address with a conservative structural rule.
 *
 * @param {string} value Candidate email address.
 * @returns {boolean} Whether the address is structurally valid.
 */
function isValidEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Serialize a booking without exposing the mutable process-local record.
 *
 * @param {Record<string, unknown>} booking Booking record.
 * @returns {Record<string, unknown>} Public booking payload.
 */
function serializeBooking(booking) {
	const meetingType = meetingTypeById(booking.meetingTypeId);
	return {
		...booking,
		meetingType: meetingType ? {
			id: meetingType.id,
			label: meetingType.label,
			description: meetingType.description,
		} : null,
		display: {
			date: formatLongDate(booking.startsAt, booking.timezone),
			time: formatTime(booking.startsAt, booking.timezone),
			timezone: timezoneOptions.find((option) => option.value === booking.timezone)?.label || booking.timezone,
		},
	};
}

/**
 * Build immutable proof for a confirmed or cancelled booking state.
 *
 * @param {Record<string, unknown>} booking Booking record.
 * @returns {Record<string, unknown>} Booking receipt.
 */
function buildBookingReceipt(booking) {
	const payload = `${booking.id}:${booking.status}:${booking.updatedAt}:${booking.attendee.email}`;
	return {
		id: `receipt-${booking.reference.toLowerCase()}`,
		reference: booking.reference,
		status: booking.status,
		issuedAt: booking.updatedAt,
		checksum: createHash('sha256').update(payload).digest('hex').slice(0, 16),
		calendarDelivery: booking.status === 'confirmed' ? 'queued' : 'cancelled',
	};
}

/**
 * Format a Date value as YYYY-MM-DD in local calendar time.
 *
 * @param {Date} date Date instance.
 * @returns {string} ISO date-only value.
 */
function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Format a UTC slot instant in the requested timezone.
 *
 * @param {string} value ISO instant.
 * @param {string} timezone IANA timezone.
 * @returns {string} Localized time label.
 */
function formatTime(value, timezone) {
	return new Intl.DateTimeFormat('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: timezone,
	}).format(new Date(value));
}

/**
 * Format a UTC slot instant as a weekday and long date in the requested timezone.
 *
 * @param {string} value ISO instant.
 * @param {string} timezone IANA timezone.
 * @returns {string} Localized date label.
 */
function formatLongDate(value, timezone) {
	return new Intl.DateTimeFormat('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: timezone,
	}).format(new Date(value));
}

/**
 * Build a validation API response.
 *
 * @param {string} message Human-readable validation message.
 * @param {Array<Record<string, unknown>>} [details=[]] Optional field details.
 * @returns {Record<string, unknown>} Validation error response.
 */
function validation(message, details = []) {
	return { error: 'validation_error', status: 422, message, details };
}

/**
 * Build a recoverable scheduling conflict response.
 *
 * @param {string} message Human-readable recovery guidance.
 * @param {Record<string, unknown>} [details={}] Current scheduling state.
 * @returns {Record<string, unknown>} Conflict API response.
 */
function conflict(message, details = {}) {
	return { error: 'booking_conflict', status: 409, message, ...details };
}

/**
 * Build a not-found API response.
 *
 * @param {string} resource Resource label.
 * @returns {Record<string, unknown>} Not-found response.
 */
function notFound(resource) {
	return { error: 'not_found', status: 404, message: `${resource} was not found.` };
}

/**
 * Clone serializable data before it crosses the API boundary.
 *
 * @template T
 * @param {T} value Serializable value.
 * @returns {T} Detached clone.
 */
function cloneValue(value) {
	return structuredClone(value);
}
