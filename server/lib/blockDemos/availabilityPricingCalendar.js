const allowedStatuses = new Set(['available', 'hold', 'blocked']);
const allowedRestrictions = new Set(['no-check-in', 'no-check-out', 'manual-review', 'event-pricing', 'owner-stay']);

const listingSeeds = [
	{
		id: 'river-loft',
		name: 'River loft',
		description: '2 bedrooms · Sleeps 4 · Central',
		currency: 'GBP',
		occupancy: 83,
		basePrice: 164,
		baseDemand: 52,
		status: 'Live',
		tone: 'success',
		offset: 3,
		blockedDates: ['2026-08-17', '2026-08-18', '2026-09-07'],
		holdDates: ['2026-08-12', '2026-09-16'],
	},
	{
		id: 'garden-studio',
		name: 'Garden studio',
		description: 'Studio · Sleeps 2 · West End',
		currency: 'GBP',
		occupancy: 71,
		basePrice: 132,
		baseDemand: 44,
		status: 'Needs review',
		tone: 'warning',
		offset: 7,
		blockedDates: ['2026-08-14', '2026-09-21'],
		holdDates: ['2026-08-20', '2026-09-10'],
	},
	{
		id: 'harbour-house',
		name: 'Harbour house',
		description: '4 bedrooms · Sleeps 8 · Waterfront',
		currency: 'GBP',
		occupancy: 64,
		basePrice: 258,
		baseDemand: 48,
		status: 'Seasonal',
		tone: 'info',
		offset: 11,
		blockedDates: ['2026-08-24', '2026-08-25', '2026-09-03', '2026-09-04'],
		holdDates: ['2026-08-13', '2026-09-24'],
	},
];

const months = ['2026-08', '2026-09'];
const calendars = new Map(listingSeeds.map((listing) => {
	const days = months.flatMap((month) => buildMonthDays(listing, month));
	return [listing.id, {
		listing: clone(listing),
		months: [...months],
		days,
		publishedDays: Object.fromEntries(days.map((day) => [day.date, clone(day)])),
		pendingChanges: {},
		channels: [
			{ id: 'direct', name: 'Direct booking', status: 'synced', detail: 'Live on your booking site' },
			{ id: 'airbnb', name: 'Airbnb', status: 'synced', detail: 'Calendar connected' },
			{ id: 'booking', name: 'Booking.com', status: 'synced', detail: 'Rates and availability connected' },
		],
		lastSyncedAt: '8 minutes ago',
		lastPublishedAt: 'Today at 09:45',
		lastImportedAt: 'Yesterday at 16:20',
		revision: 12,
		activityEvents: [
			{ id: `${listing.id}-publish`, label: 'Published August rate plan', actor: 'Lina Patel', time: 'Today at 09:45' },
			{ id: `${listing.id}-holds`, label: 'Imported partner holds', actor: 'Channel manager', time: 'Yesterday at 16:20' },
		],
	}];
}));

let activitySequence = 0;

/**
 * Lists the booking inventory resources available to the calendar block.
 *
 * @returns {Array<object>} Listing summaries for the rich listing selector.
 */
export function listAvailabilityPricingListings() {
	return [...calendars.values()].map(serializeListingSummary);
}

/**
 * Returns one complete availability calendar with resolved day rules.
 *
 * @param {string} listingId Listing identifier.
 * @returns {{ calendar?: object, error?: string, status?: number }} Calendar result.
 */
export function getAvailabilityPricingCalendar(listingId) {
	const calendar = calendars.get(String(listingId || ''));
	if (!calendar) return { error: 'Booking listing not found.', status: 404 };
	return { calendar: serializeCalendar(calendar) };
}

/**
 * Validates and saves a draft rule for one calendar date.
 *
 * @param {string} listingId Listing identifier.
 * @param {string} date Date-only inventory identifier.
 * @param {Record<string, unknown>} input Draft day rule.
 * @returns {{ calendar?: object, day?: object, changedFields?: string[], error?: string, status?: number }} Mutation result.
 */
export function updateAvailabilityPricingDay(listingId, date, input = {}) {
	const calendar = calendars.get(String(listingId || ''));
	if (!calendar) return { error: 'Booking listing not found.', status: 404 };

	const day = calendar.days.find((candidate) => candidate.date === date);
	if (!day) return { error: 'Calendar date is outside the loaded inventory range.', status: 404 };

	const normalized = normalizeDayUpdate(day, input);
	if (normalized.error) return normalized;

	Object.assign(day, normalized.value, {
		source: 'manual',
		updatedBy: 'Lina Patel',
		updatedAt: 'Just now',
	});
	const changedFields = reconcilePendingDay(calendar, day.date);
	calendar.revision += 1;
	calendar.activityEvents.unshift(createActivityEvent(
		changedFields.length
			? `Saved a draft for ${day.date}`
			: `Restored ${day.date} to its published rule`,
	));

	return {
		calendar: serializeCalendar(calendar),
		day: clone(day),
		changedFields,
	};
}

/**
 * Imports deterministic partner holds for the requested visible month.
 *
 * @param {string} listingId Listing identifier.
 * @param {Record<string, unknown>} input Import options.
 * @returns {{ calendar?: object, importedDates?: string[], error?: string, status?: number }} Import result.
 */
export function importAvailabilityPartnerHolds(listingId, input = {}) {
	const calendar = calendars.get(String(listingId || ''));
	if (!calendar) return { error: 'Booking listing not found.', status: 404 };

	const month = String(input.month || calendar.months[0]);
	if (!calendar.months.includes(month)) return { error: 'Choose a loaded calendar month before importing holds.', status: 400 };

	const targetDates = [`${month}-12`, `${month}-13`];
	const importedDates = [];
	for (const targetDate of targetDates) {
		const day = calendar.days.find((candidate) => candidate.date === targetDate);
		if (!day) continue;
		const nextRestrictions = [...new Set([...day.restrictions.filter((restriction) => restriction !== 'owner-stay'), 'manual-review'])];
		const changed = day.status !== 'hold' || day.source !== 'partner' || nextRestrictions.join('|') !== day.restrictions.join('|');
		if (!changed) continue;
		day.status = 'hold';
		day.restrictions = nextRestrictions;
		day.source = 'partner';
		day.updatedBy = 'Channel manager';
		day.updatedAt = 'Just now';
		reconcilePendingDay(calendar, targetDate);
		importedDates.push(targetDate);
	}

	calendar.lastImportedAt = 'Just now';
	calendar.revision += 1;
	calendar.activityEvents.unshift(createActivityEvent(
		importedDates.length
			? `Imported ${importedDates.length} partner holds for ${month}`
			: `Checked partner holds for ${month}; no changes found`,
		'Channel manager',
	));

	return {
		calendar: serializeCalendar(calendar),
		importedDates,
	};
}

/**
 * Publishes every saved draft rule to the calendar's configured channels.
 *
 * @param {string} listingId Listing identifier.
 * @param {Record<string, unknown>} input Publish options.
 * @returns {{ calendar?: object, publishedDates?: string[], error?: string, status?: number }} Publish result.
 */
export function publishAvailabilityPricingCalendar(listingId, input = {}) {
	const calendar = calendars.get(String(listingId || ''));
	if (!calendar) return { error: 'Booking listing not found.', status: 404 };

	const revisionError = validateRevision(calendar, input.revision);
	if (revisionError) return revisionError;

	const publishedDates = Object.keys(calendar.pendingChanges).sort();
	if (!publishedDates.length) return { error: 'There are no saved draft rules to publish.', status: 409 };

	for (const date of publishedDates) {
		const day = calendar.days.find((candidate) => candidate.date === date);
		calendar.publishedDays[date] = clone(day);
	}
	calendar.pendingChanges = {};
	calendar.channels = calendar.channels.map((channel) => ({
		...channel,
		status: 'synced',
		detail: `Published ${publishedDates.length} ${publishedDates.length === 1 ? 'date' : 'dates'} just now`,
	}));
	calendar.lastPublishedAt = 'Just now';
	calendar.lastSyncedAt = 'Just now';
	calendar.revision += 1;
	calendar.activityEvents.unshift(createActivityEvent(
		`Published ${publishedDates.length} ${publishedDates.length === 1 ? 'date' : 'dates'} to 3 channels`,
	));

	return {
		calendar: serializeCalendar(calendar),
		publishedDates,
	};
}

/**
 * Discards every draft and restores the last published day rules.
 *
 * @param {string} listingId Listing identifier.
 * @param {Record<string, unknown>} input Discard options.
 * @returns {{ calendar?: object, discardedDates?: string[], error?: string, status?: number }} Discard result.
 */
export function discardAvailabilityPricingDrafts(listingId, input = {}) {
	const calendar = calendars.get(String(listingId || ''));
	if (!calendar) return { error: 'Booking listing not found.', status: 404 };

	const revisionError = validateRevision(calendar, input.revision);
	if (revisionError) return revisionError;

	const discardedDates = Object.keys(calendar.pendingChanges).sort();
	if (!discardedDates.length) return { error: 'There are no saved draft rules to discard.', status: 409 };

	calendar.days = calendar.days.map((day) => discardedDates.includes(day.date)
		? clone(calendar.publishedDays[day.date])
		: day);
	calendar.pendingChanges = {};
	calendar.revision += 1;
	calendar.activityEvents.unshift(createActivityEvent(
		`Discarded drafts for ${discardedDates.length} ${discardedDates.length === 1 ? 'date' : 'dates'}`,
	));

	return {
		calendar: serializeCalendar(calendar),
		discardedDates,
	};
}

/**
 * Builds deterministic day inventory for one listing and month.
 *
 * @param {object} listing Listing seed.
 * @param {string} month Month identifier in YYYY-MM format.
 * @returns {Array<object>} Resolved day inventory.
 */
function buildMonthDays(listing, month) {
	const [year, monthNumber] = month.split('-').map(Number);
	const dayCount = new Date(year, monthNumber, 0).getDate();
	const eventDates = month === '2026-08' ? new Set([7, 8, 9]) : new Set([18, 19, 20]);
	const days = [];

	for (let dayNumber = 1; dayNumber <= dayCount; dayNumber += 1) {
		const date = `${month}-${pad(dayNumber)}`;
		const weekday = new Date(year, monthNumber - 1, dayNumber).getDay();
		const weekend = weekday === 0 || weekday === 6;
		const event = eventDates.has(dayNumber);
		const blocked = listing.blockedDates.includes(date);
		const hold = listing.holdDates.includes(date);
		const demand = clamp(listing.baseDemand + (weekend ? 17 : 0) + (event ? 30 : 0) + ((dayNumber * 7 + listing.offset) % 13) - 6, 24, 97);
		const price = Math.round(listing.basePrice + (weekend ? 24 : 0) + (event ? 58 : 0) + (demand - listing.baseDemand) * 0.7);
		const status = blocked ? 'blocked' : hold ? 'hold' : 'available';
		const restrictions = [];
		if (event) restrictions.push('event-pricing');
		if (hold) restrictions.push('manual-review');
		if (blocked) restrictions.push('owner-stay');
		if (weekday === 0 && demand >= 78) restrictions.push('no-check-out');

		days.push({
			date,
			price,
			recommendedPrice: price + (demand >= 80 ? 12 : demand < 40 ? -8 : 5),
			status,
			demand,
			minimumStay: event ? 3 : weekend ? 2 : 1,
			restrictions,
			source: blocked ? 'owner' : hold ? 'partner' : event ? 'event-rate' : 'seasonal',
			updatedBy: blocked ? 'Lina Patel' : hold ? 'Channel manager' : 'Revenue rules',
			updatedAt: blocked || hold ? 'Yesterday' : 'Jul 28, 2026',
		});
	}

	return days;
}

/**
 * Validates and normalizes an incoming day-rule payload.
 *
 * @param {object} day Stored day rule.
 * @param {Record<string, unknown>} input Requested day rule.
 * @returns {{ value?: object, error?: string, status?: number }} Validation result.
 */
function normalizeDayUpdate(day, input) {
	const price = Number(input.price ?? day.price);
	const minimumStay = Number(input.minimumStay ?? day.minimumStay);
	const status = String(input.status ?? day.status);
	const restrictions = Array.isArray(input.restrictions)
		? [...new Set(input.restrictions.map((restriction) => String(restriction)))]
		: [...day.restrictions];

	if (!Number.isInteger(price) || price < 80 || price > 1200) {
		return { error: 'Nightly price must be a whole amount between GBP 80 and GBP 1,200.', status: 400 };
	}
	if (!Number.isInteger(minimumStay) || minimumStay < 1 || minimumStay > 14) {
		return { error: 'Minimum stay must be between 1 and 14 nights.', status: 400 };
	}
	if (!allowedStatuses.has(status)) return { error: 'Choose a supported availability status.', status: 400 };
	if (restrictions.some((restriction) => !allowedRestrictions.has(restriction))) {
		return { error: 'One or more date restrictions are not supported.', status: 400 };
	}

	return {
		value: {
			price,
			minimumStay,
			status,
			restrictions,
		},
	};
}

/**
 * Reconciles one draft day against its last published state.
 *
 * @param {object} calendar Mutable calendar store.
 * @param {string} date Date identifier.
 * @returns {string[]} Fields that differ from the published rule.
 */
function reconcilePendingDay(calendar, date) {
	const day = calendar.days.find((candidate) => candidate.date === date);
	const publishedDay = calendar.publishedDays[date];
	const changedFields = dayChangedFields(day, publishedDay);
	if (!changedFields.length) {
		delete calendar.pendingChanges[date];
		return changedFields;
	}
	calendar.pendingChanges[date] = {
		date,
		fields: changedFields,
		savedAt: 'Just now',
	};
	return changedFields;
}

/**
 * Lists editable fields that differ between two day rules.
 *
 * @param {object} day Current day rule.
 * @param {object} publishedDay Last published day rule.
 * @returns {string[]} Changed field labels.
 */
function dayChangedFields(day, publishedDay) {
	const fields = [];
	if (day.price !== publishedDay.price) fields.push('price');
	if (day.minimumStay !== publishedDay.minimumStay) fields.push('minimum stay');
	if (day.status !== publishedDay.status) fields.push('availability');
	if (day.restrictions.join('|') !== publishedDay.restrictions.join('|')) fields.push('restrictions');
	return fields;
}

/**
 * Validates an optimistic calendar revision when one is supplied.
 *
 * @param {object} calendar Stored calendar.
 * @param {unknown} revision Requested revision.
 * @returns {{ error: string, status: number } | null} Conflict response when stale.
 */
function validateRevision(calendar, revision) {
	if (revision === undefined || revision === null) return null;
	if (Number(revision) === calendar.revision) return null;
	return { error: 'Calendar inventory changed in another session. Reload before publishing.', status: 409 };
}

/**
 * Serializes one listing for the resource selector.
 *
 * @param {object} calendar Stored calendar resource.
 * @returns {object} Listing summary.
 */
function serializeListingSummary(calendar) {
	return {
		id: calendar.listing.id,
		name: calendar.listing.name,
		description: calendar.listing.description,
		currency: calendar.listing.currency,
		occupancy: calendar.listing.occupancy,
		status: calendar.listing.status,
		tone: calendar.listing.tone,
		pendingChangeCount: Object.keys(calendar.pendingChanges).length,
	};
}

/**
 * Serializes a calendar without exposing internal mutable references.
 *
 * @param {object} calendar Stored calendar resource.
 * @returns {object} API-safe calendar payload.
 */
function serializeCalendar(calendar) {
	return clone({
		listing: serializeListingSummary(calendar),
		months: calendar.months,
		days: calendar.days,
		pendingChanges: Object.values(calendar.pendingChanges).sort((left, right) => left.date.localeCompare(right.date)),
		channels: calendar.channels,
		lastSyncedAt: calendar.lastSyncedAt,
		lastPublishedAt: calendar.lastPublishedAt,
		lastImportedAt: calendar.lastImportedAt,
		revision: calendar.revision,
		activityEvents: calendar.activityEvents.slice(0, 8),
	});
}

/**
 * Creates one process-local activity event for a demo API mutation.
 *
 * @param {string} label Event description.
 * @param {string} [actor] Event actor.
 * @returns {{ id: string, label: string, actor: string, time: string }} Activity event.
 */
function createActivityEvent(label, actor = 'Lina Patel') {
	activitySequence += 1;
	return {
		id: `availability-activity-${activitySequence}`,
		label,
		actor,
		time: 'Just now',
	};
}

/**
 * Clamps a numeric value to an inclusive range.
 *
 * @param {number} value Candidate value.
 * @param {number} minimum Minimum allowed value.
 * @param {number} maximum Maximum allowed value.
 * @returns {number} Clamped value.
 */
function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

/**
 * Pads a calendar number for a date-only identifier.
 *
 * @param {number} value Calendar number.
 * @returns {string} Two-character numeric string.
 */
function pad(value) {
	return String(value).padStart(2, '0');
}

/**
 * Creates a detached JSON-compatible copy of a demo record.
 *
 * @template T
 * @param {T} value Value to clone.
 * @returns {T} Detached copy.
 */
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
