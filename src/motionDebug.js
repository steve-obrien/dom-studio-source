import './motionDebug.css';

const MOTION_DEBUG_ATTRIBUTE = 'data-dom-studio-motion-debug';
const MOTION_DEBUG_LOCKED_ATTRIBUTE = 'data-dom-studio-motion-debug-locked';
const OPTION_DOUBLE_TAP_WINDOW_MS = 500;

/**
 * Installs the development motion debugger on a browser event target.
 *
 * Holding Option or Alt stretches CSS animations and transitions to the
 * configured debug duration. Double-tapping the modifier locks or unlocks
 * slow motion so pointer interactions remain available without holding a key.
 *
 * @param {EventTarget} [eventTarget=window] Browser target receiving keyboard and blur events.
 * @param {HTMLElement} [root=document.documentElement] Root element controlling the CSS override.
 * @returns {Function} Cleanup function that removes listeners and restores normal motion.
 */
export function installMotionDebugging(
	eventTarget = window,
	root = document.documentElement,
) {
	let optionHeld = false;
	let motionLocked = false;
	let lastOptionKeyDownAt = Number.NEGATIVE_INFINITY;

	/**
	 * Synchronizes the root debug attributes with held and locked state.
	 *
	 * @returns {void}
	 */
	function syncMotionState() {
		root.toggleAttribute(MOTION_DEBUG_ATTRIBUTE, optionHeld || motionLocked);
		root.toggleAttribute(MOTION_DEBUG_LOCKED_ATTRIBUTE, motionLocked);
	}

	/**
	 * Enables slow motion when Option or Alt participates in a key press.
	 *
	 * @param {KeyboardEvent} event Browser keyboard event.
	 * @returns {void}
	 */
	function handleKeyDown(event) {
		if (event.key !== 'Alt') {
			if (!event.altKey) return;

			optionHeld = true;
			syncMotionState();
			return;
		}

		if (event.repeat) return;

		const timeSinceLastPress = event.timeStamp - lastOptionKeyDownAt;

		optionHeld = true;

		if (timeSinceLastPress > 0 && timeSinceLastPress <= OPTION_DOUBLE_TAP_WINDOW_MS) {
			motionLocked = !motionLocked;
			lastOptionKeyDownAt = Number.NEGATIVE_INFINITY;
		} else {
			lastOptionKeyDownAt = event.timeStamp;
		}

		syncMotionState();
	}

	/**
	 * Stops momentary slow motion when Option or Alt is released.
	 *
	 * @param {KeyboardEvent} event Browser keyboard event.
	 * @returns {void}
	 */
	function handleKeyUp(event) {
		if (event.key !== 'Alt') return;

		optionHeld = false;
		syncMotionState();
	}

	/**
	 * Stops momentary slow motion when the app loses keyboard focus.
	 *
	 * @returns {void}
	 */
	function restoreMotion() {
		optionHeld = false;
		syncMotionState();
	}

	eventTarget.addEventListener('keydown', handleKeyDown);
	eventTarget.addEventListener('keyup', handleKeyUp);
	eventTarget.addEventListener('blur', restoreMotion);

	/**
	 * Removes motion-debug listeners and active root overrides.
	 *
	 * @returns {void}
	 */
	return function cleanupMotionDebugging() {
		eventTarget.removeEventListener('keydown', handleKeyDown);
		eventTarget.removeEventListener('keyup', handleKeyUp);
		eventTarget.removeEventListener('blur', restoreMotion);
		optionHeld = false;
		motionLocked = false;
		syncMotionState();
	};
}
