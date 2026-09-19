import './motionDebug.css';

const MOTION_DEBUG_ATTRIBUTE = 'data-dom-studio-motion-debug';
const MOTION_DEBUG_LOCKED_ATTRIBUTE = 'data-dom-studio-motion-debug-locked';
const CHORD_DOUBLE_TAP_WINDOW_MS = 500;

/**
 * Installs the development motion debugger on a browser event target.
 *
 * Holding Option+A or Alt+A stretches CSS animations and transitions to the
 * configured debug duration. Double-tapping the chord locks or unlocks
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
	let chordHeld = false;
	let motionLocked = false;
	let lastChordKeyDownAt = Number.NEGATIVE_INFINITY;

	/**
	 * Synchronizes the root debug attributes with held and locked state.
	 *
	 * @returns {void}
	 */
	function syncMotionState() {
		root.toggleAttribute(MOTION_DEBUG_ATTRIBUTE, chordHeld || motionLocked);
		root.toggleAttribute(MOTION_DEBUG_LOCKED_ATTRIBUTE, motionLocked);
	}

	/**
	 * Enables slow motion only for Alt+A, using physical KeyA for macOS Option characters.
	 *
	 * @param {KeyboardEvent} event Browser keyboard event.
	 * @returns {void}
	 */
	function handleKeyDown(event) {
		if (!event.altKey || event.code !== 'KeyA' || event.ctrlKey || event.metaKey || event.isComposing) return;
		if (event.target?.isContentEditable || event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
		event.preventDefault();
		if (event.repeat || chordHeld) return;

		const timeSinceLastPress = event.timeStamp - lastChordKeyDownAt;

		chordHeld = true;

		if (timeSinceLastPress > 0 && timeSinceLastPress <= CHORD_DOUBLE_TAP_WINDOW_MS) {
			motionLocked = !motionLocked;
			lastChordKeyDownAt = Number.NEGATIVE_INFINITY;
		} else {
			lastChordKeyDownAt = event.timeStamp;
		}

		syncMotionState();
	}

	/**
	 * Stops momentary slow motion when either Alt or the physical A key is released.
	 *
	 * @param {KeyboardEvent} event Browser keyboard event.
	 * @returns {void}
	 */
	function handleKeyUp(event) {
		if (event.key !== 'Alt' && event.code !== 'KeyA') return;

		chordHeld = false;
		syncMotionState();
	}

	/**
	 * Stops momentary slow motion when the app loses keyboard focus.
	 *
	 * @returns {void}
	 */
	function restoreMotion() {
		chordHeld = false;
		lastChordKeyDownAt = Number.NEGATIVE_INFINITY;
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
		chordHeld = false;
		motionLocked = false;
		syncMotionState();
	};
}
