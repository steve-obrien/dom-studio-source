export function pad(value) {
	return String(value).padStart(2, '0');
}

export function normalizeMinuteStep(value, fallback = 15) {
	const number = Math.round(Number(value));
	if (!Number.isFinite(number) || number <= 0) return fallback;
	return Math.min(720, Math.max(1, number));
}

export function timeToParts(value) {
	const match = String(value || '').match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
	if (!match) return null;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	const seconds = Number(match[3] || 0);
	if (hours > 23 || minutes > 59 || seconds > 59) return null;
	return { hours, minutes, seconds };
}

export function partsToTime(parts, { showSeconds = false } = {}) {
	const hours = Number(parts?.hours);
	const minutes = Number(parts?.minutes);
	const seconds = Number(parts?.seconds || 0);
	if (
		!Number.isInteger(hours)
		|| !Number.isInteger(minutes)
		|| !Number.isInteger(seconds)
		|| hours < 0
		|| hours > 23
		|| minutes < 0
		|| minutes > 59
		|| seconds < 0
		|| seconds > 59
	) return '';
	const base = `${pad(hours)}:${pad(minutes)}`;
	return showSeconds ? `${base}:${pad(seconds)}` : base;
}

export function normalizeTimeValue(value, options = {}) {
	const parts = timeToParts(value);
	if (!parts) return '';
	return partsToTime(parts, options);
}

export function isTimeValue(value, options = {}) {
	return normalizeTimeValue(value, options) === value;
}

export function timeToSeconds(value) {
	const parts = timeToParts(value);
	if (!parts) return NaN;
	return parts.hours * 3600 + parts.minutes * 60 + parts.seconds;
}

export function secondsToTime(totalSeconds, options = {}) {
	const safeSeconds = Math.min(86399, Math.max(0, Math.round(Number(totalSeconds) || 0)));
	const hours = Math.floor(safeSeconds / 3600);
	const minutes = Math.floor((safeSeconds % 3600) / 60);
	const seconds = safeSeconds % 60;
	return partsToTime({ hours, minutes, seconds }, options);
}

export function compareTimeValues(left, right) {
	const leftSeconds = timeToSeconds(left);
	const rightSeconds = timeToSeconds(right);
	if (!Number.isFinite(leftSeconds) || !Number.isFinite(rightSeconds)) return 0;
	return leftSeconds - rightSeconds;
}

export function parseTimeInput(input, options = {}) {
	const showSeconds = Boolean(options.showSeconds);
	const trimmed = String(input || '').trim();
	if (!trimmed) return { value: '', error: '' };

	const compact = trimmed.match(/^(\d{3,4})(?:\s*([ap]m))?$/i);
	if (compact) {
		const digits = compact[1];
		const suffix = compact[2] || '';
		const hours = Number(digits.slice(0, -2));
		const minutes = Number(digits.slice(-2));
		return normalizeParsedParts({ hours, minutes, seconds: 0, suffix, showSeconds });
	}

	const colon = trimmed.match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?(?:\s*([ap]m))?$/i);
	if (!colon) {
		return { value: '', error: 'Use a time like 09:30 or 2:30 PM.' };
	}

	const hours = Number(colon[1]);
	const minutes = colon[2] == null ? 0 : Number(colon[2]);
	const seconds = colon[3] == null ? 0 : Number(colon[3]);
	const suffix = colon[4] || '';
	return normalizeParsedParts({ hours, minutes, seconds, suffix, showSeconds });
}

export function formatTimeDisplay(value, options = {}) {
	const parts = timeToParts(value);
	if (!parts) return '';
	const showSeconds = Boolean(options.showSeconds);
	if (options.timeFormat === '12h') {
		const suffix = parts.hours >= 12 ? 'PM' : 'AM';
		const displayHours = parts.hours % 12 || 12;
		const base = `${displayHours}:${pad(parts.minutes)}`;
		return showSeconds ? `${base}:${pad(parts.seconds)} ${suffix}` : `${base} ${suffix}`;
	}
	const base = `${pad(parts.hours)}:${pad(parts.minutes)}`;
	return showSeconds ? `${base}:${pad(parts.seconds)}` : base;
}

export function timeRangeError(value, options = {}) {
	const normalized = normalizeTimeValue(value, options);
	if (!normalized) return '';
	const min = normalizeTimeValue(options.min, options);
	const max = normalizeTimeValue(options.max, options);
	if (min && compareTimeValues(normalized, min) < 0) {
		return `Time must be at or after ${formatTimeDisplay(min, options)}.`;
	}
	if (max && compareTimeValues(normalized, max) > 0) {
		return `Time must be at or before ${formatTimeDisplay(max, options)}.`;
	}
	return '';
}

export function buildTimeOptions(options = {}) {
	const customOptions = Array.isArray(options.options) ? options.options : [];
	if (customOptions.length) {
		return customOptions
			.map((option) => normalizeOption(option, options))
			.filter((option) => option.value);
	}

	const showSeconds = Boolean(options.showSeconds);
	const stepSeconds = normalizeMinuteStep(options.minuteStep) * 60;
	const min = normalizeTimeValue(options.min, { showSeconds }) || '00:00';
	const max = normalizeTimeValue(options.max, { showSeconds }) || (showSeconds ? '23:59:59' : '23:59');
	const minSeconds = timeToSeconds(min);
	const maxSeconds = timeToSeconds(max);
	if (!Number.isFinite(minSeconds) || !Number.isFinite(maxSeconds) || minSeconds > maxSeconds) return [];

	const start = Math.ceil(minSeconds / stepSeconds) * stepSeconds;
	const items = [];
	for (let seconds = start; seconds <= maxSeconds; seconds += stepSeconds) {
		const value = secondsToTime(seconds, { showSeconds });
		items.push({
			value,
			label: formatTimeDisplay(value, options),
		});
	}
	return items;
}

function normalizeParsedParts({ hours, minutes, seconds, suffix, showSeconds }) {
	const normalizedSuffix = String(suffix || '').toLowerCase();
	if (normalizedSuffix) {
		if (hours < 1 || hours > 12) return { value: '', error: 'Use 1-12 with AM or PM.' };
		if (normalizedSuffix === 'am') hours = hours === 12 ? 0 : hours;
		if (normalizedSuffix === 'pm') hours = hours === 12 ? 12 : hours + 12;
	}

	if (
		!Number.isInteger(hours)
		|| !Number.isInteger(minutes)
		|| !Number.isInteger(seconds)
		|| hours < 0
		|| hours > 23
		|| minutes < 0
		|| minutes > 59
		|| seconds < 0
		|| seconds > 59
	) {
		return { value: '', error: 'Enter a real time.' };
	}

	if (!showSeconds && seconds > 0) {
		return { value: '', error: 'Use hours and minutes only.' };
	}

	return {
		value: partsToTime({ hours, minutes, seconds }, { showSeconds }),
		error: '',
	};
}

function normalizeOption(option, options) {
	const record = option && typeof option === 'object' ? option : { value: option };
	const value = normalizeTimeValue(record.value, options) || parseTimeInput(record.value, options).value;
	return {
		...record,
		value,
		label: record.label || formatTimeDisplay(value, options),
		disabled: Boolean(record.disabled),
	};
}
