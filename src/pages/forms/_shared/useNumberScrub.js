import { computed, onScopeDispose, ref, toValue, watch } from 'vue';

/**
 * Rounds a numeric adjustment to its step and bounds without floating-point noise.
 * Typed values are deliberately validated by the consuming field instead.
 *
 * @param {number} value Proposed numeric value.
 * @param {{ min?: number, max?: number, step?: number }} limits Adjustment limits.
 * @returns {number} Finite, bounded numeric value.
 */
export function clampNumber(value, { min, max, step = 1 } = {}) {
	const increment = Number.isFinite(step) && step > 0 ? step : 1;
	const lower = Number.isFinite(min) ? min : -Number.MAX_SAFE_INTEGER;
	const upper = Number.isFinite(max) ? Math.max(lower, max) : Number.MAX_SAFE_INTEGER;
	const base = Number.isFinite(value) ? value : Math.max(0, lower);
	const rounded = Number((Math.round(base / increment) * increment).toFixed(10));
	return Math.min(upper, Math.max(lower, rounded));
}

/**
 * Shares bounded mouse scrubbing between number fields, designer controls and pagination.
 * Updates are previews; consumers decide whether to update a model live or commit on release.
 * Mouse/pen gestures have a four-pixel threshold. Touch remains available for normal scrolling.
 *
 * @param {object} options Reactive values/getters: value, restoreValue, min, max, step, disabled, pixelsPerStep.
 * @param {Function} options.onPreview Receives each adjusted number.
 * @param {Function} [options.onCommit] Receives the final number once on pointer release.
 * @param {Function} [options.onCancel] Receives the original value when a gesture is cancelled.
 * @returns {object} Gesture state and pointer, wheel, keyboard-step and cancellation handlers.
 */
export function useNumberScrub(options) {
	const dragging = ref(false);
	const preview = ref(null);
	let session = null;
	let suppressClick = false;
	let wheelRemainder = 0;
	/** Reads only gesture configuration, so a preview model update does not cancel dragging. */
	const limits = computed(() => ({
		min: toValue(options.min),
		max: toValue(options.max),
		step: toValue(options.step) ?? 1,
		disabled: Boolean(toValue(options.disabled)),
		pixelsPerStep: Math.max(1, Number(toValue(options.pixelsPerStep)) || 2),
	}));

	/** Releases exactly the capture and listeners owned by the current gesture. */
	function cleanup() {
		const ended = session;
		if (!ended) return;
		session = null;
		ended.target.removeEventListener('pointermove', move);
		ended.target.removeEventListener('pointerup', end);
		ended.target.removeEventListener('pointercancel', cancelPointer);
		ended.target.removeEventListener('lostpointercapture', cancelPointer);
		ended.document.removeEventListener('keydown', onKeydown, true);
		ended.document.defaultView?.removeEventListener('blur', cancelPointer);
		if (ended.target.hasPointerCapture?.(ended.pointerId)) ended.target.releasePointerCapture(ended.pointerId);
		dragging.value = false;
		preview.value = null;
	}

	/**
	 * Cancels a gesture, optionally restoring a consumer's live preview.
	 *
	 * @param {boolean} restore Whether to notify the consumer to restore the original value.
	 */
	function cancel(restore = true) {
		const cancelled = session;
		const wasDragging = dragging.value;
		cleanup();
		if (cancelled && wasDragging && restore) options.onCancel?.(cancelled.original);
	}

	/** Cancels on pointer loss, pointer cancellation, or leaving the browser window. */
	function cancelPointer() {
		cancel();
	}

	/**
	 * Cancels before Escape can activate a containing overlay or form action.
	 *
	 * @param {KeyboardEvent} event Captured keyboard event.
	 */
	function onKeydown(event) {
		if (event.key !== 'Escape') return;
		event.preventDefault();
		event.stopPropagation();
		cancel();
	}

	/**
	 * Begins a possible drag without consuming an ordinary click or touch scroll.
	 *
	 * @param {PointerEvent} event Primary pointer press on the scrub handle.
	 */
	function start(event) {
		if (limits.value.disabled || event.button !== 0 || event.isPrimary === false || event.pointerType === 'touch') return;
		cancel(false);
		suppressClick = false;
		const target = event.currentTarget;
		const value = toValue(options.value);
		const original = options.restoreValue === undefined ? value : toValue(options.restoreValue);
		session = {
			target, document: target.ownerDocument, pointerId: event.pointerId,
			original, value: clampNumber(Number(value), limits.value),
			origin: event.clientX, lastX: event.clientX, remainder: 0,
		};
		target.setPointerCapture(event.pointerId);
		target.addEventListener('pointermove', move);
		target.addEventListener('pointerup', end);
		target.addEventListener('pointercancel', cancelPointer);
		target.addEventListener('lostpointercapture', cancelPointer);
		session.document.addEventListener('keydown', onKeydown, true);
		session.document.defaultView?.addEventListener('blur', cancelPointer);
		event.preventDefault();
	}

	/**
	 * Previews an incremental movement; reversing at a bound responds immediately.
	 *
	 * @param {PointerEvent} event Captured pointer movement.
	 */
	function move(event) {
		if (!session || event.pointerId !== session.pointerId) return;
		if (!dragging.value && Math.abs(event.clientX - session.origin) < 4) return;
		dragging.value = true;
		suppressClick = true;
		session.remainder += event.clientX - session.lastX;
		session.lastX = event.clientX;
		const steps = Math.trunc(session.remainder / limits.value.pixelsPerStep);
		session.remainder -= steps * limits.value.pixelsPerStep;
		const step = Number.isFinite(limits.value.step) && limits.value.step > 0 ? limits.value.step : 1;
		const next = clampNumber(session.value + steps * step * (event.shiftKey ? 10 : 1), limits.value);
		session.value = next;
		if (preview.value !== next) {
			preview.value = next;
			options.onPreview(next);
		}
		event.preventDefault();
	}

	/**
	 * Commits once on release, including the final movement before cleanup.
	 *
	 * @param {PointerEvent} event Captured pointer release.
	 */
	function end(event) {
		if (!session || event.pointerId !== session.pointerId) return;
		move(event);
		if (!session) return;
		const value = session.value;
		const changed = dragging.value;
		cleanup();
		if (changed) options.onCommit?.(value);
	}

	/**
	 * Prevents the synthetic click after a drag from opening a popover or focusing an input.
	 *
	 * @param {MouseEvent} event Click captured before trigger listeners run.
	 */
	function consumeClick(event) {
		if (!suppressClick || event.detail === 0) return;
		suppressClick = false;
		event.preventDefault();
		event.stopImmediatePropagation();
		event.stopPropagation();
	}

	/**
	 * Adjusts by whole steps for keyboard and focused wheel interaction.
	 *
	 * @param {number} direction Signed step count.
	 * @param {boolean} accelerated Whether Shift requests ten times the normal increment.
	 */
	function nudge(direction, accelerated = false) {
		if (limits.value.disabled || session) return;
		const step = Number.isFinite(limits.value.step) && limits.value.step > 0 ? limits.value.step : 1;
		const current = clampNumber(Number(toValue(options.value)), limits.value);
		options.onPreview(clampNumber(current + direction * step * (accelerated ? 10 : 1), limits.value));
	}

	/** Clears partial trackpad motion when focus leaves the field. */
	function resetWheel() {
		wheelRemainder = 0;
	}

	/**
	 * Converts focused wheel motion to deliberate steps while preserving pinch zoom.
	 * The consumer must call this only for its focused numeric field.
	 *
	 * @param {WheelEvent} event Non-passive wheel event.
	 */
	function wheel(event) {
		if (limits.value.disabled || session || event.ctrlKey || !event.deltaY) return;
		event.preventDefault();
		const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
		if (Math.sign(pixels) !== Math.sign(wheelRemainder)) wheelRemainder = 0;
		wheelRemainder += pixels;
		const steps = Math.trunc(wheelRemainder / 40);
		wheelRemainder -= steps * 40;
		if (steps) nudge(-steps, event.shiftKey);
	}

	/** Stops gestures without overwriting an externally changed bound or disabled model. */
	function configurationChanged() {
		cancel(false);
		resetWheel();
	}

	/** Disposes event listeners without emitting model changes during unmount. */
	function dispose() {
		cleanup();
	}

	watch(limits, configurationChanged, { flush: 'sync' });
	onScopeDispose(dispose);
	return { dragging, preview, start, cancel, consumeClick, nudge, wheel, resetWheel };
}
