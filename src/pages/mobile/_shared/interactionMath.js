/**
 * Returns sorted, unique sheet fractions, retaining zero only as a dismiss stop.
 * Invalid input falls back to a usable half-height and expanded sheet.
 * @param {number[]} values Requested fractions of the available height.
 * @returns {number[]} Normalized stops in the inclusive range zero to one.
 */
export function normalizeSnapPoints(values) {
	const points = [...new Set((Array.isArray(values) ? values : []).filter((value) => Number.isFinite(value) && value >= 0 && value <= 1))].sort((a, b) => a - b);
	return points.some((point) => point > 0) ? points : [0, 0.5, 0.9];
}

/**
 * Chooses the nearest sheet stop after a short projection of release velocity.
 * @param {number[]} points Normalized stops.
 * @param {number} position Current height as a fraction of the available height.
 * @param {number} velocity Height change per millisecond, in fractional units.
 * @returns {number} Destination stop.
 */
export function resolveSnapPoint(points, position, velocity = 0) {
	const projected = Math.max(0, Math.min(1, position + velocity * 160));
	return points.reduce((nearest, point) => Math.abs(point - projected) < Math.abs(nearest - projected) ? point : nearest, points[0]);
}

/**
 * Determines whether a released swipe closes, reveals buttons, or commits an action.
 * Full swipes require explicit opt-in and actual distance, never velocity alone.
 * @param {object} options Measured gesture and action availability.
 * @returns {'close'|'reveal'|'commit'} Release outcome.
 */
export function resolveSwipeRelease({ distance, velocity = 0, actionWidth, rowWidth, fullSwipe = false, cancelled = false }) {
	if (cancelled || !actionWidth) return 'close';
	if (fullSwipe && distance >= Math.max(actionWidth + 48, rowWidth * 0.72)) return 'commit';
	return distance + velocity * 120 >= Math.min(48, actionWidth * 0.5) ? 'reveal' : 'close';
}

/**
 * Separates a likely software keyboard from browser chrome and pinch zoom.
 * @param {object} options Current viewport and editable-focus measurements.
 * @returns {number} Estimated keyboard height, or zero when not detected.
 */
export function keyboardHeight({ baseline, viewportHeight, scale = 1, editing = false }) {
	const difference = Math.max(0, baseline - viewportHeight);
	return editing && Math.abs(scale - 1) < 0.05 && difference > 120 ? Math.round(difference) : 0;
}
